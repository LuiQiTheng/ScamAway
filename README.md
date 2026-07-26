# ScamShield MY (UCRIX 2026 Prototype)

> **Explainable, Community-Verified Scam Intelligence & Intervention Platform**
> *"Analyse. Explain. Verify. Act before the user clicks, shares, or pays."*

Developed for the **3rd UPM Computer Science Research & International Innovation Exhibition (UCRIX 2026)**, in conjunction with **CIC ASIA 2026**.

This repository contains the complete prototype source code for **ScamShield MY**, which integrates **ScamShield AI** (automated multi-format parsing, explainable scoring, action checklists) and **ScamRadar** (moderated community reports, reporter reputation tracking, local trend dashboards).

---

## 🌟 Core Features

1. **User Scam Checker UI**:
   - **Multi-Format Inputs**: Supports Pasted Text, Screenshot Upload (with simulated OCR), QR Code Scanning (with camera simulation), and URL/Phone blacklists.
   - **Hybrid Risk Scoring**: Weighted engine calculating scam probability based on Rules (30%), Technical URL features (25%), Payment keywords (15%), Sender Reputation (15%), and Community Reports (15%).
   - **Explainable Evidence Breakdown**: Details the exact social engineering techniques and markers flagged (urgency, baits, bad redirects) to educate users rather than just warning them.
   - **Elderly-Friendly Mode**: Toggle for large fonts, high-contrast buttons, and **Audio Read-Aloud (Text-to-Speech)** voice support.
   - **Consent-Driven Report Redaction**: Anonymize screenshots and sensitive bank/phone details before reporting.

2. **Moderator & Admin Dashboard**:
   - **Moderation Queue**: Review, confirm, reject, or flag community-submitted reports.
   - **Indicator Auto-Blacklisting**: Confirmed reports instantly feed matching domains and numbers back into the scanning blacklists.
   - **Campus Alert Publisher**: Broadcast urgent campus threat warnings directly to the user dashboard.
   - **Reputation System**: Grade community reporters based on historical agreement rates and flags.

3. **Campus Trends & Analytics**:
   - **Category & Channel Analysis**: Interactive charts tracking vectors (Telegram, WhatsApp, SMS) and category trends.
   - **Interactive Hotspot Map**: SVG blueprint of a university campus mapping active incidents per faculty/building.

4. **Knowledge Centre (SDG 4 Alignment)**:
   - **Pattern Guides**: Interactive advisories for common Malaysian scam models (Pos Laju COD, Shopee jobs, LHDN refunds).
   - **"Spot the Scam" Quiz**: Interactive awareness game that grades users and assigns digital safety badges.

---

## 🚀 Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or above recommended)
- NPM (comes with Node.js)

### Installation Steps

1. Install project dependencies:
   ```bash
   npm install
   ```

2. Run the local development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the address shown in your terminal (typically `http://localhost:5173`).

---

## 🖥️ 3-Minute Live Demo Walkthrough

Follow this sequence for judging demonstrations:

1. **0:00 - 0:30: Show the Problem & System Intro**
   - Toggle **Elderly Mode** to showcase large text and test the **Read Aloud** audio narration.
2. **0:30 - 1:10: Multi-Format Scan & Explain**
   - Go to the **Screenshot OCR** tab. Select the **📦 Courier/Parcel Scam** demo preset.
   - Run the check to demonstrate scanning progress and review the **76/100 High Risk** score.
   - Inspect the **Explainable evidence indicators** to show the judges exactly how the score was calculated.
3. **1:10 - 1:45: Interactive Checklist & Consent Report**
   - Go through the verification checklist. Click **Report Scam**.
   - Preview the redacted text (phone numbers masked) and submit the community report.
4. **1:45 - 2:20: Moderator Verification Loop**
   - Navigate to the **Admin Moderation** tab. Select the newly reported case.
   - Enter a rationale and click **Confirm Scam Case**. This automatically adds the indicators to the checker's blacklist.
5. **2:20 - 3:00: Campus Alerts & Trend Dashboard Update**
   - In the moderator sidebar, type a broadcast alert message and click publish.
   - Switch to **Campus Trends** and click on the **Student Hostels** map zone to show real-time hotspot updates.
   - Return to the **Scam Checker** tab to see your broadcast alert active at the top.

---

## 🤝 SDG Alignment
- **SDG 16 (Peace, Justice and Strong Institutions)**: Reductions in fraud victimization via transparent evidence checking.
- **SDG 9 (Industry, Innovation and Infrastructure)**: Secure local data integration.
- **SDG 10 (Reduced Inequalities)**: Elderly-friendly and digital-literacy support formats.
- **SDG 4 (Quality Education)**: Interactive quiz components and public pattern guides.
