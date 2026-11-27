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

    // Intent 2.5: ADD CUSTOMER TO ROUTE VIA VOICE (Vyapari Mode)
    if (result.intent === 'add_customer' && result.newCustomer) {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({ data: { name: 'Sharma Household' } });
      }

      const { flatNumber, customerName, dailyQuantity, phone } = result.newCustomer;
      const cleanName = customerName.replace(/(?:ji|जी|bhai|भाई|flat|फ्लैट)/gi, '').trim();

      // Check if customer already exists on this route
      let customer = await prisma.customer.findFirst({
        where: {
          userId: user.id,
          OR: [
            { flatNumber: { contains: flatNumber } },
            { flatNumber: { contains: cleanName } },
            { customerName: { contains: cleanName } }
          ]
        }
      });

      let savedCustomer;
      if (customer) {
        savedCustomer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            flatNumber,
            customerName,
            dailyQuantity: dailyQuantity !== undefined ? dailyQuantity : customer.dailyQuantity,
            phone: phone || customer.phone
          }
        });
      } else {
        savedCustomer = await prisma.customer.create({
          data: {
            userId: user.id,
            flatNumber,
            customerName,
            dailyQuantity: dailyQuantity || 1.5,
            phone: phone || undefined,
            pendingBalance: 0 // ZERO pending balance, NO delivery created!
          }
        });
      }

      return NextResponse.json({
        ...result,
        savedCustomer
      });
    }

    // Intent 3: VENDOR ROUTE DELIVERY BATCH (Vyapari Mode)
    if (result.intent === 'vendor_delivery' && result.deliveries) {
      let user = await prisma.user.findFirst();
      if (!user) user = await prisma.user.create({ data: { name: 'Sharma Household' } });

      const updatedCustomers: any[] = [];
      const today = new Date().toISOString().split('T')[0];

      for (const del of result.deliveries) {
        // Normalize name for flexible searching (e.g. "Gupta Ji" -> "Gupta", "गुप्ता जी" -> "गुप्ता")
        const rawTarget = del.customerName || del.flatNumber;
        const cleanName = rawTarget.replace(/(?:ji|जी|bhai|भाई|flat|फ्लैट)/gi, '').trim();

        // Find customer by customerName OR flatNumber
        let customer = await prisma.customer.findFirst({
          where: {
            userId: user.id,
            OR: [
              { flatNumber: { contains: del.flatNumber } },
              { flatNumber: { contains: cleanName } },
              { customerName: { contains: cleanName } },
              { customerName: { contains: del.customerName || '___none___' } }
            ]
          }
        });

        // If not found yet and name is provided, auto-create customer on route
        if (!customer && cleanName.length >= 2) {
          customer = await prisma.customer.create({
            data: {
              userId: user.id,
              flatNumber: del.flatNumber.startsWith('Flat') ? del.flatNumber : `Flat ${del.flatNumber}`,
              customerName: del.customerName || `${cleanName} Ji`,
              dailyQuantity: del.quantity || 1.5,
              pendingBalance: 0
            }
          });
        }

        if (customer) {
          const unitRate = 68; // ₹68 per litre / unit
          const deliveryAmount = del.action === 'absent' ? 0 : (del.quantity * unitRate);

          // 1. Update customer's pending balance
          const updatedCust = await prisma.customer.update({
            where: { id: customer.id },
            data: {
              pendingBalance: customer.pendingBalance + deliveryAmount
            }
          });

          // 2. Record CustomerDelivery entry for the calendar
          await prisma.customerDelivery.create({
            data: {
              customerId: customer.id,
              deliveryDate: today,
              quantity: del.quantity,
              unit: del.unit || 'litres',
              action: del.action,
              amount: deliveryAmount,
              notes: del.isExtra ? 'Extra milk delivered' : (del.action === 'absent' ? 'Chhutti' : 'Regular delivery')
            }
          });

          updatedCustomers.push({
            id: updatedCust.id,
            flatNumber: updatedCust.flatNumber,
            customerName: updatedCust.customerName,
            newBalance: updatedCust.pendingBalance,
            quantity: del.quantity,
            isExtra: del.isExtra,
            action: del.action
          });
        }
      }

      // Check if any customer was actually updated
      if (updatedCustomers.length === 0) {
        return NextResponse.json({
          success: false,
          error: true,
          intent: 'vendor_delivery',
          reason: 'Customer ya Flat number aapke route mein match nahi hua.',
          suggestion: 'Aapne jo naam ya flat bola (jaise Gupta Ji ya Flat 402), woh aapke customer book mein nahi mila. Kripya flat number saaf boliye.',
          transcript,
          spokenResponseHindi: 'Hisaab update nahi ho paya. Yeh flat ya customer aapke route mein nahi mile.'
        });
      }

      // Enhanced spoken Hindi confirmation with new balance
      const primary = updatedCustomers[0];
      if (primary.action === 'absent') {
        result.spokenResponseHindi = `${primary.customerName} (${primary.flatNumber}) ki aaj chhutti note ho gayi!`;
      } else {
        result.spokenResponseHindi = `${primary.customerName} (${primary.flatNumber}) ko ${primary.quantity} Litre ${primary.isExtra ? 'extra ' : ''}doodh note ho gaya! Naya balance: ₹${primary.newBalance.toFixed(0)}`;
      }

      return NextResponse.json({ ...result, updatedCustomers });
    }

    // Intent 4: LOG_ENTRY (Default Household)
    if (result.intent === 'log_entry' && (!result.items || result.items.length === 0)) {
      return NextResponse.json({
        success: false,
        error: true,
        intent: 'log_entry',
        reason: 'Aapki aawaaz mein koi doorstep service (doodh, paani, press, maid) detect nahi hui.',
        suggestion: 'Boliye: "Aaj doodh dedh litre liya aur 2 water can aaye" ya "Sunita didi chhutti pe hain".',
        transcript,
        spokenResponseHindi: 'Hisaab update nahi ho paya. Kripya doodh, paani ya maid bolkar bataiye.'
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/parse:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse' }, { status: 500 });
  }
}
