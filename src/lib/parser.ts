import { NUMBER_WORDS, VENDOR_KEYWORDS, CLOTHING_ITEMS, ACTION_KEYWORDS } from './slang-map';
import { ParsedItem, ParseResult, VendorCategory, EntryAction, UserIntent, NewVendorPayload, QueryPayload } from '@/types';

/**
 * Extracts numeric quantity from words or digits.
 * Handles "dedh" (1.5), "dhaai" (2.5), "paune do" (1.75), "sawa" (1.25), "aadha" (0.5), "500", etc.
 */
export function extractNumber(text: string): number | null {
  const clean = text.toLowerCase().trim();

  // "paune <number>" -> number - 0.25 (e.g., paune do = 1.75)
  const pauneMatch = clean.match(/(?:paune|पौने)\s+([a-z\u0900-\u097F0-9]+)/i);
  if (pauneMatch) {
    const nextWord = pauneMatch[1];
    const baseNum = NUMBER_WORDS[nextWord] || parseFloat(nextWord);
    if (!isNaN(baseNum)) {
      return Math.max(0.25, baseNum - 0.25);
    }
  }

  // "sawa <number>" -> number + 0.25 (e.g., sawa do = 2.25)
  const sawaMatch = clean.match(/(?:sawa|सवा)\s+([a-z\u0900-\u097F0-9]+)/i);
  if (sawaMatch) {
    const nextWord = sawaMatch[1];
    const baseNum = NUMBER_WORDS[nextWord] || parseFloat(nextWord);
    if (!isNaN(baseNum)) {
      return baseNum + 0.25;
    }
  }

  // Digits (e.g. 500, 1.5, 40)
  const digitMatch = clean.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) {
    return parseFloat(digitMatch[1]);
  }

  // Words
  const words = clean.split(/\s+/);
  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      return NUMBER_WORDS[word];
    }
  }

  return null;
}

const CATEGORY_META: Record<string, { icon: string; color: string; defaultUnit: string }> = {
  milk: { icon: '🥛', color: '#3B82F6', defaultUnit: 'litres' },
  water: { icon: '💧', color: '#06B6D4', defaultUnit: 'cans' },
  laundry: { icon: '👔', color: '#8B5CF6', defaultUnit: 'pieces' },
  maid: { icon: '🧹', color: '#F59E0B', defaultUnit: 'day' },
  tiffin: { icon: '🍱', color: '#10B981', defaultUnit: 'meals' },
  newspaper: { icon: '📰', color: '#64748B', defaultUnit: 'copies' },
  car_wash: { icon: '🚗', color: '#059669', defaultUnit: 'month' },
  cook: { icon: '👨‍🍳', color: '#EA580C', defaultUnit: 'month' },
  driver: { icon: '🚙', color: '#4F46E5', defaultUnit: 'month' },
  gardener: { icon: '🪴', color: '#16A34A', defaultUnit: 'month' },
  custom: { icon: '🏷️', color: '#6B7280', defaultUnit: 'units' }
};

/**
 * 1. Intent Detection:
 * - add_vendor: "naya vendor", "add vendor", "vendor jodo", "new vendor"
 * - query_hisaab: "kitna hua", "hisaab batao", "total kitna", "kitne kapde", "kitna kharch"
 * - log_entry: normal doorstep logging
 */
export function detectIntent(text: string): UserIntent {
  const lower = text.toLowerCase();
  
  if (
    lower.includes('naya vendor') || 
    lower.includes('add vendor') || 
    lower.includes('vendor add') || 
    lower.includes('new vendor') ||
    lower.includes('vendor jodo') ||
    lower.includes('vendor jodein')
  ) {
    return 'add_vendor';
  }

  if (
    lower.includes('kitna hua') ||
    lower.includes('kitna bill') ||
    lower.includes('hisaab batao') ||
    lower.includes('total kitna') ||
    lower.includes('kitne bache') ||
    lower.includes('kitne kapde bache') ||
    lower.includes('how much')
  ) {
    return 'query_hisaab';
  }

  return 'log_entry';
}

