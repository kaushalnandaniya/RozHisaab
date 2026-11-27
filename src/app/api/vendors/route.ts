import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { name: 'Sharma Household' } });
    }

    // Get all vendors with their total entry counts and recent entries
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
