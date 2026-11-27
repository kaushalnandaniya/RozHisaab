import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDefaults() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: 'default-user',
        name: 'Sharma Household',
        language: 'hi',
        role: 'household',
        householdCode: 'SHARMA-402',
        activeMemberName: 'Kaushal'
      }
    });
  }

  const defaultVendors = [
    {
      category: 'milk',
      displayName: 'Doodh Wala (Raju Bhai)',
      unit: 'litres',
      unitRate: 68,
      icon: '🥛',
      color: '#3B82F6',
      vendorPhone: '9876543210'
    },
    {
      category: 'water',
      displayName: 'Paani Wala (Shree Jal)',
      unit: 'cans',
      unitRate: 40,
      jarDepositBalance: 2,
      icon: '💧',
      color: '#06B6D4',
      vendorPhone: '9876543211'
    },
    {
      category: 'laundry',
      displayName: 'Presswala (Mohan Dhobi)',
      unit: 'pieces',
      unitRate: 10,
      icon: '👔',
      color: '#8B5CF6',
      vendorPhone: '9876543212'
    },
    {
      category: 'maid',
      displayName: 'Kaam Wali (Sunita Didi)',
      unit: 'day',
      unitRate: 150,
      icon: '🧹',
      color: '#F59E0B',
      vendorPhone: '9876543213'
    },
    {
      category: 'tiffin',
      displayName: 'Tiffin Service (Maa Ki Rasoi)',
      unit: 'meals',
      unitRate: 90,
      icon: '🍱',
      color: '#10B981',
      vendorPhone: '9876543214'
    }
  ];

  for (const v of defaultVendors) {
    const existing = await prisma.vendor.findFirst({
      where: { userId: user.id, category: v.category }
    });
    if (!existing) {
      await prisma.vendor.create({
        data: {
          userId: user.id,
          ...v
        }
      });
    }
  }

  // Seed default vendor customers (for Vyapari Mode)
  const defaultCustomers = [
    { flatNumber: 'Flat 402', customerName: 'Sharma Ji', phone: '9876543210', dailyQuantity: 1.5, pendingBalance: 2040 },
    { flatNumber: 'Flat 501', customerName: 'Verma Ji', phone: '9876543222', dailyQuantity: 2.0, pendingBalance: 2720 },
    { flatNumber: 'Flat 104', customerName: 'Patel Ji', phone: '9876543233', dailyQuantity: 1.0, pendingBalance: 1360 },
    { flatNumber: 'Flat 302', customerName: 'Gupta Ji', phone: '9876543244', dailyQuantity: 1.5, pendingBalance: 1904 }
  ];

  for (const c of defaultCustomers) {
    let customer = await prisma.customer.findFirst({
      where: { userId: user.id, flatNumber: c.flatNumber }
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId: user.id,
          ...c
        }
      });
    }

    // Seed calendar deliveries for November (days 1 to 26)
    const existingDeliveries = await prisma.customerDelivery.findFirst({
      where: { customerId: customer.id }
    });

    if (!existingDeliveries) {
      for (let day = 1; day <= 26; day++) {
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const dateStr = `2026-11-${dayStr}`;
        const isAbsent = (c.flatNumber === 'Flat 104' && day === 15) || (c.flatNumber === 'Flat 501' && day === 10);
        const isExtra = (c.flatNumber === 'Flat 302' && day === 20); // Gupta Ji had extra on Nov 20
        const qty = isAbsent ? 0 : (isExtra ? c.dailyQuantity + 1.0 : c.dailyQuantity);
        const amount = qty * 68;

        await prisma.customerDelivery.create({
          data: {
            customerId: customer.id,
            deliveryDate: dateStr,
            quantity: qty,
            unit: 'litres',
            action: isAbsent ? 'absent' : (isExtra ? 'extra' : 'received'),
            amount: amount,
            notes: isAbsent ? 'Chhutti' : (isExtra ? 'Extra 1L' : 'Regular supply')
          }
        });
      }
    }
  }

  console.log('RozHisaab default user, vendors, and customers seeded successfully!');
}

seedDefaults()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