/**
 * Parses voice command to ADD A NEW VENDOR
 * Example: "Naya vendor add karo: Ramu Car wash, rate 500 rupaye mahina, phone 9876543210"
 */
export function parseAddVendor(rawTranscript: string): ParseResult {
  const clean = rawTranscript.replace(/(?:naya vendor add karo|add vendor|new vendor|vendor jodo|vendor jodein)[:\s]*/i, '').trim();
  const lower = clean.toLowerCase();

  // Extract phone number (10 digits)
  const phoneMatch = clean.match(/\b([6-9]\d{9})\b/);
  const phone = phoneMatch ? phoneMatch[1] : undefined;

  // Extract rate: "rate 500", "500 rupaye", "₹500"
  let rate = 50;
  const rateMatch = clean.match(/(?:rate|kimat|price)?\s*(?:rs\.?|₹|rupaye)?\s*(\d+(?:\.\d+)?)\s*(?:rs\.?|₹|rupaye)?/i);
  if (rateMatch) {
    rate = parseFloat(rateMatch[1]);
  }

  // Detect category & unit
  let category: VendorCategory = 'custom';
  let unit = 'units';

  if (lower.includes('car') || lower.includes('wash') || lower.includes('gaadi')) {
    category = 'car_wash';
    unit = 'month';
  } else if (lower.includes('cook') || lower.includes('khana banane')) {
    category = 'cook';
    unit = 'month';
  } else if (lower.includes('driver')) {
    category = 'driver';
    unit = 'month';
  } else if (lower.includes('mali') || lower.includes('gardener') || lower.includes('paudhe')) {
    category = 'gardener';
    unit = 'month';
  } else if (lower.includes('milk') || lower.includes('doodh')) {
    category = 'milk';
    unit = 'litres';
  } else if (lower.includes('water') || lower.includes('paani') || lower.includes('can')) {
    category = 'water';
    unit = 'cans';
  } else if (lower.includes('dhobi') || lower.includes('press') || lower.includes('iron')) {
    category = 'laundry';
    unit = 'pieces';
  } else if (lower.includes('tiffin') || lower.includes('dabba')) {
    category = 'tiffin';
    unit = 'meals';
  } else if (lower.includes('maid') || lower.includes('didi') || lower.includes('bai')) {
    category = 'maid';
    unit = 'day';
  }

  // Specific unit word match if spoken (e.g. "per litre", "mahina", "per piece")
  if (lower.includes('mahina') || lower.includes('month')) unit = 'month';
  if (lower.includes('litre') || lower.includes('liter')) unit = 'litres';
  if (lower.includes('piece') || lower.includes('kapda')) unit = 'pieces';
  if (lower.includes('can') || lower.includes('jar')) unit = 'cans';
  if (lower.includes('meal') || lower.includes('thali')) unit = 'meals';
  if (lower.includes('day') || lower.includes('din')) unit = 'day';

  // Extract name: clean out rate, phone, and commands
  let name = clean
    .replace(/\b[6-9]\d{9}\b/g, '')
    .replace(/(?:phone|mobile|number|contact)[:\s]*/gi, '')
    .replace(/(?:rate|kimat|price)?\s*(?:rs\.?|₹|rupaye)?\s*\d+(?:\.\d+)?\s*(?:rs\.?|₹|rupaye)?/gi, '')
    .replace(/(?:per|har)?\s*(?:mahina|month|litre|piece|can|day|din|meal)/gi, '')
    .replace(/[,;:]/g, '')
    .trim();

  if (!name || name.length < 2) {
    name = category !== 'custom' ? `${category.replace('_', ' ').toUpperCase()} Vendor` : 'New Vendor';
  }

  // Capitalize title
  const displayName = name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const meta = CATEGORY_META[category] || CATEGORY_META.custom;

  const newVendor: NewVendorPayload = {
    displayName,
    category,
    unit,
    unitRate: rate,
    vendorPhone: phone,
    icon: meta.icon,
    color: meta.color
  };

  const spokenResponseHindi = `Naya vendor ${displayName} safalta se jud gaya! Rate ₹${rate} per ${unit}.`;
  const spokenResponseEnglish = `Added new vendor ${displayName} at ₹${rate}/${unit}.`;

  return {
    success: true,
    intent: 'add_vendor',
    transcript: rawTranscript,
    items: [],
    newVendor,
    method: 'rule_based',
    spokenResponseHindi,
    spokenResponseEnglish
  };
}

