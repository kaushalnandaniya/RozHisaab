import { NUMBER_WORDS, VENDOR_KEYWORDS, CLOTHING_ITEMS, ACTION_KEYWORDS } from './slang-map';
import { ParsedItem, ParseResult, VendorCategory, EntryAction, UserIntent, NewVendorPayload, NewCustomerPayload, QueryPayload, VendorDeliveryItem } from '@/types';

/**
 * Extracts numeric quantity from words or digits.
 * Handles "dedh" (1.5), "dhaai" (2.5), "paune do" (1.75), "sawa" (1.25), "aadha" (0.5), "500", etc.
 */
export function extractNumber(text: string): number | null {
  // Convert Devanagari numerals (०-९) and Gujarati numerals (૦-૯) to standard digits
  const devanagariDigits = '०१२३४५६७८९';
  const gujaratiDigits = '૦૧૨૩૪૫૬૭૮૯';
  const normalized = text
    .replace(/[०-९]/g, (d) => devanagariDigits.indexOf(d).toString())
    .replace(/[૦-૯]/g, (d) => gujaratiDigits.indexOf(d).toString());
  const clean = normalized.toLowerCase().trim();

  // "paune <number>" or "પોણા <number>" or "पावणे <number>" -> number - 0.25 (e.g., paune do = 1.75)
  const pauneMatch = clean.match(/(?:paune|पौने|પોણા|પોણો|पावणे)\s+([a-z\u0900-\u097F\u0A80-\u0AFF0-9]+)/i);
  if (pauneMatch) {
    const nextWord = pauneMatch[1];
    const baseNum = NUMBER_WORDS[nextWord] || parseFloat(nextWord);
    if (!isNaN(baseNum)) {
      return Math.max(0.25, baseNum - 0.25);
    }
  }

  // "sawa <number>" or "સવા <number>" or "सव्वा <number>" -> number + 0.25 (e.g., sawa do = 2.25)
  const sawaMatch = clean.match(/(?:sawa|सवा|સવા|सव्वा)\s+([a-z\u0900-\u097F\u0A80-\u0AFF0-9]+)/i);
  if (sawaMatch) {
    const nextWord = sawaMatch[1];
    const baseNum = NUMBER_WORDS[nextWord] || parseFloat(nextWord);
    if (!isNaN(baseNum)) {
      return baseNum + 0.25;
    }
  }

  // Digits (e.g. 500, 1.5, 2, 40)
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
 * - add_customer: "Add 405 flat number Nandaniya ji", "फ्लैट 405 नंदानिया जी को जोड़ो"
 * - query_hisaab: "kitna hua", "hisaab batao", "total kitna", "kitne kapde", "kitna kharch"
 * - vendor_delivery: "Flat 402 dedh litre, Flat 501 do litre, Flat 104 chhutti"
 * - log_entry: normal doorstep logging
 */
export function detectIntent(text: string): UserIntent {
  const devanagariDigits = '०१२३४५६७८९';
  const gujaratiDigits = '૦૧૨૩૪૫૬૭૮૯';
  const normalizedText = text
    .replace(/[०-९]/g, (d) => devanagariDigits.indexOf(d).toString())
    .replace(/[૦-૯]/g, (d) => gujaratiDigits.indexOf(d).toString());
  const lower = normalizedText.toLowerCase().trim();
  
  // 0. UNDO / ROLLBACK VOICE COMMAND (Household & Vyapari)
  // E.g.: "Undo", "Cancel karo", "Pichla cancel karo", "Arrey galat ho gaya", "Galti se entry ho gayi", "रद्द करो", "वापस लो"
  const isUndoCommand = Boolean(
    lower.match(/^(?:undo|cancel|undo last|cancel last|radd karo|wapas lo|hatao|delete karo|रद्द करो|वापस लो|कैंसिल करो|अनडू|રદ કરો|રદ|रद्द करा)$/i) ||
    lower.includes('undo karo') ||
    lower.includes('cancel karo') ||
    lower.includes('pichla cancel') ||
    lower.includes('pichli entry cancel') ||
    lower.includes('pichli delivery cancel') ||
    lower.includes('arrey galat') ||
    lower.includes('galti se') ||
    lower.includes('galat ho gaya') ||
    lower.includes('galat entry') ||
    lower.includes('radd karo') ||
    lower.includes('wapas lo') ||
    lower.includes('hata do') ||
    lower.includes('bhool jao') ||
    lower.includes('गलत हो गया') ||
    lower.includes('गलती से') ||
    lower.includes('रद्द करो') ||
    lower.includes('રદ કરો') ||
    lower.includes('रद्द करा')
  );

  if (isUndoCommand) {
    return 'undo_last';
  }

  // 1. ADD VENDOR (Household mode)
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

  // 2. ADD CUSTOMER / FLAT TO ROUTE (Vyapari mode)
  // E.g.: "Add 405 flat number Nandaniya ji", "405 flat number Nandaniya ji add karo", "फ्लैट 405 नंदानिया जी को जोड़ो"
  const hasAddKeyword = Boolean(
    lower.match(/(?:^|\s)(?:add|naya|new|jodo|jodein|jodna|shamil|dakhil|जोड़ो|जोड़ो|जोड़ें|जोड़ें|शामिल|ऐड|નવો|ઉમેરો|જોડો|जोडा)(?:\s|$|[,\.!?])/i)
  );

  const hasFlatReference = 
    lower.includes('flat') || 
    lower.includes('फ्लैट') || 
    lower.includes('ફ્લેટ') || 
    lower.includes('फ्लॅट') || 
    Boolean(lower.match(/\b\d{3,4}\s*(?:number|no|नं|नंबर|નંબર|નં)?\b/i));

  const hasCustomerReference = 
    lower.includes('customer') || 
    lower.includes('grahak') || 
    lower.includes('ग्राहक') || 
    lower.includes('resident') ||
    Boolean(lower.match(/(?:^|\s)[a-zA-Z\u0900-\u097F\u0A80-\u0AFF]{2,30}\s*(?:ji|जी|bhai|भाई|bhaiya|भैया|ભાઈ)(?:\s|$|[,\.!?])/i));

  const hasDeliveryVerb = Boolean(
    lower.match(/(?:^|\s)(?:diya|de diya|de do|de dena|chhutti|naaga|absent|extra diya|दिया|दे दिया|दे दो|छुट्टी|नागा|एक्स्ट्रा दिया|આપ્યું|આપ્યા|લીધું|રજા|दिले|सुट्टी)(?:\s|$|[,\.!?])/i)
  );

  if (hasAddKeyword && (hasFlatReference || hasCustomerReference) && !hasDeliveryVerb) {
    return 'add_customer';
  }

  // 3. QUERY HISAAB
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

  // 4. VENDOR DELIVERY ROUTE (Vyapari mode)
  const hasQuantityWord = Boolean(
    lower.match(/\b(?:litre|liter|लीटर|can|cans|कैन|जार|l|dedh|dhaai|sawa|paune|aadha|દોઢ|અઢી|પોણા|સવા|દૂધ|पाणी|दीड|अडीच|पावणे|सव्वा)\b/i) ||
    lower.match(/\b\d+(?:\.\d+)?\s*(?:litre|liter|लीटर|can|cans|l|લિટર|લીટર)\b/i)
  );

  if ((hasFlatReference || hasCustomerReference) && (hasDeliveryVerb || hasQuantityWord || lower.includes('doodh') || lower.includes('दूध') || lower.includes('દૂધ') || lower.includes('extra') || lower.includes('एक्स्ट्रा'))) {
    return 'vendor_delivery';
  }

  return 'log_entry';
}

/**
 * Parses voice command to ADD A FLAT / CUSTOMER TO VENDOR ROUTE
 * Example 1: "Add 405 flat number Nandaniya ji"
 * Example 2: "फ्लैट 405 नंदानिया जी को जोड़ो"
 * Example 3: "Add 405 flat number Nandaniya ji, daily 2 litres"
 *
 * CRITICAL RULE: Unless user explicitly commands contingencies/quantities,
 * do NOT invent or auto-add any daily delivery quantity!
 */
export function parseAddCustomer(rawTranscript: string): ParseResult {
  const text = rawTranscript.trim();

  // 1. Extract Flat Number (e.g. 405, Flat 405, 405 flat number, फ्लैट ४०५, B-104)
  let flatNumber = 'Flat 405';
  const flatFullMatch = text.match(/(?:flat|फ्लैट)?\s*(?:number|no|नं|नंबर|नम्बर)?\s*(\d{3,4}|[a-zA-Z]-\d{3,4})\s*(?:flat|फ्लैट|number|no|नं|नंबर|नम्बर)?/i);
  if (flatFullMatch) {
    flatNumber = `Flat ${flatFullMatch[1].toUpperCase()}`;
  }

  // 2. Extract Customer Name (Unicode-safe for Hindi Devanagari and Latin)
  let customerName = 'Resident';
  const honorificMatch = text.match(/(?:^|\s)([a-zA-Z\u0900-\u097F]{2,30})\s*(ji|जी|bhai|भाई|bhaiya|भैया|uncle|अंकल|aunty|आंटी|saheb|साहब|sir|सर)(?:\s|$|[,\.!?])/i);
  if (honorificMatch) {
    const rawName = honorificMatch[1].trim();
    const honorific = honorificMatch[2].trim();
    const isDevanagari = Boolean(rawName.match(/[\u0900-\u097F]/));
    if (isDevanagari) {
      customerName = `${rawName} ${honorific}`;
    } else {
      const capName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      const capHon = honorific.charAt(0).toUpperCase() + honorific.slice(1);
      customerName = `${capName} ${capHon}`;
    }
  } else {
    // Stopwords filter fallback
    const stopWords = new Set([
      "add", "naya", "new", "jodo", "jodein", "jodna", "karo", "karna", "ko", "mein", "me", "ka", "ki", "ke", 
      "par", "customer", "grahak", "flat", "number", "no", "फ्लैट", "ग्राहक", "जोड़ो", "जोड़ो", "जोड़ें", "ऐड", 
      "नया", "करो", "को", "में", "का", "की", "के", "पर", "daily", "quantity", "litres", "litre", "लीटर", "can", "cans"
    ]);
    const tokens = text.replace(/[,;:\.!\?]/g, "").split(/\s+/);
    const remaining = tokens.filter(tok => {
      const lower = tok.toLowerCase();
      if (stopWords.has(lower)) return false;
      if (lower.match(/^\d+$/)) return false;
      if (lower.match(/^[a-z]-\d+$/i)) return false;
      return tok.length >= 2;
    });
    if (remaining.length > 0) {
      customerName = remaining.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }

  // 3. Extract Contingencies / Quantities ONLY if explicitly spoken
  // e.g. "daily 2 litre", "roz ka dedh litre", "regular 2L"
  let dailyQuantity: number | undefined = undefined;
  const dailyMatch = text.match(/(?:daily|regular|roz|har roz|roz ka|प्रतिदिन|रोज़|रोज|डेली)\s*(?:quantity|supply)?\s*([a-zA-Z0-9\.\u0900-\u097F]+(?:\s+[a-zA-Z0-9\.\u0900-\u097F]+)?)/i);
  if (dailyMatch) {
    const extracted = extractNumber(dailyMatch[1]);
    if (extracted !== null && extracted > 0) {
      dailyQuantity = extracted;
    }
  }

  // 4. Extract Phone Number (10 digits) if provided
  const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
  const phone = phoneMatch ? phoneMatch[1] : undefined;

  const isHindiScript = Boolean(customerName.match(/[\u0900-\u097F]/));
  const spokenResponseHindi = isHindiScript
    ? (dailyQuantity 
        ? `${flatNumber} ${customerName} (रोज़ ${dailyQuantity}L) आपके डिलीवरी रूट में जुड़ गए हैं!` 
        : `${flatNumber} ${customerName} को आपके डिलीवरी रूट में जोड़ दिया गया है!`)
    : (dailyQuantity 
        ? `${flatNumber} ${customerName} (Daily ${dailyQuantity}L) aapke route mein jud gaye hain!` 
        : `${flatNumber} ${customerName} aapke delivery route mein jud gaye hain!`);

  const spokenResponseEnglish = dailyQuantity
    ? `Added ${flatNumber} ${customerName} (Daily ${dailyQuantity}L) to your delivery route!`
    : `Added ${flatNumber} ${customerName} to your delivery route!`;

  const newCustomer: NewCustomerPayload = {
    flatNumber,
    customerName,
    dailyQuantity,
    phone
  };

  return {
    success: true,
    intent: 'add_customer',
    transcript: rawTranscript,
    items: [],
    newCustomer,
    method: 'rule_based',
    spokenResponseHindi,
    spokenResponseEnglish
  };
}

/**
 * Parses vendor delivery route speech
 * Example 1: "Flat 402 dedh litre, Flat 501 2 litre, Flat 104 chhutti"
 * Example 2: "Gupta ji को 2 L दूध extra दिया आज"
 */
export function parseVendorDelivery(rawTranscript: string): ParseResult {
  const devanagariDigits = '०१२३४५६७८९';
  const gujaratiDigits = '૦૧૨૩૪૫૬૭૮૯';
  const normalized = rawTranscript
    .replace(/[०-९]/g, (d) => devanagariDigits.indexOf(d).toString())
    .replace(/[૦-૯]/g, (d) => gujaratiDigits.indexOf(d).toString());
  const deliveries: VendorDeliveryItem[] = [];
  const segments = normalized.split(/[,;\n]|(?:\s+(?:aur|और|અને|आणि)\s+)/i).map(s => s.trim()).filter(Boolean);

  for (const seg of segments) {
    const segLower = seg.toLowerCase();

    // 1. Flat number matching (e.g. Flat 402, 402, B-104, फ्लैट ३०२, ફ્લેટ ૪૦૨)
    const flatMatch = seg.match(/(?:flat|फ्लैट|ફ્લેટ|फ्लॅट\s*)?(\d{3,4}|[a-z]-\d{3})/i);

    // 2. Customer name matching (e.g. Gupta ji, गुप्ता जी, Sharma ji, शर्मा जी, પટેલ ભાઈ)
    const nameMatch = seg.match(/(?:^|\s)([a-zA-Z\u0900-\u097F\u0A80-\u0AFF]{2,30})\s*(?:ji|जी|bhai|भाई|bhaiya|भैया|ભાઈ)(?:\s|$|[,\.!?])/i);

    const isAbsent = Boolean(segLower.match(/\b(?:chhutti|छुट्टी|band|बंद|naaga|नागा|absent|રજા|સુટ્ટી|સુટી|सुट्टी|गैरहजर)\b/i));
    const isExtra = Boolean(segLower.match(/\b(?:extra|एक्स्ट्रा|વધારાનું)\b/i));
    const isWater = Boolean(segLower.match(/\b(?:water|can|paani|जार|कैन|पानी|પાણી)\b/i));

    // Strip flat number and customer name so extractNumber doesn't grab "402" as quantity
    let segForNumber = seg;
    if (flatMatch) {
      segForNumber = segForNumber.replace(flatMatch[0], '');
    }
    if (nameMatch) {
      segForNumber = segForNumber.replace(nameMatch[0], '');
    }

    const qty = isAbsent ? 0 : (extractNumber(segForNumber) ?? 1);

    if (flatMatch || nameMatch) {
      let flatNum = flatMatch ? (flatMatch[0].toLowerCase().startsWith('flat') ? flatMatch[0] : `Flat ${flatMatch[0]}`) : '';
      let custName = nameMatch ? `${nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1)} Ji` : undefined;

      deliveries.push({
        flatNumber: flatNum.toUpperCase() || (custName ? custName : 'Route Customer'),
        customerName: custName,
        quantity: qty,
        unit: isWater ? 'cans' : 'litres',
        action: isAbsent ? 'absent' : (isExtra ? 'extra' : 'received'),
        isExtra: isExtra
      });
    }
  }

  // Fallback: If no segments matched but whole transcript has customer name or flat
  if (deliveries.length === 0) {
    const isAbsent = Boolean(rawTranscript.toLowerCase().match(/\b(?:chhutti|छुट्टी|band|बंद|naaga|नागा|absent)\b/i));
    const isExtra = Boolean(rawTranscript.toLowerCase().match(/\b(?:extra|एक्स्ट्रा)\b/i));
    const isWater = Boolean(rawTranscript.toLowerCase().match(/\b(?:water|can|paani|जार|कैन|पानी)\b/i));
    const nameMatch = rawTranscript.match(/(?:^|\s)([a-zA-Z\u0900-\u097F]{2,30})\s*(?:ji|जी|bhai|भाई|bhaiya|भैया)(?:\s|$|[,\.!?])/i);
    const flatMatch = rawTranscript.match(/(?:flat|फ्लैट\s*)?(\d{3,4}|[a-z]-\d{3})/i);

    if (nameMatch || flatMatch) {
      const custName = nameMatch ? `${nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1)} Ji` : undefined;
      const flatNum = flatMatch ? (flatMatch[0].toLowerCase().startsWith('flat') ? flatMatch[0] : `Flat ${flatMatch[0]}`) : '';
      
      let rawForNumber = rawTranscript;
      if (flatMatch) rawForNumber = rawForNumber.replace(flatMatch[0], '');
      if (nameMatch) rawForNumber = rawForNumber.replace(nameMatch[0], '');

      const qty = isAbsent ? 0 : (extractNumber(rawForNumber) ?? 1);

      deliveries.push({
        flatNumber: flatNum.toUpperCase() || (custName ? custName : 'Customer'),
        customerName: custName,
        quantity: qty,
        unit: isWater ? 'cans' : 'litres',
        action: isAbsent ? 'absent' : (isExtra ? 'extra' : 'received'),
        isExtra: isExtra
      });
    }
  }

  const spokenParts = deliveries.map(d => {
    const label = d.customerName || d.flatNumber;
    if (d.action === 'absent') return `${label} chhutti`;
    if (d.isExtra) return `${label} ko ${d.quantity}L extra doodh`;
    return `${label} ${d.quantity}L`;
  });

  return {
    success: deliveries.length > 0,
    intent: 'vendor_delivery',
    transcript: rawTranscript,
    items: [],
    deliveries,
    method: 'rule_based',
    spokenResponseHindi: `Vyapari hisaab note ho gaya: ${spokenParts.join(', ')}!`,
    spokenResponseEnglish: `Route delivery logged: ${spokenParts.join(', ')}!`
  };
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

  if (intent === 'undo_last') {
    return {
      success: true,
      intent: 'undo_last',
      transcript: rawTranscript,
      items: [],
      method: 'rule_based',
      spokenResponseHindi: 'पिछली एंट्री रद्द की जा रही है...',
      spokenResponseEnglish: 'Reversing previous entry...'
    };
  }

  if (intent === 'add_vendor') {
    return parseAddVendor(rawTranscript);
  }

  if (intent === 'add_customer') {
    return parseAddCustomer(rawTranscript);
  }

  if (intent === 'query_hisaab') {
    return parseQueryHisaab(rawTranscript);
  }

  if (intent === 'vendor_delivery') {
    return parseVendorDelivery(rawTranscript);
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
