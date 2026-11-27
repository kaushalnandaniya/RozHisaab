import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { name: 'Sharma Household' } });
    }

    const customers = await prisma.customer.findMany({
      where: { userId: user.id },
      orderBy: { flatNumber: 'asc' }
    });

    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { flatNumber, customerName, phone, dailyQuantity, pendingBalance } = body;

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { name: 'Sharma Household' } });
    }

    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        flatNumber: flatNumber || 'Flat 101',
        customerName: customerName || 'Customer',
        phone: phone || null,
        dailyQuantity: dailyQuantity !== undefined ? parseFloat(dailyQuantity) : 1.0,
        pendingBalance: pendingBalance !== undefined ? parseFloat(pendingBalance) : 0
      }
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
