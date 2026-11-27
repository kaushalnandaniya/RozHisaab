# Round 1 · Activity 02 — Prompt Submission (`RozHisaab`)

> **Word count:** 558 words (whitespace-split; limit is 80–800 words)  
> **Evaluation criteria:** Specificity, step-by-step clarity, handling edge cases (accents/noise/code-switching), and reproducibility by two independent builders.  
> **Copy-paste the block below directly into the `Your prototype prompt` field on `hackos.scaler.com`:**

---

Your users and their languages:
Indian homemakers, working couples, elderly parents living alone, and flatmates in Tier-1/2/3 cities. They speak conversational Hindi, Indian English, Hinglish, and regional languages (Marathi, Gujarati, Tamil, Telugu, Kannada, Bengali) with diverse Indian accents. They naturally use colloquial vernacular fractions and local vocabulary ("dedh litre", "dhaai can", "pau kilo", "chhutti/naaga", "presswala", "khali jar", "hisaab").

The voice flow, step by step:
1. Tap-to-talk trigger: The user taps a prominent mic button on a clean mobile web interface right after closing their front door.
2. Natural compound speech: The user speaks a rapid multi-item sentence without formatting, e.g.: "Aaj doodh dedh litre liya, 2 water can aaye aur 1 khali jar wapas diya, aur presswale ko 4 shirt aur 2 pant diye."
3. Audio streaming & parsing: Wispr Flow / streaming Whisper converts speech to text. A fine-tuned LLM parses the transcript into a strict JSON payload:
   [
     {"vendor": "milk", "quantity": 1.5, "unit": "litres", "action": "received"},
     {"vendor": "water", "quantity": 2, "empty_returned": 1, "jar_balance_change": +1, "action": "delivered"},
     {"vendor": "laundry", "items": {"shirt": 4, "pant": 2}, "total_pieces": 6, "action": "given_for_ironing"}
   ]
4. Database & State Update: The app updates running monthly vendor ledgers (quantities, running rupees balance based on configured unit rates, and physical empty-jar tallies).
5. Voice Query & Settlement: When the user asks, "Is mahine paani ka kitna hua aur presswale ke kitne kapde bache hain?", the app fetches the ledger, calculates totals, and provides an instant spoken answer and a shareable bilingual WhatsApp summary card with a UPI payment link.

What the product says or shows back:
- Visual UI: Instant feedback cards appear within 800ms of speaking, showing color-coded chips:
  - 🥛 Milk: +1.5 L (₹99 added to monthly ledger)
  - 💧 Water: +2 Cans (₹70), 1 Jar returned (Deposit balance: 1 jar with vendor)
  - 👔 Laundry: 6 clothes handed over (Pending delivery: 6 items)
  Each card includes a 5-second "Undo / Edit" button to correct any detail with one tap.
- Audio feedback: An ultra-fast, natural Indian-accented TTS speaks a friendly 2-second confirmation in the user’s spoken language: "Theek hai! Dedh litre doodh, 2 water can, aur 6 press ke kapde note ho gaye."
- Query & Settlement UI: Displays an itemized date-wise tally sheet and generates a one-click WhatsApp message formatted for vendors (e.g., "Namaste Bhaiya, November ka water hisaab: 12 cans = ₹420. UPI link: ...").

Noise, accents, mixed languages and misheard input:
- Acoustic noise resilience: Integrates noise suppression and Voice Activity Detection (VAD) to filter doorstep background noise like pressure cooker whistles, traffic honks, calling vendors, or barking dogs.
- Code-mixed slang & number normalization: The system prompt includes an explicit colloquial mapping dictionary: "dedh" -> 1.5, "dhaai" -> 2.5, "sawa" -> 1.25, "paune do" -> 1.75, "aadha" -> 0.5, "ek pawa" -> 0.25, "naaga/chhutti" -> absent/leave, "advance" -> advance cash debit.
- Ambiguous or partial inputs: If a quantity or vendor is missing (e.g., user says: "Bhaiya ko do sau rupaye diye" without naming who), the assistant asks a targeted micro-question: "Yeh ₹200 kisko diye—presswale ko ya kaam wali didi ko?"
- Low-confidence audio recovery: If ASR confidence is below 0.6 due to heavy background noise or garbled audio, the voice agent speaks calmly: "Awaaz thodi saaf nahi aayi, kya aap dohra sakte hain?" and presents the last 3 frequent vendor shortcuts on screen for one-tap manual logging.
