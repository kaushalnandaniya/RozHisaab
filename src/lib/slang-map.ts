/**
 * Comprehensive Hindi, Hinglish, and English vernacular vocabulary
 * for daily Indian household services.
 */

export const NUMBER_WORDS: Record<string, number> = {
  // Indian vernacular fractions
  'dedh': 1.5,
  'dhedh': 1.5,
  'dhaai': 2.5,
  'dhai': 2.5,
  'sawa': 1.25,
  'aadha': 0.5,
  'adha': 0.5,
  'half': 0.5,
  'pau': 0.25,
  'pawa': 0.25,
  'quarter': 0.25,

  // Devanagari script equivalents
  'डेढ़': 1.5,
  'ढाई': 2.5,
  'सवा': 1.25,
  'आधा': 0.5,
  'पाव': 0.25,

  // Hindi number words (1 to 20)
  'ek': 1, 'एक': 1,
  'do': 2, 'दो': 2,
  'teen': 3, 'तीन': 3,
  'char': 4, 'chaar': 4, 'चार': 4,
  'paanch': 5, 'panch': 5, 'पांच': 5,
  'chhe': 6, 'che': 6, 'छह': 6,
  'saat': 7, 'सात': 7,
  'aath': 8, 'आठ': 8,
  'nau': 9, 'नौ': 9,
  'das': 10, 'दस': 10,
  'gyarah': 11, 'ग्यारह': 11,
  'barah': 12, 'बारह': 12,
  'terah': 13, 'तेरह': 13,
  'chaudah': 14, 'चौदह': 14,
  'pandrah': 15, 'पंद्रह': 15,
  'solah': 16, 'सोलह': 16,
  'satrah': 17, 'सत्रह': 17,
  'atharah': 18, 'अठारह': 18,
  'unnis': 19, 'उन्नीस': 19,
  'bees': 20, 'बीस': 20,

  // English words
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
};

export const VENDOR_KEYWORDS = {
  milk: [
    'doodh', 'dudh', 'doodhwala', 'dudhwala', 'milk', 'milkman', 'amul', 
    'mother dairy', 'दूध', 'दूधवाला'
  ],
  water: [
    'water', 'paani', 'pani', 'can', 'cans', 'jar', 'jars', 'bisleri', 
    'bislari', '20l', 'पानी', 'कैन', 'जार'
  ],
  laundry: [
    'press', 'presswala', 'presswale', 'istri', 'istriwala', 'iron', 'ironing', 
    'dhobi', 'laundry', 'kapde', 'kapda', 'shirt', 'pant', 'saree', 'kurta', 
    'प्रेस', 'इस्त्री', 'धोबी', 'कपड़े'
  ],
  maid: [
    'maid', 'didi', 'bai', 'kaamwali', 'kamwali', 'pocha', 'jhadu', 
    'bartan', 'cook', 'कामवाली', 'दीदी', 'बाई', 'झाड़ू', 'पोछा'
  ],
  tiffin: [
    'tiffin', 'dabba', 'khana', 'lunch', 'meal', 'thali', 'टििफन', 'डब्बा', 'खाना'
  ],
  newspaper: [
    'newspaper', 'paper', 'akhbar', 'akbhar', 'patrika', 'अखबार', 'पेपर'
  ]
};

export const CLOTHING_ITEMS: Record<string, string> = {
  'shirt': 'shirt', 'shirts': 'shirt', 'शर्ट': 'shirt',
  'pant': 'pant', 'pants': 'pant', 'trouser': 'pant', 'पैंट': 'pant',
  'saree': 'saree', 'sari': 'saree', 'साड़ी': 'saree',
  'kurta': 'kurta', 'kurti': 'kurti', 'कुर्ता': 'kurta',
  'tshirt': 'tshirt', 't-shirt': 'tshirt',
  'jeans': 'jeans',
  'bedsheet': 'bedsheet', 'chadar': 'bedsheet', 'चादर': 'bedsheet'
};

export const ACTION_KEYWORDS = {
  absent: [
    'chhutti', 'chutti', 'naaga', 'naga', 'nahi aayi', 'nahi aaya', 'leave', 
    'absent', 'off', 'miss', 'छुट्टी', 'नागा', 'नहीं आई'
  ],
  returned: [
    'khali', 'khali jar', 'wapas', 'wapas diya', 'return', 'returned', 'empty', 
    'खाली', 'वापस'
  ],
  advance: [
    'advance', 'udhar', 'peshgi', 'advance diya', 'उधार', 'एडवांस'
  ],
  received: [
    'liya', 'aaya', 'aaye', 'mila', 'aayi', 'delivered', 'got', 'took', 
    'लिया', 'आया', 'आए', 'मिली'
  ],
  given: [
    'diya', 'diye', 'diyi', 'bheja', 'bheje', 'given', 'sent', 'gave', 
    'दिया', 'दिए', 'भेजा'
  ],
  skipped: [
    'skip', 'skipped', 'band', 'aaj band', 'nahi chahiye', 'बंद', 'स्किप'
  ]
};
