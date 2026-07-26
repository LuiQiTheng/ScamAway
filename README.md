# ScamShield

> [!IMPORTANT]
> 📂 **Implementation Specification**: Detailed technical document available at [`implementation.md`](implementation.md)  
> 🚀 **Target Competition**: 3rd UPM Computer Science Research & International Innovation Exhibition (UCRIX 2026) / CIC ASIA 2026

Explainable, Community-Verified Scam Intelligence & Intervention Platform.  
*"Analyse. Explain. Verify. Act before the user clicks, shares, or pays."*

---

## 🚀 Getting Started

Follow these steps to get the project running locally.

### 1. Prerequisites
- **Node.js**: (v18 or higher recommended)
- **NPM**: Package manager (included with Node.js)

### 2. Install & Start Services

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the Application**:
   ```bash
   npm run dev
   ```

3. **Open Application**:
   Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 🧱 Workspace Layout

- `src/components/UserChecker.jsx`: Scam checking interface (Regular & Elderly mode, Text-to-Speech narration)
- `src/components/ReportModal.jsx`: Anonymized report redaction and submission preview
- `src/components/ModeratorDashboard.jsx`: Moderation queue, indicator auto-blacklisting, and community threat alert publisher
- `src/components/TrendsDashboard.jsx`: Category charts and interactive Malaysia regional threat map
- `src/components/KnowledgeCentre.jsx`: Scam pattern advisories and "Spot the Scam" awareness quiz
- `src/utils/rulesEngine.js`: Hybrid risk assessment scoring engine, keyword detectors, and blacklist overrides
- `implementation.md`: Technical specification, data schema, and SDG alignment document

---

## 🛠️ Stack

- **Frontend & Web App**: React 19, Vite, Lucide Icons
- **Styling System**: Vanilla CSS (Dark mode, Neon glassmorphism, responsive rules)
- **Analysis Engine**: Rule-Based Pattern Fusion, Social Engineering Keyword Detector, Blacklist Overrides
- **Accessibility & Voice**: Web Speech API (Text-to-Speech Audio Synthesis), Elderly Mode
- **State & Storage**: Anonymized Report Schemas, Local Indicator Blacklists, Reputation Indices

---

## 🌟 Core Features

- **Multi-Format Scam Checker**: Pasted text, screenshot upload (OCR simulation), QR camera scanner, URL/Phone checks.
- **Explainable Evidence Breakdown**: Details exact social-engineering markers (urgency, credential harvesting, payment requests).
- **Critical Blacklist Override**: Matching blacklisted accounts or numbers locks risk score to **85%+ (Critical)**.
- **Admin Moderation & Threat Alerts**: Moderator verification queue and broadcast warnings.
- **Interactive Regional Map**: State-wide incident mapping across Malaysia (Kuala Lumpur, Selangor, Johor, Penang, Perak).

---

## 🤝 SDG Alignment
- **SDG 16 (Peace, Justice and Strong Institutions)**: Reductions in fraud victimization via transparent evidence checking.
- **SDG 9 (Industry, Innovation and Infrastructure)**: Secure local data integration.
- **SDG 10 (Reduced Inequalities)**: Elderly-friendly and digital-literacy support formats.
- **SDG 4 (Quality Education)**: Interactive quiz components and public pattern guides.
