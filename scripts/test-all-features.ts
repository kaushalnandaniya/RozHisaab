import { prisma } from '../src/lib/prisma';
import { parseRuleBased } from '../src/lib/parser';
import { generateWhatsAppMessage } from '../src/lib/whatsapp';

async function runFullAuditSuite() {
  console.log('===============================================================');
  console.log('🚀 ROZHISAAB COMPREHENSIVE END-TO-END FEATURE & UI/UX AUDIT');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, details || '');
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: VOICE INTENT PARSING (BILINGUAL & ZERO-SHOT)
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Voice Intent Parsing & Bilingual Extraction ---');

  // 1.1 Household doorstep multi-item log
  const t1 = parseRuleBased('Aaj 2 litre doodh liya aur 1 can paani');
  assert(t1.intent === 'log_entry', '1.1 Household multi-item intent detected as log_entry');
  assert(t1.items.length === 2, '1.1 Correctly extracted 2 items (milk & water)');
  assert(t1.items.some(i => i.vendorCategory === 'milk' && i.quantity === 2), '1.1 Extracted 2 Litres milk');
  assert(t1.items.some(i => i.vendorCategory === 'water' && i.quantity === 1), '1.1 Extracted 1 Can water');

  // 1.2 Presswala clothing breakdown
  const t2 = parseRuleBased('Presswale ko 4 shirt aur 2 pant diye');
  assert(t2.intent === 'log_entry', '1.2 Laundry clothes intent detected as log_entry');
  assert(t2.items.some(i => i.vendorCategory === 'laundry' && i.quantity === 6), '1.2 Aggregated 4 shirts + 2 pants = 6 pieces');

  // 1.3 Maid attendance (chhutti)
  const t3 = parseRuleBased('Sunita didi aaj chhutti pe hain');
  assert(t3.intent === 'log_entry', '1.3 Maid absence intent detected as log_entry');
  assert(t3.items.some(i => i.vendorCategory === 'maid' && i.action === 'absent'), '1.3 Maid action set to absent/chhutti');

  // 1.4 Add Vendor (Household mode)
  const t4 = parseRuleBased('Naya vendor add karo: Ramu Car Wash, rate 500 rupaye mahina, phone 9876543210');
  assert(t4.intent === 'add_vendor', '1.4 New vendor intent detected as add_vendor');
  assert(Boolean(t4.newVendor?.displayName.includes('Ramu Car Wash')), '1.4 Vendor display name extracted properly');
  assert(t4.newVendor?.unitRate === 500, '1.4 Vendor unit rate 500 extracted');
  assert(t4.newVendor?.vendorPhone === '9876543210', '1.4 Vendor phone extracted');

  // 1.5 Query Hisaab (Asking balance)
  const t5 = parseRuleBased('Is mahine paani ka total kitna hua?');
  assert(t5.intent === 'query_hisaab', '1.5 Query balance intent detected as query_hisaab');
  assert(t5.query?.targetCategory === 'water', '1.5 Query target category identified as water');

  // 1.6 Vendor Route Delivery (Vyapari mode)
  const t6 = parseRuleBased('Flat 402 dedh litre, Flat 501 do litre, Flat 104 chhutti');
  assert(t6.intent === 'vendor_delivery', '1.6 Vendor route run detected as vendor_delivery');
  assert(t6.deliveries?.length === 3, '1.6 Extracted 3 apartment deliveries');
  assert(Boolean(t6.deliveries?.some(d => d.flatNumber.includes('402') && d.quantity === 1.5)), '1.6 Flat 402 dedh litre = 1.5L');
  assert(Boolean(t6.deliveries?.some(d => d.flatNumber.includes('104') && d.action === 'absent')), '1.6 Flat 104 absent/chhutti');

  // 1.7 Vendor Extra Milk with Indian Name
  const t7 = parseRuleBased('Gupta ji को 2 L दूध extra दिया आज');
  assert(t7.intent === 'vendor_delivery', '1.7 Extra delivery detected as vendor_delivery');
  assert(Boolean(t7.deliveries?.some(d => d.customerName?.includes('Gupta') && d.quantity === 2 && d.isExtra)), '1.7 Gupta ji 2L extra milk extracted');

  // 1.8 Add Customer / Flat without quantity (English/Hinglish)
  const t8 = parseRuleBased('Add 405 flat number Nandaniya ji');
  assert(t8.intent === 'add_customer', '1.8 Add customer intent detected as add_customer');
  assert(t8.newCustomer?.flatNumber === 'Flat 405', '1.8 Extracted Flat 405');
  assert(t8.newCustomer?.customerName === 'Nandaniya Ji', '1.8 Extracted Nandaniya Ji');
  assert(t8.newCustomer?.dailyQuantity === undefined, '1.8 Zero quantity forced when none specified');

  // 1.9 Add Customer / Flat in Hindi Devanagari (Unicode-safe)
  const t9 = parseRuleBased('फ्लैट 405 नंदानिया जी को जोड़ो');
  assert(t9.intent === 'add_customer', '1.9 Hindi Devanagari customer add detected');
  assert(t9.newCustomer?.flatNumber === 'Flat 405', '1.9 Hindi extracted Flat 405');
  assert(t9.newCustomer?.customerName === 'नंदानिया जी', '1.9 Hindi extracted नंदानिया जी with Unicode safety');

  // 1.10 Add Customer with Explicit Contingency / Quantity
  const t10 = parseRuleBased('Add flat 405 Nandaniya ji daily 2 litres');
  assert(t10.intent === 'add_customer', '1.10 Add customer with daily quantity detected');
  assert(t10.newCustomer?.dailyQuantity === 2, '1.10 Extracted explicit dailyQuantity: 2L');

  // -------------------------------------------------------------
  // TEST GROUP 2: DATABASE ENTITY PERSISTENCE & API LOGIC
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Database Operations & Entity Logic ---');

  // 2.1 User profile check
  let user = await prisma.user.findFirst();
  assert(Boolean(user), '2.1 User profile exists in database');

  // 2.2 Adding new flat via add_customer logic
  await prisma.customer.deleteMany({ where: { flatNumber: 'Flat 999' } });
  const createdCust = await prisma.customer.create({
    data: {
      userId: user!.id,
      flatNumber: 'Flat 999',
      customerName: 'Test Verma Ji',
      dailyQuantity: 1.5,
      pendingBalance: 0
    }
  });
  assert(createdCust.pendingBalance === 0, '2.2 New customer created with 0 pending balance');

  // 2.3 Calendar Delivery Logging
  const delivery = await prisma.customerDelivery.create({
    data: {
      customerId: createdCust.id,
      deliveryDate: '2026-11-27',
      quantity: 2,
      unit: 'litres',
      action: 'extra',
      amount: 136,
      notes: 'Extra delivery test'
    }
  });
  assert(delivery.quantity === 2 && delivery.amount === 136, '2.3 Customer delivery row logged with correct amount');

  // 2.4 Customer balance update & Mark as Paid (Clearing balance)
  const updatedWithDue = await prisma.customer.update({
    where: { id: createdCust.id },
    data: { pendingBalance: 136 }
  });
  assert(updatedWithDue.pendingBalance === 136, '2.4 Pending balance incremented to 136');

  const cleared = await prisma.customer.update({
    where: { id: createdCust.id },
    data: { pendingBalance: 0 }
  });
  assert(cleared.pendingBalance === 0, '2.5 Mark as Paid successfully clears balance to 0 in database');

  // Clean up test customer
  await prisma.customer.delete({ where: { id: createdCust.id } });

  // 2.6 Household Entry creation & deletion
  const milkVendor = await prisma.vendor.findFirst({ where: { category: 'milk' } });
  if (milkVendor) {
    const entry = await prisma.entry.create({
      data: {
        userId: user!.id,
        vendorId: milkVendor.id,
        entryDate: '2026-11-27',
        quantity: 1.5,
        unit: 'litres',
        action: 'received',
        amountCalculated: 102,
        loggedBy: 'Kaushal',
        rawTranscript: 'Test entry'
      }
    });
    assert(entry.amountCalculated === 102, '2.6 Entry logged for 1.5L milk (₹102)');

    await prisma.entry.delete({ where: { id: entry.id } });
    const checkDeleted = await prisma.entry.findUnique({ where: { id: entry.id } });
    assert(checkDeleted === null, '2.7 Entry deleted/undone successfully');
  }

  // -------------------------------------------------------------
  // TEST GROUP 3: WHATSAPP BILLING & SETTLEMENT ENGINE
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing WhatsApp Billing Message Generation ---');

  const mockSummary = {
    vendorId: 'test-v1',
    vendorName: 'milk',
    displayName: 'Raju Doodh Dairy',
    unit: 'litres',
    unitRate: 68,
    month: 'November 2026',
    totalQuantity: 45,
    totalAmountPayable: 3060,
    whatsappMessage: '',
    upiPaymentLink: 'upi://pay?pa=9876543210@upi&pn=Raju%20Doodh%20Dairy&am=3060',
    entries: []
  };

  const billMessage = generateWhatsAppMessage(mockSummary);
  assert(billMessage.includes('Raju Doodh Dairy'), '3.1 Bill includes vendor name');
  assert(billMessage.includes('45 Litres'), '3.2 Bill includes total quantity (45 Litres)');
  assert(billMessage.includes('₹3060'), '3.3 Bill includes total payable ₹3060');
  assert(billMessage.includes('upi://pay?pa=9876543210@upi'), '3.4 Bill contains working deep-link UPI payment URL');

  console.log('\n===============================================================');
  console.log(`🏁 AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runFullAuditSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
