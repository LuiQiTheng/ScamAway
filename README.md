# ScamShield MY (UCRIX 2026 Prototype)

> **Explainable, Community-Verified Scam Intelligence & Intervention Platform**
> *"Analyse. Explain. Verify. Act before the user clicks, shares, or pays."*

Developed for the **3rd UPM Computer Science Research & International Innovation Exhibition (UCRIX 2026)**, in conjunction with **CIC ASIA 2026**.

This repository contains the complete prototype source code for **ScamShield MY**, which integrates automated multi-format parsing, explainable scoring, action checklists, moderated community reports, reporter reputation tracking and local trend dashboards.

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

## 🤝 SDG Alignment
- **SDG 16 (Peace, Justice and Strong Institutions)**: Reductions in fraud victimization via transparent evidence checking.
- **SDG 9 (Industry, Innovation and Infrastructure)**: Secure local data integration.
- **SDG 10 (Reduced Inequalities)**: Elderly-friendly and digital-literacy support formats.
- **SDG 4 (Quality Education)**: Interactive quiz components and public pattern guides.
