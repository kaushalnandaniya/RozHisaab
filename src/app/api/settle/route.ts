import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWhatsAppMessage, createWhatsAppShareLink } from '@/lib/whatsapp';
import { SettlementSummary } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const vendorId = req.nextUrl.searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: 'Missing vendorId' }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        entries: {
          orderBy: { entryDate: 'asc' }
        }
      }
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    let totalQuantity = 0;
    let totalDaysPresent = 0;
    let totalDaysAbsent = 0;
    let totalEmptyReturned = 0;
    let advanceDeducted = 0;
    let totalAmountPayable = 0;

    for (const e of vendor.entries) {
      if (e.action === 'advance') {
        advanceDeducted += e.amountCalculated;
        totalAmountPayable -= e.amountCalculated;
      } else if (e.action === 'absent') {
        totalDaysAbsent += 1;
      } else if (e.action === 'received' || e.action === 'given') {
        totalQuantity += e.quantity;
        totalAmountPayable += e.amountCalculated;
        if (vendor.unit === 'day') {
          totalDaysPresent += 1;
        }
      }

      if (e.metadata) {
        try {
          const meta = JSON.parse(e.metadata);
          if (meta.emptyReturned) {
            totalEmptyReturned += meta.emptyReturned;
          }
        } catch (err) {
          console.warn(err);
        }
      }
    }

    // Default UPI link placeholder (can be customized)
    const upiLink = vendor.vendorPhone 
      ? `upi://pay?pa=${vendor.vendorPhone}@upi&pn=${encodeURIComponent(vendor.displayName)}&am=${totalAmountPayable.toFixed(0)}`
      : undefined;

    const summary: SettlementSummary = {
      vendorId: vendor.id,
      vendorName: vendor.category,
      displayName: vendor.displayName,
      unit: vendor.unit,
      unitRate: vendor.unitRate,
      month: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      totalQuantity,
      totalDaysPresent,
      totalDaysAbsent,
      totalEmptyReturned,
      pendingJarBalance: vendor.jarDepositBalance,
      advanceDeducted,
      totalAmountPayable: Math.max(0, totalAmountPayable),
      whatsappMessage: '',
      upiPaymentLink: upiLink,
      entries: vendor.entries as any
    };

    summary.whatsappMessage = generateWhatsAppMessage(summary);
    const shareUrl = createWhatsAppShareLink(vendor.vendorPhone || undefined, summary.whatsappMessage);

    return NextResponse.json({
      summary,
      shareUrl
    });
  } catch (error: any) {
    console.error('Error generating settlement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
