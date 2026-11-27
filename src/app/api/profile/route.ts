import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Sharma Household',
          role: 'household',
          householdCode: 'SHARMA-402',
          activeMemberName: 'Kaushal',
          vendorBusinessName: 'Raju Doodh Dairy',
          vendorCategory: 'milk',
          vendorRouteName: 'Gokuldham Heights - Tower A'
        }
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        householdCode: user.householdCode,
        activeMemberName: user.activeMemberName,
        vendorBusinessName: user.vendorBusinessName || 'Raju Doodh Dairy',
        vendorCategory: user.vendorCategory || 'milk',
        vendorRouteName: user.vendorRouteName || 'Gokuldham Heights - Tower A',
        availableMembers: ['Kaushal', 'Mummy', 'Papa', 'Sister', 'Grandpa']
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      role, 
      activeMemberName, 
      householdCode, 
      vendorBusinessName, 
      vendorCategory, 
      vendorRouteName 
    } = body;

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { name: 'Sharma Household' } });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: role !== undefined ? role : undefined,
        activeMemberName: activeMemberName !== undefined ? activeMemberName : undefined,
        householdCode: householdCode !== undefined ? householdCode : undefined,
        vendorBusinessName: vendorBusinessName !== undefined ? vendorBusinessName : undefined,
        vendorCategory: vendorCategory !== undefined ? vendorCategory : undefined,
        vendorRouteName: vendorRouteName !== undefined ? vendorRouteName : undefined
      }
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
