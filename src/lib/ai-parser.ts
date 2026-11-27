import { parseRuleBased } from './parser';
import { ParseResult } from '@/types';

/**
 * Intelligent parser wrapper:
 * 1. Checks if GEMINI_API_KEY / GOOGLE_AI_API_KEY is available.
 * 2. If available, uses Gemini Flash for nuanced conversational Hinglish extraction.
 * 3. If NOT available, gracefully falls back to the local deterministic `parseRuleBased` engine.
 * The user NEVER gets a blocking error if keys are missing!
 */
export async function parseTranscript(transcript: string): Promise<ParseResult> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!geminiKey) {
    const result = parseRuleBased(transcript);
    result.keyMissingNotice = 'Using offline rule-based parser. Add GEMINI_API_KEY for advanced LLM parsing.';
    return result;
  }

  try {
    const prompt = `You are RozHisaab, an Indian household doorstep delivery parser.
Given a spoken sentence in Hindi, Hinglish, or English, extract ALL household services mentioned into JSON.

Known vendor categories:
- milk (doodh): unit "litres"
- water (paani): unit "cans", also check if any empty jars were returned
- laundry (presswala): unit "pieces", count items (shirt, pant, saree, etc)
- maid (kaamwali/didi): action "absent" (if chhutti/naaga), "advance" (if cash advance given), or "received"
- tiffin: unit "meals", action "received" or "skipped" (if band/chhutti)
- newspaper: unit "copies"

Indian Number vocabulary:
- dedh = 1.5, dhaai = 2.5, sawa = 1.25, paune do = 1.75, aadha = 0.5, pau = 0.25

Input transcript: "${transcript}"

Respond strictly with a JSON object adhering to this schema:
{
  "items": [
    {
      "vendorCategory": "milk" | "water" | "laundry" | "maid" | "tiffin" | "newspaper",
      "vendorName": string,
      "quantity": number,
      "unit": string,
      "action": "received" | "given" | "absent" | "advance" | "returned" | "skipped",
      "emptyReturned"?: number,
      "itemsDetail"?: Record<string, number>,
      "advanceAmount"?: number,
      "notes"?: string,
      "confidence": number
    }
  ],
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
      success: (parsed.items || []).length > 0,
      intent: parsed.intent || 'log_entry',
      transcript,
      items: parsed.items || [],
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
