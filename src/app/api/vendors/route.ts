import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { name: 'Sharma Household' } });
    }

    const vendors = await prisma.vendor.findMany({
      where: { userId: user.id },
      include: {
        entries: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    return NextResponse.json({ vendors });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { displayName, category, unit, unitRate, vendorPhone, icon, color } = body;

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { name: 'Sharma Household' } });
    }

    const vendor = await prisma.vendor.create({
      data: {
        userId: user.id,
        category: category || 'custom',
        displayName: displayName || 'New Vendor',
        unit: unit || 'units',
        unitRate: unitRate !== undefined ? parseFloat(unitRate) : 50,
        vendorPhone: vendorPhone || null,
        icon: icon || '🏷️',
        color: color || '#3B82F6'
      }
    });

    return NextResponse.json({ success: true, vendor });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, displayName, unitRate, vendorPhone, jarDepositBalance } = body;

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        displayName,
        unitRate: unitRate !== undefined ? parseFloat(unitRate) : undefined,
        vendorPhone,
        jarDepositBalance: jarDepositBalance !== undefined ? parseInt(jarDepositBalance) : undefined
      }
    });

    return NextResponse.json({ success: true, vendor: updated });
  } catch (error: any) {
    console.error('Error updating vendor:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing vendor id' }, { status: 400 });
    }

    await prisma.vendor.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Vendor deleted' });
  } catch (error: any) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