/**
 * Parses voice command to QUERY HISAAB
 * Example: "Is mahine paani ka total kitna hua?"
 */
export function parseQueryHisaab(rawTranscript: string): ParseResult {
  const lower = rawTranscript.toLowerCase();

  let targetCategory: string | undefined = undefined;
  if (lower.includes('paani') || lower.includes('water') || lower.includes('can')) targetCategory = 'water';
  else if (lower.includes('doodh') || lower.includes('milk')) targetCategory = 'milk';
  else if (lower.includes('press') || lower.includes('kapde') || lower.includes('dhobi')) targetCategory = 'laundry';
  else if (lower.includes('didi') || lower.includes('maid')) targetCategory = 'maid';
  else if (lower.includes('tiffin')) targetCategory = 'tiffin';

  let queryType: 'total_spend' | 'pending_items' | 'vendor_summary' = 'total_spend';
  if (lower.includes('bache') || lower.includes('pending') || lower.includes('kapde')) {
    queryType = 'pending_items';
  }

  const query: QueryPayload = {
    targetCategory,
    queryType,
    timeframe: 'current_month'
  };

  return {
    success: true,
    intent: 'query_hisaab',
    transcript: rawTranscript,
    items: [],
    query,
    method: 'rule_based',
    spokenResponseHindi: 'Hisaab check kar rahe hain...',
    spokenResponseEnglish: 'Checking your ledger...'
  };
}

/**
 * Master parser: Routes between add_vendor, query_hisaab, and log_entry
 */
