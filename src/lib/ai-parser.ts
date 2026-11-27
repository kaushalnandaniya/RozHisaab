import { parseRuleBased } from './parser';
import { ParseResult } from '@/types';

/**
 * Intelligent parser wrapper:
 * 1. Checks if GEMINI_API_KEY / GOOGLE_AI_API_KEY is available.
 * 2. If available, uses Gemini Flash for nuanced conversational Hindi/Hinglish extraction.
 * 3. If NOT available, gracefully falls back to the local deterministic `parseRuleBased` engine.
 * The user NEVER gets a blocking error if keys are missing!
 */
export async function parseTranscript(transcript: string, role: 'household' | 'vendor' = 'household'): Promise<ParseResult> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!geminiKey) {
    const result = parseRuleBased(transcript, role);
    result.keyMissingNotice = 'Using offline rule-based parser. Add GEMINI_API_KEY for advanced LLM parsing.';
    return result;
  }

  try {
    const prompt = `You are RozHisaab, an Indian doorstep ledger and route assistant.
The active application mode is: "${role === 'vendor' ? 'VENDOR / APARTMENT ROUTE DELIVERY CONSOLE' : 'HOUSEHOLD / FAMILY DOORSTEP LEDGER'}".
${role === 'vendor' 
  ? 'CRITICAL ROLE CONTEXT: The user is a delivery vendor (e.g. milkman, water supplier) on an apartment route. Prioritize "vendor_delivery" (route entries/leaves), "add_customer" (adding flats), and "undo_last". NEVER classify deliveries to flats as household items.'
  : 'CRITICAL ROLE CONTEXT: The user is a household resident. Prioritize "log_entry" (doorstep items received like milk, water, laundry, maid), "add_vendor" (adding new service provider), and "query_hisaab".'
}
Analyze the user's spoken sentence in Hindi, Hinglish, Gujarati, Marathi, or English and extract the exact intent and parameters.

Available Intents:
1. "add_customer": The user is adding a flat or resident to the vendor's delivery route.
   Example: "Add 405 flat number Nandaniya ji", "फ्लैट 405 नंदानिया जी को जोड़ो", "Add flat 405 Nandaniya ji daily 2 litres"
   Output:
   - "newCustomer": {
       "flatNumber": string (e.g. "Flat 405"),
       "customerName": string (e.g. "Nandaniya Ji" or "नंदानिया जी"),
       "dailyQuantity"?: number (ONLY include if user explicitly specified daily quantity like "daily 2L" or "roz 2 litre", else DO NOT include),
       "phone"?: string (10 digits if provided)
     }
   CRITICAL: If user did NOT state any delivery or quantity, do NOT invent or force any quantity.

2. "vendor_delivery": The merchant/vendor is logging daily route deliveries.
   Example: "Gupta ji ko 2 L doodh extra diya", "Flat 402 dedh litre, Flat 501 2 litre, Flat 104 chhutti"
   Output:
   - "deliveries": array of {
       "flatNumber": string,
       "customerName"?: string,
       "quantity": number,
       "unit": "litres" | "cans",
       "action": "received" | "absent" | "extra",
       "isExtra"?: boolean
     }

3. "add_vendor": A household user is adding a new service vendor.
   Example: "Naya vendor add karo: Ramu Car wash, rate 500 rupaye mahina, phone 9876543210"
   Output:
   - "newVendor": { "displayName": string, "category": string, "unit": string, "unitRate": number, "vendorPhone"?: string }

4. "query_hisaab": A user is asking for their bill or summary.
   Example: "Is mahine paani ka kitna hisaab hua?"

5. "log_entry": Household daily log.
   Example: "Aaj 2 litre doodh liya aur 1 can paani"
   Output:
   - "items": array of { "vendorCategory": string, "vendorName": string, "quantity": number, "unit": string, "action": string }

6. "undo_last": The user wants to cancel, undo, or reverse their previous entry or statement.
   Example: "Undo", "Cancel karo", "Arrey galat ho gaya cancel karo", "Pichla hatao", "रद्द करो", "गलत हो गया"
   Output:
   - "intent": "undo_last"

Input transcript: "${transcript}"

Respond strictly with a JSON object:
{
  "intent": "add_customer" | "vendor_delivery" | "add_vendor" | "query_hisaab" | "log_entry" | "undo_last",
  "newCustomer"?: { "flatNumber": string, "customerName": string, "dailyQuantity"?: number, "phone"?: string },
  "deliveries"?: [...],
  "items"?: [...],
  "newVendor"?: {...},
  "spokenResponseHindi": string,
  "spokenResponseEnglish": string
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from Gemini');

    const parsed = JSON.parse(rawText);
    return {
      success: true,
      intent: parsed.intent || 'log_entry',
      transcript,
      items: parsed.items || [],
      deliveries: parsed.deliveries,
      newCustomer: parsed.newCustomer,
      newVendor: parsed.newVendor,
      query: parsed.query,
      method: 'gemini',
      spokenResponseHindi: parsed.spokenResponseHindi || 'Aapka hisaab note ho gaya!',
      spokenResponseEnglish: parsed.spokenResponseEnglish || 'Saved to your ledger!'
    };
  } catch (error) {
    console.warn('Gemini parser failed or unavailable, falling back to rule-based engine:', error);
    const fallback = parseRuleBased(transcript);
    fallback.keyMissingNotice = 'Gemini query failed. Successfully fell back to rule-based parser.';
    return fallback;
  }
}
