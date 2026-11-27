/**
 * Comprehensive Hindi, Hinglish, Gujarati, Marathi, and English vernacular vocabulary
 * for daily Indian household doorstep services and vendor delivery routes.
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

  // Gujarati vernacular fractions & numerals (ગુજરાતી)
  'દોઢ': 1.5, 'dodh': 1.5, 'dod': 1.5,
  'અઢી': 2.5, 'adhi': 2.5, 'adhee': 2.5,
  'સવા': 1.25, 'sava': 1.25,
  'અડધો': 0.5, 'adho': 0.5, 'adhu': 0.5, 'અડધું': 0.5,
  'પોણો': 0.75, 'પોણા': 0.75, 'pono': 0.75, 'pona': 0.75,
  'એક': 1, 'બે': 2, 'be': 2, 'ત્રણ': 3, 'tran': 3, 'traan': 3, 'ચાર': 4, 'char': 4, 'chaar': 4, 'પાંચ': 5,
  'છ': 6, 'સાત': 7, 'આઠ': 8, 'નવ': 9, 'દસ': 10, 'nav': 9, 'navu': 9, 'dash': 10,
  'agiyar': 11, 'bar': 12, 'ter': 13, 'chaud': 14, 'pandar': 15, 'sol': 16, 'sattar': 17, 'adhaar': 18, 'ognais': 19, 'vis': 20,

  // Hundred multiples & currency (Hindi, Gujarati, Romanized)
  'so': 100, 'sau': 100, 'સો': 100, 'सौ': 100,
  'baso': 200, 'doso': 200, 'બસો': 200, 'દોસો': 200,
  'transo': 300, 'ત્રણસો': 300,
  'charso': 400, 'ચારસો': 400,
  'paanso': 500, 'panso': 500, 'pancho': 500, 'પાંચસો': 500,
  'chhaso': 600, 'satso': 700, 'aathso': 800, 'navso': 900,
  'છસો': 600, 'સાતસો': 700, 'આઠસો': 800, 'નવસો': 900,
  'hazar': 1000, 'hajaar': 1000, 'हजार': 1000, 'હજાર': 1000,

  // Marathi vernacular fractions & numerals (मराठी)
  'दीड': 1.5, 'deed': 1.5,
  'अडीच': 2.5, 'adeech': 2.5,
  'सव्वा': 1.25, 'savva': 1.25,
  'अर्धा': 0.5, 'ardha': 0.5,
  'दोन': 2, 'सहा': 6, 'नऊ': 9, 'दहा': 10,

  // Hindi number words (1 to 20)
  'ek': 1, 'एक': 1,
  'do': 2, 'दो': 2,
  'teen': 3, 'तीन': 3,
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
    'mother dairy', 'दूध', 'दूधवाला', 'દૂધ', 'દુધ', 'દૂધવાળો', 'દૂધવાળા', 'દુધવાળો', 'દૂધવાળાને', 'દૂધવાળા ને', 'ગવળી'
  ],
  water: [
    'water', 'paani', 'pani', 'can', 'cans', 'jar', 'jars', 'bisleri', 
    'bislari', '20l', 'पानी', 'कैन', 'जार', 'પાણી', 'પાણીની કેન', 'પાણી ની કેન', 'પાણી નું કેન', 'કેન', 'બોટલ',
    'પાણીવાળો', 'પાણીવાળા', 'પાણીવાળાને', 'પાણી વાળા', 'પાણી વાળો', 'પાણીવાળા ને'
  ],
  laundry: [
    'press', 'presswala', 'presswale', 'istri', 'istriwala', 'iron', 'ironing', 'ironwala', 
    'dhobi', 'dhobila', 'laundry', 'kapde', 'kapda', 'shirt', 'pant', 'saree', 'kurta', 
    'प्रेस', 'इस्त्री', 'धोबी', 'कपड़े', 'કપડાં', 'કપડા', 'ઇસ્ત્રી', 'ઇસ્ત્રીવાળા', 'ઇસ્ત્રીવાળો', 'ઇસ્ત્રીવાળાને', 
    'ધોબી', 'ધોબીને', 'ધુલાઈ', 'ધોબીલા', 'પ્રેસ', 'પ્રેસવાળા', 'પ્રેસવાળો', 'પ્રેસ વાળા', 'પ્રેસ વાળો', 'પ્રેસવાળાને'
  ],
  maid: [
    'maid', 'didi', 'bai', 'kaamwali', 'kamwali', 'kaamwala', 'kamwala', 'ben', 'kamwali ben', 'pocha', 'jhadu', 
    'bartan', 'cook', 'कामवाली', 'दीदी', 'बाई', 'झाड़ू', 'पोछा', 'કામવાળા', 'કામવાળી', 'કામવાળા બહેન', 'કામવાળા બેન', 
    'કામવાળાને', 'કામવાળીને', 'કામવાળા ને', 'કામવાળી ને', 'વાસીદા'
  ],
  tiffin: [
    'tiffin', 'dabba', 'khana', 'lunch', 'meal', 'thali', 'टििफन', 'डब्बा', 'खाना', 'ટિફિન', 'ડબ્બો', 'રોટલી', 'શાક',
    'ટિફિનવાળા', 'ટિફિન વાળો', 'ટિફિનવાળાને'
  ],
  newspaper: [
    'newspaper', 'paper', 'akhbar', 'akbhar', 'patrika', 'अखबार', 'पेपर', 'છાપું', 'છાપાવાળા', 'वर्तमानपत्र'
  ]
};

export const CLOTHING_ITEMS: Record<string, string> = {
  'shirt': 'shirt', 'shirts': 'shirt', 'शर्ट': 'shirt', 'શર્ટ': 'shirt',
  'pant': 'pant', 'pants': 'pant', 'trouser': 'pant', 'पैंट': 'pant', 'પેન્ટ': 'pant',
  'saree': 'saree', 'sari': 'saree', 'साड़ी': 'saree', 'સાડી': 'saree',
  'kurta': 'kurta', 'kurti': 'kurti', 'कुर्ता': 'kurta', 'કુર્તા': 'kurta',
  'tshirt': 'tshirt', 't-shirt': 'tshirt',
  'jeans': 'jeans',
  'bedsheet': 'bedsheet', 'chadar': 'bedsheet', 'चादर': 'bedsheet', 'ચાદર': 'bedsheet'
};

export const ACTION_KEYWORDS = {
  absent: [
    'chhutti', 'chutti', 'naaga', 'naga', 'nahi aayi', 'nahi aaya', 'nahi aaye', 'leave', 
    'absent', 'off', 'miss', 'nathi aavya', 'nathi aavi', 'nathi aavyo', 'raja', 'raja che', 'sutti',
    'छुट्टी', 'नागा', 'नहीं आई', 'नहीं आया', 'नहीं आए', 
    'રજા', 'રજા છે', 'રજા પર', 'સુટ્ટી', 'સુટી', 'ગેરહાજર', 'નથી આવ્યા', 'નથી આવી', 'નથી આવ્યો', 
    'सुट्टी', 'नाही आली', 'नाही आले'
  ],
  returned: [
    'khali', 'khali jar', 'wapas', 'wapas diya', 'return', 'returned', 'empty', 
    'khali jar aapi', 'khali jar aapyu', 'khali aapi',
    'खाली', 'वापस', 'ખાલી', 'ખાલી જાર', 'પાછું આપ્યું', 'પાછી આપી', 'રિકામી'
  ],
  advance: [
    'advance', 'udhar', 'peshgi', 'advance diya', 'advance diye', 'advance aapyu', 'advance aapya', 'advance aapiya', 'advance aapiyo', 'advance aapo', 
    'upad', 'upad aapyu', 'upad aapya', 'upad aapiya', 'upad aapiyo', 'upad aapo',
    'ઉપાડ', 'ઉપાડ આપ્યો', 'ઉપાડ આપ્યા', 'ઉપાડ આપ્યું', 'ઉપાડ આપિયા', 'उधार', 'एडवांस', 'અગાઉ', 'એડવાન્સ'
  ],
  received: [
    'liya', 'liye', 'aaya', 'aaye', 'mila', 'mile', 'aayi', 'delivered', 'got', 'took', 
    'lidhu', 'lidha', 'lidhi', 'lidho', 'aavyu', 'aavya', 'aavi', 'malya', 'malyu', 'mali',
    'लिया', 'लिए', 'आया', 'आए', 'मिली', 'લીધું', 'લીધા', 'લીધી', 'આવ્યું', 'આવ્યા', 'આવી', 'મળ્યા', 'મળ્યું', 'મળી', 'घेतले', 'आले'
  ],
  given: [
    'diya', 'diye', 'diyi', 'bheja', 'bheje', 'given', 'sent', 'gave', 
    'aapyu', 'aapya', 'aapi', 'aapiya', 'aapiyo', 'apiya', 'aapyo', 'apyo', 'didha', 'didho', 'ditha', 'dithi', 'aapo',
    'moklya', 'moklyu', 'chukavya', 'chukavyo', 'chuko',
    'दिया', 'दिए', 'भेजा', 'આપ્યું', 'આપ્યા', 'આપી', 'આપિયા', 'આપ્યો', 'મોકલ્યા', 'મોકલ્યું', 'દીધા', 'દીધું', 'ચૂકવ્યા', 'ચુકવ્યા', 'दिले'
  ],
  skipped: [
    'skip', 'skipped', 'band', 'bandh', 'aaj band', 'nahi chahiye', 'nahi liya', 'nahi li', 'nahi diya', 'nahi aaya',
    'nathi lidhu', 'nathi lidhi', 'nathi lidho', 'nathi aavyu', 'nathi joytu', 'bandh che', 'bandh chhe', 'aaj bandh',
    'बंद', 'स्किप', 'नहीं लिया', 'नहीं ली', 'नहीं दिया', 'नहीं आया',
    'બંધ', 'બંધ છે', 'નથી જોઈતું', 'નથી લીધું', 'નથી આવ્યું', 'નથી આપ્યું'
  ]
};
