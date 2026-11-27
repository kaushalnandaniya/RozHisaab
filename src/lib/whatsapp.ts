/**
 * WhatsApp deep link and bilingual bill settlement card generator.
 */
import { SettlementSummary } from '@/types';

export function generateWhatsAppMessage(summary: SettlementSummary): string {
  const dateStr = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  
  let lines: string[] = [];
  lines.push(`🙏 *Namaste ${summary.displayName} Bhaiya*,`);
  lines.push(`*RozHisaab - ${dateStr} Bill Summary* 📋`);
  lines.push(`-----------------------------------`);

  if (summary.vendorName.toLowerCase().includes('water') || summary.unit === 'cans') {
    lines.push(`💧 *Delivered Cans:* ${summary.totalQuantity} cans (₹${summary.unitRate}/can)`);
    if (summary.totalEmptyReturned !== undefined) {
      lines.push(`🔄 *Empty Jars Returned:* ${summary.totalEmptyReturned} jars`);
    }
    if (summary.pendingJarBalance !== undefined && summary.pendingJarBalance > 0) {
      lines.push(`⚠️ *Pending Empty Jars with us:* ${summary.pendingJarBalance}`);
    }
  } else if (summary.vendorName.toLowerCase().includes('milk') || summary.unit === 'litres') {
    lines.push(`🥛 *Total Milk Taken:* ${summary.totalQuantity} Litres (₹${summary.unitRate}/L)`);
  } else if (summary.vendorName.toLowerCase().includes('laundry') || summary.unit === 'pieces') {
    lines.push(`👔 *Total Clothes Given for Ironing:* ${summary.totalQuantity} pieces`);
  } else if (summary.unit === 'day') {
    lines.push(`📅 *Days Present:* ${summary.totalDaysPresent ?? summary.totalQuantity} days`);
    if (summary.totalDaysAbsent) {
      lines.push(`🏖️ *Leaves/Chhutti:* ${summary.totalDaysAbsent} days`);
    }
    if (summary.advanceDeducted) {
      lines.push(`💵 *Advance Deducted:* -₹${summary.advanceDeducted}`);
    }
  } else {
    lines.push(`📦 *Total Units:* ${summary.totalQuantity} ${summary.unit}`);
  }

  lines.push(`-----------------------------------`);
  lines.push(`💰 *Total Payable:* ₹${summary.totalAmountPayable.toFixed(0)}`);
  
  if (summary.upiPaymentLink) {
    lines.push(`\n📲 *Pay via UPI:* ${summary.upiPaymentLink}`);
  }

  lines.push(`\n_Hisaab generated hands-free via RozHisaab_`);
  return lines.join('\n');
}

export function createWhatsAppShareLink(phone: string | undefined, message: string): string {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const encodedText = encodeURIComponent(message);
  
  if (cleanPhone) {
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
