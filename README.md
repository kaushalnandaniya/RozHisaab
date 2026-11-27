# RozHisaab 🎙️🇮🇳

> **A Voice-First Daily Doorstep Ledger for Indian Homes**  
> Built for the **Scaler × Wispr Flow ("Build for Bharat" / "India Runs on Voice") Hackathon**  
> **Theme:** Everyday Access for All / Livelihoods & Small Business

---

## 🌟 The Problem
Every Indian household buys daily recurring doorstep services where quantities fluctuate constantly without receipts:
- 🥛 **Milk:** 1L regular, 1.5L when relatives visit
- 💧 **20L Water Cans:** 2 delivered, 1 empty jar returned (deposit tracking)
- 👔 **Presswala (Ironing):** 4 shirts, 2 pants given; pending returns
- 🧹 **Maid / Kaamwali Didi:** Leaves/chhutti, cash advances
- 🍱 **Tiffin Service / Newspaper:** Skipped or paused days

Because transactions happen at the front door while holding bags or rushing out, nobody opens an expense app to type 4 entries daily. At month-end, households and vendors argue over disputed counts, costing Indian families **₹400–₹1,500 every month** in leakages and damaging trust.

---

## 🚀 The Voice-First Solution
**RozHisaab** lets you speak one natural sentence in Hindi, Hinglish, or English right as the door closes:

> *"Aaj doodh dedh litre liya, 2 water can aaye aur 1 khali jar wapas diya, aur didi chhutti pe hain."*

1. **3-Second Voice Log:** Captures compound multi-vendor speech without typing.
2. **Instant Multi-Vendor Parsing:** Automatically splits into separate structured records:
   - Milk: +1.5 L
   - Water: +2 Cans, 1 Empty Jar returned
   - Maid: Absent (Chhutti)
3. **Audio Confirmation:** Speaks back a crisp 2-second Hindi confirmation via speech synthesis.
4. **5-Second Undo:** Accidental entries can be reverted with one tap.
5. **Month-End WhatsApp Settlement:** Generates a date-stamped, bilingual WhatsApp bill with a UPI deep link to settle on Day 1 without arguments.

---

## ⚡ Zero-Config Guarantee (Strict Hackathon Compliance)
- ✅ **Starts with ONE command:** `docker-compose up` or `npm run dev`
- ✅ **100% Functional WITHOUT any API keys:**
  - Uses browser **Web Speech API (`hi-IN`)** for client-side transcription
  - Uses an offline **Rule-Based Hindi/Hinglish Parser** (`src/lib/parser.ts`) supporting colloquial fraction words (`dedh`, `dhaai`, `paune do`, `sawa`, `aadha`, `chhutti`, `khali jar`)
  - Uses a self-contained local database
- ✅ **Optional Cloud Enhancements:** When `GEMINI_API_KEY`, `GROQ_API_KEY`, or `WISPR_API_KEY` are provided, the app automatically unlocks cloud LLM reasoning and Whisper transcription. When omitted, it gracefully displays an info badge without breaking.

---

## 🐳 Quick Start (One Command with Docker)

```bash
# Clone the repository
git clone https://github.com/kaushalnandaniya/RozHisaab.git
cd RozHisaab

# Run with Docker Compose
docker-compose up --build
```
Open **[http://localhost:3000](http://localhost:3000)** in Google Chrome or Edge.

---

## 💻 Local Development (Without Docker)

```bash
# Install dependencies
npm install

# Initialize local database
npx prisma db push
npx tsx prisma/seed.ts

# Start dev server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Zero-Config Fallback |
|---|---|---|
| **Frontend** | Next.js (App Router), React, Tailwind CSS | PWA-ready, mobile-first |
| **Speech-to-Text** | Web Speech API (`hi-IN` / `en-IN`) | Optional: Groq Whisper / Wispr Flow |
| **Parser** | Custom Rule-Based Engine (`src/lib/parser.ts`) | Optional: Gemini 2.0 Flash (`src/lib/ai-parser.ts`) |
| **Database** | SQLite + Prisma ORM | Embedded zero-config file (`prisma/dev.db`) |
| **Text-to-Speech** | Browser `SpeechSynthesis` API | Native Hindi voice audio feedback |
| **Settlement** | WhatsApp `wa.me` deep links + UPI protocol | Free, universal compatibility |

---

## 📐 Project Structure
```
RozHisaab/
├── docker-compose.yml          # One-command Docker run
├── Dockerfile                  # Production Next.js container
├── prisma/
│   ├── schema.prisma           # User, Vendor, Entry models
│   └── seed.ts                 # Default Indian vendors & demo user
├── src/
│   ├── app/
│   │   ├── page.tsx            # Main Voice Log screen (mic, today's feed)
│   │   ├── ledger/page.tsx     # Monthly date-wise tally per vendor
│   │   ├── settle/page.tsx     # WhatsApp bill generator & UPI cards
│   │   ├── vendors/page.tsx    # Vendor rates & empty jar settings
│   │   └── api/                # REST endpoints (parse, entries, settle, transcribe)
│   ├── components/
│   │   ├── MicButton.tsx       # Animated mic with ripple & live transcript
│   │   ├── UndoToast.tsx       # 5-second undo toast
│   │   └── KeyNoticeBanner.tsx # Zero-config transparency badge
│   └── lib/
│       ├── parser.ts           # Offline Hindi/Hinglish NLP parser
│       ├── slang-map.ts        # Colloquial fraction & vendor vocabulary
│       ├── speech.ts           # Web Speech API wrapper
│       └── tts.ts              # Browser Hindi SpeechSynthesis
```

---

## 📄 License
MIT License. Built with ❤️ for Bharat by Kaushal Nandaniya.
