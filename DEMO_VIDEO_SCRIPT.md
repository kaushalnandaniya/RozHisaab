# RozHisaab — 2.5-Minute YouTube Demo Video Script 🎬🎙️

> **Hackathon Requirement:** Public or unlisted YouTube video, 3 minutes or less. Show your product working.

---

## ⏱️ Video Breakdown (Target: 2 min 15 sec)

### Scene 1: Hook & The Bharat Doorstep Problem (0:00 - 0:25)
- **Visual:** Show the landing page of **RozHisaab** running on `http://localhost:3000`.
- **Spoken Voiceover:**
  > "Namaste! This is Kaushal Nandaniya, and this is **RozHisaab** — a voice-first daily doorstep ledger built for Indian households and local vendors for the Scaler × Wispr Flow Hackathon.
  > In Indian homes, we buy milk, 20-litre water jars, ironing from the presswala, and manage maid leaves at our front door every morning. Because it happens in 5-second exchanges while rushing for work, nobody types in an expense app. At month-end, families and vendors fight over missing jars and disputed milk days. RozHisaab solves this with pure voice."

---

### Scene 2: Initial Stage Category Selection & Family Share (0:25 - 0:45)
- **Visual:** 
  1. Click the **Setup / Category** button (`⚙️`) in the top navigation bar to showcase the **Initial Category & Role Onboarding Wizard**.
  2. Point out the two clear paths:
     - 🏠 **Ghar Ka Sadasya (Household):** With Family Member selector (`Kaushal`, `Mummy`, `Papa`) and **Household Sync Code** (`SHARMA-402`) so the whole house shares one ledger and never duplicates orders.
     - 🛵 **Local Vyapari (Vendor):** For delivery routes.
  3. Select **Ghar Ka Sadasya (Kaushal)** and click **Shuru Karein**. Hear the Hindi greeting and celebration confetti!

---

### Scene 3: Compound Doorstep Voice Logging (0:45 - 1:15)
- **Visual:**
  1. Click the **Mic Button** (or tap one of the preset quick-test buttons):
     > *"Aaj doodh dedh litre liya aur 2 water can aaye"*
  2. Watch the live transcription, instant multi-item split in under 800ms:
     - 🥛 Milk: +1.5 L (₹102)
     - 💧 Water: +2 Cans (₹140)
  3. Listen to the Hindi audio confirmation: *"Dedh litre doodh aur do water can note ho gaya!"*
  4. Point out the **Undo Toast** at the bottom right giving 5 seconds to revert accidental voice taps.
  5. Demonstrate a second complex voice command:
     > *"Sunita didi aaj chhutti pe hain"*
     - Notice the maid attendance updates to absent/leave automatically!

---

### Scene 4: Spoken Q&A & Spoken Vendor Onboarding (1:15 - 1:40)
- **Visual:**
  1. Tap the mic and ask:
     > *"Is mahine paani ka total kitna hua?"*
     - The app calculates the water can total and speaks the response in Hindi!
  2. Add a vendor hands-free by voice:
     > *"Naya vendor add karo: Ramu Car Wash, rate 500 rupaye mahina, phone 9876543210"*
     - Shows the vendor celebration card with instant rate and contact setup!

---

### Scene 5: Vyapari (Vendor Route Delivery Mode) (1:40 - 2:00)
- **Visual:**
  1. Switch toggle to **🛵 Vyapari (Vendor Mode)** in the navbar.
  2. Explain:
     > "RozHisaab isn't just for households — it's a two-sided platform. A milk delivery boy can speak his whole apartment route in one breath:"
  3. Speak or tap:
     > *"Flat 402 dedh litre, Flat 501 do litre, Flat 104 chhutti"*
  4. Show the batch customer delivery confirmations updating the apartment ledger in real time!

---

### Scene 6: Month-End WhatsApp Settlement & 1-Click Direct UPI (2:00 - 2:20)
- **Visual:**
  1. Click **Settle / WhatsApp** in the navbar.
  2. Select a vendor (e.g. Raju Doodhwala).
  3. Show the generated date-stamped bilingual WhatsApp message.
  4. Highlight the **"Pay via UPI"** button (which triggers `upi://pay?pa=...` for instant GPay/PhonePe payment) and click **"WhatsApp Pe Bhejein"** to preview the WhatsApp Web chat.

---

### Scene 7: Zero-Config Resilience & Outro (2:20 - 2:30)
- **Visual:** Point to the green **Zero-Config Transparency Banner** at the top.
- **Spoken Voiceover:**
  > "RozHisaab starts with a single command via Docker, requires zero API keys or external credit cards to function, and runs 100% locally with offline fallbacks. Check out the public code on GitHub. Dhanyawaad!"

---

## 💡 Quick Tips for Recording:
- **Browser:** Google Chrome (ensures native Web Speech API and Hindi SpeechSynthesis audio work smoothly).
- **Tool:** QuickTime Player on Mac (`File > New Screen Recording`) or OBS Studio.
- **Microphone:** Use earphones or Mac internal mic for crisp voice.
- **YouTube Upload Setting:** Set video to **Public** or **Unlisted** and paste the link in the Scaler HackOS dashboard before Nov 30!
