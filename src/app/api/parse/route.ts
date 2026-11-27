import { NextRequest, NextResponse } from 'next/server';
import { parseTranscript } from '@/lib/ai-parser';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid transcript' }, { status: 400 });
    }

    const result = await parseTranscript(transcript);

    // Intent 1: ADD VENDOR VIA VOICE
    if (result.intent === 'add_vendor' && result.newVendor) {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({ data: { name: 'Sharma Household' } });
      }

      // Check if already exists
      const existing = await prisma.vendor.findFirst({
        where: {
          userId: user.id,
          displayName: { contains: result.newVendor.displayName }
        }
      });

      let savedVendor;
      if (existing) {
        savedVendor = await prisma.vendor.update({
          where: { id: existing.id },
          data: {
            unitRate: result.newVendor.unitRate,
            vendorPhone: result.newVendor.vendorPhone || existing.vendorPhone
          }
        });
      } else {
        savedVendor = await prisma.vendor.create({
          data: {
            userId: user.id,
            category: result.newVendor.category,
            displayName: result.newVendor.displayName,
            unit: result.newVendor.unit,
            unitRate: result.newVendor.unitRate,
            vendorPhone: result.newVendor.vendorPhone,
            icon: result.newVendor.icon,
            color: result.newVendor.color
          }
        });
      }

      result.spokenResponseHindi = `Naya vendor ${savedVendor.displayName} jud gaya! Rate ₹${savedVendor.unitRate} per ${savedVendor.unit}.`;
      return NextResponse.json({
        ...result,
        savedVendor
      });
    }

    // Intent 2: QUERY HISAAB VIA VOICE
    if (result.intent === 'query_hisaab' && result.query) {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({ data: { name: 'Sharma Household' } });
      }

      const whereClause: any = { userId: user.id };
      if (result.query.targetCategory) {
        whereClause.category = result.query.targetCategory;
      }

      const vendors = await prisma.vendor.findMany({
        where: whereClause,
        include: {
          entries: true
        }
      });

      let totalSpend = 0;
      let totalQty = 0;
      let pendingJars = 0;
      let vendorNames: string[] = [];

      for (const v of vendors) {
        vendorNames.push(v.displayName);
        pendingJars += v.jarDepositBalance;
        for (const e of v.entries) {
          totalSpend += e.amountCalculated;
          totalQty += e.quantity;
        }
      }

      let spokenAnswer = '';
      if (result.query.targetCategory === 'water') {
        spokenAnswer = `Is mahine paani ka kul hisaab ₹${totalSpend.toFixed(0)} hua hai (${totalQty} cans). Aapke paas ${pendingJars} khali jar pending hain.`;
      } else if (result.query.targetCategory === 'milk') {
        spokenAnswer = `Is mahine doodh ka hisaab ₹${totalSpend.toFixed(0)} hua hai (${totalQty} Litres).`;
      } else if (result.query.targetCategory === 'laundry') {
        spokenAnswer = `Is mahine press ke ${totalQty} kapde diye gaye hain, kul ₹${totalSpend.toFixed(0)}.`;
      } else {
        spokenAnswer = `Is mahine sabhi vendors ka kul kharch ₹${totalSpend.toFixed(0)} hua hai.`;
      }

      result.spokenResponseHindi = spokenAnswer;
      result.queryAnswer = {
        title: result.query.targetCategory ? `${result.query.targetCategory.toUpperCase()} Hisaab` : 'Is Mahine Ka Kharch',
        summary: spokenAnswer,
        amount: totalSpend,
        details: `${totalQty} units recorded across ${vendors.length} vendor(s)`
      };

      return NextResponse.json(result);
    }

    // Intent 3: VENDOR ROUTE DELIVERY BATCH (Vyapari Mode)
    if (result.intent === 'vendor_delivery' && result.deliveries) {
      let user = await prisma.user.findFirst();
      if (!user) user = await prisma.user.create({ data: { name: 'Sharma Household' } });

      for (const del of result.deliveries) {
        // Find matching customer or create
        let customer = await prisma.customer.findFirst({
          where: { userId: user.id, flatNumber: { contains: del.flatNumber } }
        });

        if (customer && del.action !== 'absent') {
          await prisma.customer.update({
            where: { id: customer.id },
            data: {
              pendingBalance: customer.pendingBalance + (del.quantity * 68) // default unit rate
            }
          });
        }
      }

      return NextResponse.json(result);
    }

    // Intent 4: LOG_ENTRY (Default Household)
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/parse:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse' }, { status: 500 });
  }
}
