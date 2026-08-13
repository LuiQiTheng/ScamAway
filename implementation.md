# Scam Away Technical Implementation & Content Specification

> **System Identity**: Scam Away  
> **Tagline**: *Analyse. Explain. Verify. Act before the user clicks, shares or pays.*  
> **Target Competition**: UCRIX Innovation 2026 / CIC ASIA 2026  
> **Domain**: Cybersecurity, Financial Fraud Prevention, Digital Literacy & Safety  

---

## 1. Executive Summary & System Positioning

**Scam Away** is an explainable, community-verified scam intelligence and digital safety intervention platform. Unlike traditional "black-box" classifiers that merely label content as "scam" or "safe", Scam Away focuses on **intervention at the moment of uncertainty**. It extracts evidence, calculates a hybrid risk score, breaks down the exact social-engineering indicators in plain language, and guides users through safe verification or reporting actions.

### Core Innovations
1. **Explainable Prevention**: Identifies why content is dangerous (e.g. urgency pressure, credential harvesting, unverified domains) to educate the user.
2. **Hybrid Risk Fusion**: Combines rule engines, social-engineering keyword detectors, critical blacklist overrides, and community verification counts.
3. **Critical Blacklist Overrides**: Instantly flags confirmed mule bank accounts, malicious URLs, or scam dispatch numbers with an automatic 85%+ Critical rating.
4. **Inclusive Accessibility Mode**: Elderly-friendly large font sizing, simplified vocabulary, and built-in **Web Speech API Audio Narration**.
5. **Privacy-by-Design Reporting**: Automatically redacts personal details (names, phone numbers, bank accounts) before community submission.

---

## 2. System Architecture & Technical Specifications

```
                     ┌──────────────────────────────────────────────┐
                     │            User Input Interfaces             │
                     │             (Text, URL/Phone)                │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │          Indicator Extraction Layer          │
                     │  (Regex Parsing, Domain Clean, Account Match)│
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │         Hybrid Risk Scoring Engine           │
                     │ ┌──────────────────────────────────────────┐ │
                     │ │ 1. Blacklist Override Check              │ │
                     │ │ 2. Social Engineering Keyword Rules       │ │
                     │ │ 3. Payment & Impersonation Trigger Words │ │
                     │ │ 4. Co-Occurrence Multiplier Penalties    │ │
                     │ │ 5. Community Verification Weight         │ │
                     │ └──────────────────────────────────────────┘ │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │            Result & Guidance View            │
                     │  (Risk Band, Evidence Breakdown, Checklist)  │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │      Moderator & Regional Trends Engine      │
                     │  (Blacklist Feed, Map Hotspots, Alerts)      │
                     └──────────────────────────────────────────────┘
```

---

## 3. Detailed Component Implementation

### 3.1 Indicator Extraction Module (`src/utils/rulesEngine.js`)
The extraction module receives raw user text, URLs, or phone numbers and parses key indicators:
- **URL Extractor**: Matches http/https and domain structures (`([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}`).
- **Phone Extractor**: Matches Malaysian and international phone formats (`+601x`, `01x`, `03x`).
- **Payment Extractor**: Captures currency symbols (`RM`, `Ringgit`), numbers, and payment trigger phrases.
- **Account Extractor**: Scans for 10-15 digit sequences matching flagged mule bank account registers.
- **External API Validators**: Asynchronously validates extracted numbers via the **Numverify Phone Carrier API** and cross-references bank accounts against a **Mock CCID JSON Database**.

### 3.2 Scoring Math & Risk Band Classification
Risk scores range between `0` and `100`:

| Risk Score | Risk Band | Color Code | System Safety Rule & Wording |
| :--- | :--- | :--- | :--- |
| **0 – 29** | **Low evidence** | Green (`#10b981`) | *No strong indicators detected from the submitted evidence. Verify independently before acting.* (Never promises absolute "safety"). |
| **30 – 59** | **Caution** | Orange (`#f59e0b`) | *Suspicious elements were found. Pause and verify using an official channel.* |
| **60 – 79** | **High risk** | Red (`#ef4444`) | *Multiple scam indicators are present. Do not pay or share credentials until independently verified.* |
| **80 – 100** | **Critical** | Dark Red (`#7f1d1d`) | *Strong combined evidence or verified local matches are present. Block, preserve evidence and report through approved channels.* |

#### Blacklist Override Rule
If a submitted text contains an exact match with any item in the `LOCAL_BLACK_LIST` (mule bank accounts, blacklisted dispatch phones, malicious lookalike domains):
$$\text{Base Score} = \max(\text{Calculated Score}, 85)$$
This ensures high-stakes threats are never misclassified into low or caution bands.

#### Compound Multipliers
When multiple high-risk indicators co-occur (e.g. `Payment Request` + `Urgency Pressure` + `Family Impersonation`), a compound penalty of `+15` points is added to the score.

