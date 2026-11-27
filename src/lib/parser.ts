import { NUMBER_WORDS, VENDOR_KEYWORDS, CLOTHING_ITEMS, ACTION_KEYWORDS } from './slang-map';
import { ParsedItem, ParseResult, VendorCategory, EntryAction } from '@/types';

/**
 * Extracts numeric quantity from words or digits preceding or following a token.
 * Handles "dedh", "dhaai", "paune do" (1.75), "sawa teen" (3.25), "2.5", "1", etc.
 */
export function extractNumber(text: string): number | null {
  const clean = text.toLowerCase().trim();

  // Handle "paune <number>" -> number - 0.25 (e.g., paune do = 1.75)
  const pauneMatch = clean.match(/(?:paune|पौने)\s+([a-z\u0900-\u097F0-9]+)/i);
  if (pauneMatch) {
    const nextWord = pauneMatch[1];
    const baseNum = NUMBER_WORDS[nextWord] || parseFloat(nextWord);
    if (!isNaN(baseNum)) {
      return Math.max(0.25, baseNum - 0.25);
    }
  }

  // Handle "sawa <number>" -> number + 0.25 (e.g., sawa do = 2.25)
  const sawaMatch = clean.match(/(?:sawa|सवा)\s+([a-z\u0900-\u097F0-9]+)/i);
  if (sawaMatch) {
    const nextWord = sawaMatch[1];
    const baseNum = NUMBER_WORDS[nextWord] || parseFloat(nextWord);
    if (!isNaN(baseNum)) {
      return baseNum + 0.25;
    }
  }

  // Check direct numbers (e.g., "1.5", "2", "0.5")
  const digitMatch = clean.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) {
    return parseFloat(digitMatch[1]);
  }

  // Check word numbers
  const words = clean.split(/\s+/);
  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      return NUMBER_WORDS[word];
    }
  }

  return null;
}

/**
 * Parses natural compound spoken Hindi/Hinglish/English into structured vendor entries.
 * Zero-key, rule-based, deterministic, works 100% offline.
 */
export function parseRuleBased(rawTranscript: string): ParseResult {
  const transcript = rawTranscript.trim();
  const lower = transcript.toLowerCase();
  const items: ParsedItem[] = [];

  // Split transcript into clause-like segments by connectors
  const segments = lower
    .split(/[,;\.\n]|(?:\s+aur\s+)|\b(?:and|phir|then|also|bhi)\b/i)
    .map(s => s.trim())
    .filter(Boolean);

  // Helper to match any keyword from a list
  const containsAny = (text: string, list: string[]): boolean => {
    return list.some(kw => {
      const regex = new RegExp(`(^|\\b|\\s)${kw}(\\b|\\s|$)`, 'i');
      return regex.test(text);
    });
  };

  // --- 1. MILK (Doodh) ---
  if (containsAny(lower, VENDOR_KEYWORDS.milk)) {
    // Find segments mentioning milk or search globally
    const milkSeg = segments.find(s => containsAny(s, VENDOR_KEYWORDS.milk)) || lower;
    const qty = extractNumber(milkSeg) ?? 1; // default to 1L if mentioned without qty
    items.push({
      vendorCategory: 'milk',
      vendorName: 'Doodh Wala',
      quantity: qty,
      unit: 'litres',
      action: 'received',
      confidence: 0.95
    });
  }

  // --- 2. WATER (Paani Cans & Empty Return) ---
  if (containsAny(lower, VENDOR_KEYWORDS.water)) {
    const waterSegs = segments.filter(s => containsAny(s, VENDOR_KEYWORDS.water) || containsAny(s, ['can', 'cans', 'jar', 'jars', 'khali']));
    const waterContext = waterSegs.length > 0 ? waterSegs.join(' ') : lower;

    // Check delivered cans: "2 water can aaye", "2 can", "3 can aaye"
    let deliveredQty = 1;
    const deliveredMatch = waterContext.match(/(\d+|[a-z]+)\s*(?:water|paani|can|cans|jar|jars)(?!\s*khali)/i) 
      || waterContext.match(/(\d+|[a-z]+)\s*(?:aaye|aaya|liya|mila|deliver)/i);
    if (deliveredMatch) {
      deliveredQty = extractNumber(deliveredMatch[1]) ?? 1;
    } else {
      const generalNum = extractNumber(waterContext);
      if (generalNum) deliveredQty = generalNum;
    }

    // Check empty jars returned ("1 khali diya", "do empty return", "1 jar wapas")
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

  // --- 3. LAUNDRY (Presswala / Ironing) ---
  if (containsAny(lower, VENDOR_KEYWORDS.laundry)) {
    const laundrySegs = segments.filter(s => containsAny(s, VENDOR_KEYWORDS.laundry) || containsAny(s, Object.keys(CLOTHING_ITEMS)));
    const laundryContext = laundrySegs.length > 0 ? laundrySegs.join(' ') : lower;

    const clothingCounts: Record<string, number> = {};
    let totalPieces = 0;

    // Scan for individual clothing pieces: "4 shirt", "2 pant", "1 saree"
    for (const [clothingWord, normalized] of Object.entries(CLOTHING_ITEMS)) {
      const regex = new RegExp(`(\\d+|[a-z]+)\\s*${clothingWord}`, 'i');
      const match = laundryContext.match(regex);
      if (match) {
        const count = extractNumber(match[1]) ?? 1;
        clothingCounts[normalized] = (clothingCounts[normalized] || 0) + count;
        totalPieces += count;
      }
    }

    // If specific clothes weren't enumerated, look for generic piece count
    if (totalPieces === 0) {
      const generalCount = extractNumber(laundryContext) ?? 5; // default reasonable batch
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

  // --- 4. MAID (Kaamwali / Didi) ---
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

  // --- 5. TIFFIN (Dabba) ---
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

  // --- 6. NEWSPAPER (Akhbar) ---
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

  // Generate crisp, natural bilingual confirmations
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
    transcript: rawTranscript,
    items,
    method: 'rule_based',
    spokenResponseHindi,
    spokenResponseEnglish
  };
}
