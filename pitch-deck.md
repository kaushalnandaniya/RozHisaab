# RozHisaab — Pitch Deck Document

> **Hackathon:** Scaler × Wispr Flow ("Build for Bharat" / "India Runs on Voice")  
> **Submission Requirement:** "We read the words in your deck, not the pictures, so write your key points as text. Cover: 1. Problem and solution, 2. Who it is for, 3. What it depends on, 4. Launch plan."  
> **Export Format:** Export as PDF (e.g. via print to PDF or Google Slides / Canva).

---

## Slide 1: Cover
**RozHisaab (रोज़ हिसाब)**  
*Voice-First Doorstep Ledger for Indian Homes*  
Built for Bharat | Scaler × Wispr Flow National Hackathon  
**Creator:** Kaushal Nandaniya  
**Repository:** [github.com/kaushalnandaniya/RozHisaab](https://github.com/kaushalnandaniya/RozHisaab)

---

## Slide 2: Problem and Solution
### Who has the problem:
Every Indian household depends daily on 3 to 6 informal doorstep services:
- Morning milk packets (1L regular, 1.5L when guests visit)
- 20L water cans (delivered vs. empty jars returned for deposit)
- Ironing / Presswala (giving shirts, pants, sarees; tracking unreturned pieces)
- Domestic workers / Kaamwali Didi (tracking leaves/chhutti, sick days, cash advances)
- Daily tiffin deliveries and newspaper pauses

### Why existing solutions fail:
Transactions occur in 5-second doorstep exchanges while holding groceries, bags, or keys while rushing for work. Manual expense and bookkeeping apps fail within 5 days because typing 4 separate entries with full hands creates more friction than each ₹40 item is worth. Households default to wall calendars or memory. At month-end, households and vendors routinely clash over disputed tallies ("Bhaiya, 18th ko do can nahi, ek hi can aaya tha"), costing Indian families **₹400–₹1,500 every month in leakages** and damaging trust.

### How RozHisaab solves it:
RozHisaab is a **zero-friction voice-first daily ledger**:
1. Right as the door closes, the user speaks one natural sentence in Hindi, Hinglish, or their regional language:
   > *"Aaj doodh dedh litre liya, 2 water can aaye aur 1 khali jar wapas diya, aur didi chhutti pe hain."*
2. RozHisaab parses compound multi-vendor speech into structured records in **under 800 milliseconds**.
3. Gives a friendly 2-second audio confirmation ("1.5L doodh, 2 water can, didi ki chhutti note ho gaya!").
4. Generates a 1-click date-stamped bilingual WhatsApp settlement card with a UPI deep link at month-end so both parties settle with zero disputes.

---

## Slide 3: Who It Is For
### Target User Segments:
1. **Urban & Semi-Urban Households (~80–100 Million homes across India):**
   - Homemakers managing household operations
   - Dual-income working couples with zero time for manual paperwork
   - Senior citizens and elderly parents living independently who find English typing keyboards intimidating
   - Young professionals and students in shared bachelor flats/PGs splitting water and milk costs
2. **Informal Doorstep Micro-Vendors (~15–20 Million workers):**
   - Independent milkmen, water can delivery boys, neighborhood dhobis/presswalas, and domestic helpers who suffer delayed or disputed payments due to lack of a shared paper trail.

### Real-World Frequency:
Unlike tax filing or monthly budgeting apps used once a month, RozHisaab is activated **2 to 5 times every single day**, building an unbreakable daily utility habit.

---

## Slide 4: What It Depends On (Tech & Resilience)
### Architecture & Dependencies:
- **Speech-to-Text (STT):**
  - *Default (Zero-Config):* Browser native **Web Speech API (`hi-IN` / `en-IN`)**. Zero latency, 100% free, runs client-side.
  - *Cloud Upgrades:* Compatible with **Groq Whisper API** (`whisper-large-v3-turbo`) and **Wispr Flow Voice Interface API**.
- **Natural Language Parsing:**
  - *Default (Offline Resilient):* Custom **Rule-Based Hindi/Hinglish NLP Parser** (`src/lib/parser.ts`) with vernacular fraction understanding (`dedh` = 1.5, `dhaai` = 2.5, `sawa` = 1.25, `paune do` = 1.75, `aadha` = 0.5, `chhutti` = absent).
  - *Cloud Upgrade:* **Gemini 2.0 Flash** for complex conversational edge-cases.
- **Database & Storage:** Embedded SQLite with Prisma ORM. Completely self-contained, runs anywhere with `docker-compose up` or `npm run dev`.
- **Settlement Delivery:** Universal `wa.me` WhatsApp deep links + standard NPCI UPI payment protocol.

### What happens if external services get costly or stop working:
**RozHisaab has ZERO single-vendor lock-in.**
Because the core product is architected with a full offline rule-based parser and native browser speech engines, **the app continues to work 100% without any paid API or external server**. If third-party AI APIs experience outages or introduce high pricing, RozHisaab seamlessly degrades to its offline zero-cost engine without interrupting the user's daily doorstep logging.

---

## Slide 5: Launch Plan & Growth Strategy
### Phase 1: Hyper-Local Housing Society Pilots (Month 1)
- Partner with Resident Welfare Associations (RWAs) and Society WhatsApp groups across Pune, Mumbai, and Bengaluru.
- Onboard 500 households via a 30-second video demo showing how simple voice logging eliminates billing fights with the local water-can vendor and presswala.

### Phase 2: The Viral WhatsApp Distribution Loop (Organic Growth)
- RozHisaab has built-in viral distribution. At month-end, households send the generated **bilingual WhatsApp settlement card** directly to their vendor:
  > *"Namaste Raju Bhaiya, November ka doodh hisaab: 38 Litres = ₹2,584. Pay via UPI: ... Sent via RozHisaab"*
- When other families see the vendor accepting clear RozHisaab digital tallies, or when vendors recommend RozHisaab to their other customers to avoid disputes, adoption spreads organically throughout apartment complexes and neighborhoods.

### Phase 3: B2B Doorstep Vendor Network (Month 3–6)
- Provide a simplified vendor-facing view for water can agencies and milk dairies to broadcast delivery notifications.
- Monetization via optional premium analytics (family expense trends, multi-home support, and automated UPI auto-pay scheduling) while keeping core voice logging **free for Bharat forever**.