---

## 4. Primary User Screens & Functional Workflows

### 4.1 User Checker & Elderly Mode (`src/components/UserChecker.jsx`)
- **Regular Mode**: Sleek dark-mode interface with neon accents, tabbed input selectors (Text, URL checker, Phone checker), and quick demo presets (Pos Laju scam, Shopee task scam, Family emergency scam, TNB legitimate notification).
- **Elderly-Friendly Mode**: Enlarges typography to `1.25rem`+, expands touch target padding to `18px`+, and activates **Web Speech API Audio Narration** to read out risk bands and action checklists aloud.
- **External Database Results UI**: Displays real-time validation badges (e.g., Numverify carrier info, CCID mock database matches) directly in the analysis output.
- **Verification Checklist**: Interactive step-by-step checklist instructing users to pause, verify official phone numbers, and avoid transferring funds.

### 4.2 Consent-Driven Redaction Modal (`src/components/ReportModal.jsx`)
- **Automated Masking**: Replaces phone numbers and bank account numbers with `[REDACTED]` tokens in the preview window.
- **Redaction Preview**: Users can toggle between the original text and the redacted output before confirming consent.
- **Moderator Queue Insertion**: Consented reports update the global reports queue for human verification.

### 4.3 Moderator & Admin Dashboard (`src/components/ModeratorDashboard.jsx`)
- **Incident Queue**: Review incoming citizen reports, check AI risk evaluations, and inspect duplicate case counts.
- **Auto-Blacklisting**: Confirming a report automatically extracts its domains and phone numbers into the active scanning blacklist.
- **Community Alert Broadcaster**: Allows authorized moderators to publish real-time threat advisories that display at the top of all user checker screens.
- **Reputation Tracking**: Evaluates citizen reporters based on historical agreement rates and total verified contributions.

### 4.4 Common Trends & Regional Map (`src/components/TrendsDashboard.jsx`)
- **Regional Threat Map**: Interactive SVG vector layout mapping active incidents across Malaysian states and territories (**Kuala Lumpur, Selangor, Johor, Penang, Perak**).
- **Format Breakdown**: SVG bar charts displaying the distribution of scam categories (Phishing, Courier/Parcel, Part-time Jobs, Emergency Impersonation, Marketplace).
- **Vector Analysis**: Track reporting channels (WhatsApp, Telegram, SMS, Social Media, Email).

### 4.5 Knowledge Centre & Spot the Scam Quiz (`src/components/KnowledgeCentre.jsx`)
- **Malaysian Scam Cheat Sheets**: Pattern guides covering courier COD tax scams, Shopee job commission baits, and LHDN tax refund phishing.
- **Awareness Quiz**: Interactive scenario test evaluating user decisions, rendering immediate feedback, and assigning safety ranks (*Digital Safety Champion*, *Scam Protection Expert*, *Scam Protection Cadet*).

---

## 5. Core Data Model

```json
{
  "users": {
    "userId": "string",
    "role": "citizen | moderator | admin",
    "verificationLevel": "integer",
    "language": "en | ms",
    "accessibilityMode": "boolean"
  },
  "submissions": {
    "submissionId": "string",
    "inputType": "text | url | phone",
    "rawText": "string",
    "createdAt": "timestamp"
  },
  "assessments": {
    "assessmentId": "string",
    "score": "integer (0-100)",
    "riskBand": "Low evidence | Caution | High risk | Critical",
    "confidence": "Low | Medium | High",
    "explanations": ["object"]
  },
  "reports": {
    "reportId": "string",
    "category": "phishing | parcel | job | emergency | marketplace | finance",
    "redactedText": "string",
    "status": "unverified | under_review | confirmed | rejected",
    "reporterId": "string"
  },
  "blacklist": {
    "id": "string",
    "type": "phone | url | account",
    "value": "string",
    "timestamp": "timestamp",
    "addedBy": "string (admin ID)"
  }
}
*Note: Real-time synchronization is powered by Firebase Firestore, ensuring instantaneous global updates across all users for Blacklists, Audit Logs, and Alerts.*

```

---

## 6. Sustainable Development Goal (SDG) Alignment

- **SDG 16 (Peace, Justice and Strong Institutions)**: Strengthens public trust in digital transactions and reduces financial fraud victimization.
- **SDG 9 (Industry, Innovation and Infrastructure)**: Implements explainable AI and local indicator blacklisting.
- **SDG 10 (Reduced Inequalities)**: Ensures inclusive access through Elderly-Friendly Mode, large touch targets, and Text-to-Speech support for low digital literacy users.
- **SDG 4 (Quality Education)**: Transforms every scan into a learning moment through explainable reasons, educational cards, and awareness quizzes.
