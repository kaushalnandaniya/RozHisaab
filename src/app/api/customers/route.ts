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
      include: {
        deliveries: {
          orderBy: { deliveryDate: 'asc' }
        }
      },
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
      },
      include: {
        deliveries: true
      }
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, deliveryDate, quantity, action, notes } = body;

    if (!customerId || !deliveryDate) {
      return NextResponse.json({ error: 'Missing customerId or deliveryDate' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const qty = parseFloat(quantity) || 0;
    const unitRate = 68;
    const newAmount = action === 'absent' ? 0 : qty * unitRate;

    // Check if delivery already exists for this date
    const existingDelivery = await prisma.customerDelivery.findFirst({
      where: { customerId, deliveryDate }
    });

    let diff = newAmount;
    if (existingDelivery) {
      diff = newAmount - existingDelivery.amount;
      await prisma.customerDelivery.update({
        where: { id: existingDelivery.id },
        data: {
          quantity: qty,
          action: action || 'received',
          amount: newAmount,
          notes: notes || undefined
        }
      });
    } else {
      await prisma.customerDelivery.create({
        data: {
          customerId,
          deliveryDate,
          quantity: qty,
          unit: 'litres',
          action: action || 'received',
          amount: newAmount,
          notes: notes || undefined
        }
      });
    }

    // Update customer's pending balance by the difference
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        pendingBalance: Math.max(0, customer.pendingBalance + diff)
      },
      include: {
        deliveries: {
          orderBy: { deliveryDate: 'asc' }
        }
      }
    });

    return NextResponse.json({ success: true, customer: updatedCustomer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing customer id' }, { status: 400 });
    }

    await prisma.customer.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Customer deleted from route' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
