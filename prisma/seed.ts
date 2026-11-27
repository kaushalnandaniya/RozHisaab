import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDefaults() {
  // Ensure default demo user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: 'default-user',
        name: 'Sharma Household',
        language: 'hi'
      }
    });
  }

  // Ensure default vendors exist
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
      unitRate: 150, // daily equivalent of ₹4500/mo
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

  console.log('RozHisaab default user and vendors seeded successfully!');
}

seedDefaults()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
