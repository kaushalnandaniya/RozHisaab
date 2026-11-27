import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get('date'); // optional YYYY-MM-DD
    const vendorId = req.nextUrl.searchParams.get('vendorId');

    const where: any = {};
    if (date) where.entryDate = date;
    if (vendorId) where.vendorId = vendorId;

    const entries = await prisma.entry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { vendor: true }
    });

    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error('Error fetching entries:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      vendorCategory,
      vendorName,
      quantity,
      unit,
      action,
      emptyReturned,
      itemsDetail,
      advanceAmount,
      notes,
      rawTranscript,
      entryDate = new Date().toISOString().split('T')[0]
    } = body;

    // Get default user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { name: 'Home' } });
    }

    // Find or create matching vendor
    let vendor = await prisma.vendor.findFirst({
      where: {
        userId: user.id,
        category: vendorCategory || 'custom'
      }
    });

    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          userId: user.id,
          category: vendorCategory || 'custom',
          displayName: vendorName || 'Other Vendor',
          unit: unit || 'units',
          unitRate: 50,
          icon: '📦'
        }
      });
    }

    // Calculate amount
    let calculatedAmount = 0;
    if (action === 'advance' && advanceAmount) {
      calculatedAmount = advanceAmount;
    } else if (action === 'received' || action === 'given') {
      calculatedAmount = (quantity || 0) * (vendor.unitRate || 0);
    }

    // If water, adjust jar deposit balance
    if (vendorCategory === 'water' && (emptyReturned || quantity)) {
      const netJarChange = (quantity || 0) - (emptyReturned || 0);
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          jarDepositBalance: Math.max(0, vendor.jarDepositBalance + netJarChange)
        }
      });
    }

    const metadataObj: any = {};
    if (emptyReturned) metadataObj.emptyReturned = emptyReturned;
    if (itemsDetail) metadataObj.items = itemsDetail;
    if (notes) metadataObj.notes = notes;

    const entry = await prisma.entry.create({
      data: {
        userId: user.id,
        vendorId: vendor.id,
        entryDate,
        quantity: quantity || 0,
        unit: unit || vendor.unit,
        action: action || 'received',
        metadata: JSON.stringify(metadataObj),
        amountCalculated: calculatedAmount,
        rawTranscript: rawTranscript || ''
      },
      include: { vendor: true }
    });

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    console.error('Error creating entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing entry id' }, { status: 400 });

    const existing = await prisma.entry.findUnique({
      where: { id },
      include: { vendor: true }
    });

    if (existing && existing.vendor.category === 'water') {
      // Revert jar balance if needed
      try {
        const meta = existing.metadata ? JSON.parse(existing.metadata) : {};
        const empty = meta.emptyReturned || 0;
        const netChange = existing.quantity - empty;
        await prisma.vendor.update({
          where: { id: existing.vendorId },
          data: {
            jarDepositBalance: Math.max(0, existing.vendor.jarDepositBalance - netChange)
          }
        });
      } catch (e) {
        console.warn('Revert jar balance parse err:', e);
      }
    }

    await prisma.entry.delete({ where: { id } });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error deleting entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
