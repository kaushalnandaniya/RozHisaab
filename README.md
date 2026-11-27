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
**RozHisaab** is a two-sided voice-first platform tailored for both Indian households and local doorstep vendors:

### 1. 🏠 Household / Family Mode (Ghar Ka Sadasya)
- **3-Second Compound Voice Log:** Speak one natural sentence right as the door closes:  
  > *"Aaj doodh dedh litre liya, 2 water can aaye aur 1 khali jar wapas diya, aur didi chhutti pe hain."*
- **Instant Multi-Vendor Parsing:** Automatically splits into structured records:
  - 🥛 Milk: +1.5 L
  - 💧 Water: +2 Cans, 1 Empty Jar returned (deposit balance updated)
  - 🧹 Maid: Absent (Chhutti)
- **Family Shared Sync:** Share your Household Code (e.g. `SHARMA-402`) with family members (Kaushal, Mummy, Papa, etc.) so multiple family members can log daily doorstep items without duplicate logs.
- **Voice Q&A:** Spoken balance checks: *"Is mahine paani ka total kitna hua?"*
- **1-Click Direct UPI & WhatsApp Settlement:** Generates date-stamped WhatsApp bills and native `upi://` links (Google Pay, PhonePe, Paytm, BHIM) to settle month-end bills without disputes.

### 2. 🛵 Local Vendor / Vyapari Mode (Doodhwala, Water Supplier, Presswala)
- **Route Delivery Batching:** Vendors delivering across apartment societies can speak their entire morning route in a single breath:  
  > *"Flat 402 dedh litre, Flat 501 do litre, Flat 104 chhutti"*
- **Apartment Customer Book:** Per-flat ledger with automated pending balance updates.
- **1-Tap WhatsApp Invoicing:** Send itemized monthly bills directly to apartment residents.

### 3. 📱 Adaptive Auto-Responsive UI
- **Desktop Mode (≥ md):** Two-column command center with a persistent left voice station, quick preset chips, sticky top navigation bar, and expanded tables.
- **Mobile Mode (< md):** Handheld-first single-column feed, sticky bottom navigation bar, and big tap-friendly controls.
- **Category Onboarding Wizard:** First-time launch wizard prompts the user to select their category (Ghar Ka Sadasya vs Local Vyapari) and customize their profile.

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