export function parseRuleBased(rawTranscript: string): ParseResult {
  const intent = detectIntent(rawTranscript);

  if (intent === 'add_vendor') {
    return parseAddVendor(rawTranscript);
  }

  if (intent === 'query_hisaab') {
    return parseQueryHisaab(rawTranscript);
  }

  // --- LOG_ENTRY (Default Doorstep Daily Logger) ---
  const transcript = rawTranscript.trim();
  const lower = transcript.toLowerCase();
  const items: ParsedItem[] = [];

  const segments = lower
    .split(/[,;\.\n]|(?:\s+aur\s+)|\b(?:and|phir|then|also|bhi)\b/i)
    .map(s => s.trim())
    .filter(Boolean);

  const containsAny = (text: string, list: string[]): boolean => {
    return list.some(kw => {
      const regex = new RegExp(`(^|\\b|\\s)${kw}(\\b|\\s|$)`, 'i');
      return regex.test(text);
    });
  };

  // 1. MILK
  if (containsAny(lower, VENDOR_KEYWORDS.milk)) {
    const milkSeg = segments.find(s => containsAny(s, VENDOR_KEYWORDS.milk)) || lower;
    const qty = extractNumber(milkSeg) ?? 1;
    items.push({
      vendorCategory: 'milk',
      vendorName: 'Doodh Wala',
      quantity: qty,
      unit: 'litres',
      action: 'received',
      confidence: 0.95
    });
  }

  // 2. WATER
  if (containsAny(lower, VENDOR_KEYWORDS.water)) {
    const waterSegs = segments.filter(s => containsAny(s, VENDOR_KEYWORDS.water) || containsAny(s, ['can', 'cans', 'jar', 'jars', 'khali']));
    const waterContext = waterSegs.length > 0 ? waterSegs.join(' ') : lower;

    let deliveredQty = 1;
    const deliveredMatch = waterContext.match(/(\d+|[a-z]+)\s*(?:water|paani|can|cans|jar|jars)(?!\s*khali)/i) 
      || waterContext.match(/(\d+|[a-z]+)\s*(?:aaye|aaya|liya|mila|deliver)/i);
    if (deliveredMatch) {
      deliveredQty = extractNumber(deliveredMatch[1]) ?? 1;
    } else {
      const generalNum = extractNumber(waterContext);
      if (generalNum) deliveredQty = generalNum;
    }

    let emptyReturned = 0;
    const emptyMatch = waterContext.match(/(\d+|[a-z]+)\s*(?:khali|empty|jar wapas)|(?:khali|empty|jar wapas)\s*(\d+|[a-z]+)?/i);
    if (emptyMatch) {
      const numCandidate = emptyMatch[1] || emptyMatch[2] || '1';
      emptyReturned = extractNumber(numCandidate) ?? 1;
    }

    items.push({
      vendorCategory: 'water',
      vendorName: 'Paani Wala',
      quantity: deliveredQty,
      unit: 'cans',
      action: 'received',
      emptyReturned: emptyReturned,
      notes: emptyReturned > 0 ? `${emptyReturned} khali jar wapas diya` : undefined,
      confidence: 0.92
    });
  }

  // 3. LAUNDRY
  if (containsAny(lower, VENDOR_KEYWORDS.laundry)) {
    const laundrySegs = segments.filter(s => containsAny(s, VENDOR_KEYWORDS.laundry) || containsAny(s, Object.keys(CLOTHING_ITEMS)));
    const laundryContext = laundrySegs.length > 0 ? laundrySegs.join(' ') : lower;

    const clothingCounts: Record<string, number> = {};
    let totalPieces = 0;

    for (const [clothingWord, normalized] of Object.entries(CLOTHING_ITEMS)) {
      const regex = new RegExp(`(\\d+|[a-z]+)\\s*${clothingWord}`, 'i');
      const match = laundryContext.match(regex);
      if (match) {
        const count = extractNumber(match[1]) ?? 1;
        clothingCounts[normalized] = (clothingCounts[normalized] || 0) + count;
        totalPieces += count;
      }
    }

    if (totalPieces === 0) {
      const generalCount = extractNumber(laundryContext) ?? 5;
      totalPieces = generalCount;
    }

    const action: EntryAction = containsAny(laundryContext, ACTION_KEYWORDS.received) ? 'received' : 'given';

    items.push({
      vendorCategory: 'laundry',
      vendorName: 'Presswala',
      quantity: totalPieces,
      unit: 'pieces',
      action: action,
      itemsDetail: Object.keys(clothingCounts).length > 0 ? clothingCounts : undefined,
      confidence: 0.90
    });
  }

  // 4. MAID
  if (containsAny(lower, VENDOR_KEYWORDS.maid)) {
    const maidSeg = segments.find(s => containsAny(s, VENDOR_KEYWORDS.maid)) || lower;
    const isAbsent = containsAny(maidSeg, ACTION_KEYWORDS.absent);
    const isAdvance = containsAny(maidSeg, ACTION_KEYWORDS.advance);

    if (isAdvance) {
      const advanceAmt = extractNumber(maidSeg) ?? 500;
      items.push({
        vendorCategory: 'maid',
        vendorName: 'Kaam Wali Didi',
        quantity: 1,
        unit: 'rupees',
        action: 'advance',
        advanceAmount: advanceAmt,
        notes: `₹${advanceAmt} advance diya`,
        confidence: 0.94
      });
    } else if (isAbsent) {
      items.push({
        vendorCategory: 'maid',
        vendorName: 'Kaam Wali Didi',
        quantity: 1,
        unit: 'day',
        action: 'absent',
        notes: 'Chhutti (leave)',
        confidence: 0.95
      });
    } else {
      items.push({
        vendorCategory: 'maid',
        vendorName: 'Kaam Wali Didi',
        quantity: 1,
        unit: 'day',
        action: 'received',
        notes: 'Aayi thi (present)',
        confidence: 0.88
      });
    }
  }

  // 5. TIFFIN
  if (containsAny(lower, VENDOR_KEYWORDS.tiffin)) {
    const tiffinSeg = segments.find(s => containsAny(s, VENDOR_KEYWORDS.tiffin)) || lower;
    const isSkipped = containsAny(tiffinSeg, ACTION_KEYWORDS.skipped) || containsAny(tiffinSeg, ACTION_KEYWORDS.absent);

    items.push({
      vendorCategory: 'tiffin',
      vendorName: 'Tiffin Service',
      quantity: 1,
      unit: 'meals',
      action: isSkipped ? 'skipped' : 'received',
      notes: isSkipped ? 'Aaj tiffin skip / band' : 'Tiffin liya',
      confidence: 0.90
    });
  }

  // 6. NEWSPAPER
  if (containsAny(lower, VENDOR_KEYWORDS.newspaper)) {
    const newsSeg = segments.find(s => containsAny(s, VENDOR_KEYWORDS.newspaper)) || lower;
    const isSkipped = containsAny(newsSeg, ACTION_KEYWORDS.skipped) || containsAny(newsSeg, ACTION_KEYWORDS.absent);

    items.push({
      vendorCategory: 'newspaper',
      vendorName: 'Akhbar Wala',
      quantity: 1,
      unit: 'copies',
      action: isSkipped ? 'skipped' : 'received',
      confidence: 0.92
    });
  }

  // Generate crisp bilingual confirmations
  const hindiParts: string[] = [];
  const englishParts: string[] = [];

  for (const item of items) {
    if (item.vendorCategory === 'milk') {
      hindiParts.push(`${item.quantity}L doodh`);
      englishParts.push(`${item.quantity}L milk`);
    } else if (item.vendorCategory === 'water') {
      const jarInfo = item.emptyReturned ? ` (${item.emptyReturned} khali jar)` : '';
      hindiParts.push(`${item.quantity} water can${jarInfo}`);
      englishParts.push(`${item.quantity} water cans`);
    } else if (item.vendorCategory === 'laundry') {
      hindiParts.push(`${item.quantity} press ke kapde`);
      englishParts.push(`${item.quantity} laundry clothes`);
    } else if (item.vendorCategory === 'maid') {
      if (item.action === 'absent') {
        hindiParts.push(`didi ki chhutti`);
        englishParts.push(`maid leave`);
      } else if (item.action === 'advance') {
        hindiParts.push(`didi ko ₹${item.advanceAmount} advance`);
        englishParts.push(`₹${item.advanceAmount} advance to maid`);
      } else {
        hindiParts.push(`didi aayi thi`);
        englishParts.push(`maid present`);
      }
    } else if (item.vendorCategory === 'tiffin') {
      hindiParts.push(item.action === 'skipped' ? `tiffin band` : `tiffin liya`);
      englishParts.push(item.action === 'skipped' ? `tiffin skipped` : `tiffin received`);
    } else if (item.vendorCategory === 'newspaper') {
      hindiParts.push(`akhbar`);
      englishParts.push(`newspaper`);
    }
  }

  const spokenResponseHindi = hindiParts.length > 0 
    ? `Theek hai! ${hindiParts.join(', ')} note ho gaya.` 
    : 'Aapka hisaab note ho gaya!';

  const spokenResponseEnglish = englishParts.length > 0 
    ? `Noted: ${englishParts.join(', ')}.` 
    : 'Entry saved!';

  return {
    success: items.length > 0,
    intent: 'log_entry',
    transcript: rawTranscript,
    items,
    method: 'rule_based',
    spokenResponseHindi,
    spokenResponseEnglish
  };
}
