# 🎯 Scam Away — Competition Demo Script

> **Duration**: ~8–10 minutes  
> **Audience**: UCRIX 2026 / CIC ASIA 2026 Judges  
> **Setup**: Open `http://localhost:5173` in Chrome. Ensure internet access (for Numverify API).

---

## Pre-Demo Checklist
- [ ] Run `npm run dev` and confirm the app loads
- [ ] Verify you have a test user account (e.g., username: `demo_user`, password: `demo123`)
- [ ] Verify you have a test admin account (e.g., Officer ID: `PDRM-KL-001`, password: `admin123`)
- [ ] Verify internet connection is active (for Numverify API calls)

---

## Act 1: First Impression & Login (1 min)

### Talking Points:
- "Scam Away is an Explainable, Community-Verified Scam Intelligence platform designed for Malaysians."
- "Notice the bilingual support — judges can toggle between English and Bahasa Melayu right from the login screen."

### Steps:
1. Open the app → Login screen appears (login-first flow)
2. **Toggle language** from English to Bahasa Melayu → entire UI changes instantly
3. Toggle back to English
4. Click **"User"** → Login form appears
5. Login with demo user credentials

---

## Act 2: Scam Detection Engine — Rules Engine + Explainability (3 min)

### Talking Points:
- "Our core innovation is the Explainable AI Scanner. It doesn't just say 'scam' or 'safe' — it tells you exactly WHY."
- "The engine combines a 30+ rule pattern matcher, a community-verified blacklist, a mock CCID police database, Numverify phone validation, and Google Gemini AI."

### Steps:
1. Navigate to the **Scanner** tab
2. Click **Quick Test** → Select **"Pos Laju Parcel Scam"** preset
3. Click **"Analyse"** → Watch the scanning progress steps:
   - ✅ Extracting text & indicators...
   - ✅ Cross-referencing police database (CCID)...
   - ✅ Validating phone number via Numverify...
   - ✅ Running AI validation...
4. **Results appear** with a high risk score (85+):
   - Point to the **Evidence Breakdown**: "Each indicator is explained — urgency language, payment demand, blacklisted domain, and most importantly..."
   - Point to **🚨 Police Database Match (Mock)**: "The phone number 011-1234567 was found in our mock CCID database with 12 reports."
   - Point to **📞 Phone Validation**: "Numverify confirmed this number's line type and carrier."
5. Scroll to **Recommended Safety Actions**: "We give users a clear action checklist."

6. **Counter-test**: Click **"New Scan"**, select **"TNB Legitimate Advisory"** preset
7. Click **"Analyse"** → Low risk score (~15-25)
8. "Notice the engine correctly identifies this as legitimate — it explains WHY it's safe."

---

## Act 2B: Database Intelligence Deep Dive (1 min)

### Talking Points:
- "In production, we would connect to the real SemakMule / CCID API. For this demo, we simulate it with a local JSON database."
- "The Numverify integration validates phone numbers in real-time against international databases."

### Steps:
1. Click **"New Scan"**, select **"Telegram Job Offer Scam"** preset
2. Point out: "This message contains both a phone number AND a bank account that match our mock police database."
3. Show the CCID match badges and Numverify results
4. "Each data source contributes to the final risk score independently and transparently."

---

## Act 3: Bilingual TTS & Elderly Mode (2 min)

### Talking Points:
- "Scam Away is designed for ALL Malaysians, including the elderly who are most vulnerable."
- "Our elderly mode activates automatically for users aged 55+ with larger fonts and simplified UI."

### Steps:
1. Toggle language to **Bahasa Melayu** → entire UI changes
2. From scan results, click the **🔊 "Baca" (Read Aloud)** button
3. "The system reads the safety guidance in Bahasa Melayu using the Web Speech API."
4. **Show elderly mode** (if demo user age is ≥55, or mention): "For elderly users, the interface automatically enlarges text and simplifies the layout."
5. **Show Guardian feature**: "Young users (under 13) and elderly users can set up a Guardian — a trusted contact who receives alerts."

---

## Act 4: Community Reporting & Moderator Workflow (2 min)

### Talking Points:
- "Scam Away is powered by its community. Users can report scams they encounter, and moderators verify them."
- "PII (personal information) is automatically redacted before submission."

### Steps:
1. From the scan result, click **"Report to Community"**
2. Show the **PII redaction preview**: "Notice phone numbers are masked (e.g., 012-XXX-XXXX)."
3. Submit the report → Success screen with a report tracking code
4. **Log out** → Log back in as **Admin/Moderator**
5. Navigate to the **Moderator Dashboard**
6. Find the just-submitted report in the queue
7. Click to review → Show the full full evidence breakdown
8. Click **"Confirm"** → "The report is now verified and the indicators are added to the community blacklist."
9. Optionally: Show **Community Alert** publishing: "Moderators can broadcast threat alerts to all users."

---

## Act 5: Educational Features (1 min)

### Talking Points:
- "Prevention is better than cure. Scam Away educates users daily."

### Steps:
1. Navigate to **Knowledge Centre** → Show the **Daily Scam Lesson** (rotates daily)
2. Show the **Spot the Scam quiz** → "Gamified learning with real Malaysian scam scenarios."
3. Navigate to **Emergency Help** → "If someone has already been scammed, we provide direct links to Malaysian authorities — PDRM, BNM, MCMC, NSRC 997."

---

## Closing Statement (30 sec)

> "Scam Away's mission is: **Analyse. Explain. Verify. Act** — before the user clicks, shares, or pays."
>
> Key differentiators:
> 1. **Explainable AI** — every risk score comes with transparent evidence
> 2. **Multi-source intelligence** — rules engine + AI + community reports + police database + phone validation
> 3. **Inclusive design** — bilingual, TTS, elderly mode, guardian alerts
> 4. **Community-driven** — verified reports strengthen the system for everyone
>
> SDG Alignment: Goal 16 (Peace & Justice), Goal 9 (Innovation), Goal 10 (Reduced Inequalities), Goal 4 (Quality Education)

---

## Emergency Backup Notes
- If Numverify API is down: The scan will still complete — it gracefully falls back and shows "Unknown" for phone validation
- If Gemini AI times out: The rules engine score still works independently
- Quick test presets always produce consistent, demonstrable results
