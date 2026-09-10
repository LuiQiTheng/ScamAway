# 📋 Scam Away — Team Task Distribution & Action Plan

> **Target Competition**: UCRIX 2026 / CIC ASIA 2026  
> **Source Audit Document**: [scam_away_audit_report.md](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/scam_away_audit_report.md)  
> **Team Members**: Lui Qi Theng, nikkaide, Chee Wei Jing, Yeexingg  
> **Date**: 2026-09-10  

---

## 🎯 Executive Overview

To transition Scam Away from a high-potential prototype into a **competition-winning, high-distinction civic cybersecurity platform (Score: 8.4/10)**, the 14 baseline prioritized actions plus the **3 latest strategic enhancements (`[ENH-01]`, `[ENH-02]`, `[ENH-03]`)** from our latest system audit ([scam_away_audit_report.md](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/scam_away_audit_report.md)) have been structured and distributed across all four team members based on individual technical strengths and core project domains.

---

## 👥 Summary Matrix

| Member | Focus Area | Tasks Count | Assigned Issues & Strategic Enhancements | Primary Target Files |
|:---|:---|:---:|:---|:---|
| **Lui Qi Theng** | Cloud BaaS, Security & Core AI Engine | **5 Tasks** | `SEC-01`, `BUG-01`, `SEC-02`, `DB-01/02`, **`ENH-01 (Engine)`** | `cryptoAuth.js`, `rulesEngine.js`, `aiEngine.js`, `AppContext.jsx`, `ReportModal.jsx` |
| **nikkaide** | UI Resilience, AI Guardrails & Vision UX | **4 Tasks** | `ARCH-03`, `AI-01`, `PERF-01`, **`ENH-01 (UI)`** | `ErrorBoundary.jsx`, `App.jsx`, `UserChecker.jsx`, `AppContext.jsx` |
| **Chee Wei Jing** | Privacy Redaction, Form UX & Account Recovery | **4 Tasks** | `SEC-03`, `DATA-01 (Part A)`, `DOC-01/CQ-01`, **`ENH-02`** | `redaction.js`, `ReportModal.jsx`, `LoginScreen.jsx`, `UserProfile.jsx`, `LanguageContext.jsx` |
| **Yeexingg** | Emergency Interventions, Admin & Guest Funnel | **4 Tasks** | `RESP-01`, `ARCH-02`, `DATA-01 (Part B)`, **`ENH-03`** | `UserChecker.jsx`, `ModeratorDashboard.jsx`, `TrendsDashboard.jsx`, `LoginScreen.jsx`, `App.jsx` |

---

### 📊 Workload & Responsibility Percentage Breakdown

The workload calculation uses standard **Agile Technical Complexity Weighting (Story Points)** based on algorithmic difficulty, architectural risk, and security depth:
* **Tier 1 — High / Architectural & Security Critical (5 Points)**: Web Crypto SHA-256 hashing, multi-factor heuristic scaling algorithm, multimodal Gemini 1.5 Flash vision pipeline.
* **Tier 2 — High-Moderate / Core Subsystem & Concurrency (4 Points)**: Firestore ACID `runTransaction` locks, multi-step OTP reset flows, complex visual verification panels, searchable audit log explorer.
* **Tier 3 — Moderate / Component Interaction & Multi-Regex (3 Points)**: PII regex expansion, ErrorBoundary crash handlers, duplicate indicator matching, emergency popup widgets, guest triage funnels.
* **Tier 4 — Standard / Performance & Hygiene (2 Points)**: Context memoization (`useCallback`), dictionary key deduplication.

| Member | Tasks | Story Points Breakdown | Total Points | Responsibility Share (%) |
|:---|:---:|:---|:---:|:---:|
| **Lui Qi Theng** | 5 | L-1 (5) + L-2 (5) + L-3 (3) + L-4 (4) + L-5 (5) | **22 pts** | **37.3%** |
| **Yeexingg** | 4 | Y-1 (3) + Y-2 (4) + Y-3 (3) + Y-4 (3) | **13 pts** | **22.0%** |
| **nikkaide** | 4 | N-1 (3) + N-2 (3) + N-3 (2) + N-4 (4) | **12 pts** | **20.3%** |
| **Chee Wei Jing** | 4 | C-1 (3) + C-2 (3) + C-3 (2) + C-4 (4) | **12 pts** | **20.3%** |
| **Team Total** | **17** | 59 Story Points | **59 pts** | **100.0%** |

* **Lui Qi Theng**: Takes the foundational engine, security, and algorithmic backend (**~37%**).
* **Teammates (nikkaide, Chee Wei Jing, Yeexingg)**: Evenly divided across their respective subsystems (**~21% each**).

---

## 🛠️ Detailed Member Task Assignments

---

### 1. Lui Qi Theng (Full-Stack & Systems Architecture)
**Core Strengths**: Firebase Firestore, Backend BaaS, Gemini API, VirusTotal/Numverify Integration, Core Scoring Logic.

#### Task L-1: [SEC-01] Client-Side Cryptographic Hashing & Session Sanitization
* **Priority**: 🔴 Critical
* **Files**: [cryptoAuth.js (NEW)](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/utils/cryptoAuth.js), [AppContext.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/context/AppContext.jsx)
* **Objective**: Completely eliminate plaintext passwords from Firestore queries and browser `localStorage`.
* **Action Steps**:
  1. Create `src/utils/cryptoAuth.js` with `hashPassword(password)` using `crypto.subtle.digest('SHA-256', ...)` with application salt.
  2. Implement `sanitizeUserSession(user)` to strip the `password` field before writing to `localStorage`.
  3. In `AppContext.jsx`: Hash passwords in `registerUser`, `loginUser`, `registerAdmin`, and `loginAdmin`.
  4. Ensure backward-compatibility: allow existing test accounts to log in and automatically upgrade their stored password to a hash.
* **Verification**: Open DevTools `Application > Local Storage`. Verify `scam_shield_user_session` contains no plaintext or hashed password string.

#### Task L-2: [BUG-01] Dynamic Risk Scoring (90–99 Scale) & Confirmed Report = 100%
* **Priority**: 🔴 Critical
* **Files**: [rulesEngine.js](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/utils/rulesEngine.js)
* **Objective**: Remove the hardcoded 85 clamp and ensure officially verified reports always score 100%.
* **Action Steps**:
  1. In `analyzeScamRisk`: If `verifiedReports > 0`, directly assign `score = 100` and unshift a `🚨 OFFICIALLY CONFIRMED SCAM` explanation badge.
  2. If an indicator matches the blacklist or has compounding threats: dynamically scale between `90` and `99` (Base 90 + 3 for Macau/police impersonation + 3 for bank transfer/OTP demand + 2 for urgency + 2 for AI confidence $\ge 0.90$).
  3. Ensure score never exceeds 99 unless it is an officially confirmed incident.
* **Verification**: Test with a verified report indicator (score must be 100) and a blacklisted indicator (score must be 90–99, never 85).

#### Task L-3: [SEC-02] Halt Global PII Leakage via Unfiltered Reports
* **Priority**: 🔴 Critical
* **Files**: [ReportModal.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/components/ReportModal.jsx), [AppContext.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/context/AppContext.jsx)
* **Objective**: Prevent unredacted victim details from being broadcast across client browser sessions.
* **Action Steps**:
  1. In `ReportModal.jsx`: Delete `originalText: message` from the payload passed into `onSubmitReport`.
  2. In `AppContext.jsx`: Ensure `reports` collection only writes the masked `text` field.
* **Verification**: Inspect the `reportsList` array in React DevTools; confirm no raw `originalText` containing phone numbers or bank accounts is stored in client state.

#### Task L-4: [DB-01 & DB-02] Atomic Concurrency (Report Counter & Blacklist Mutations)
* **Priority**: 🟡 High
* **Files**: [AppContext.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/context/AppContext.jsx)
* **Objective**: Prevent duplicate report IDs and race-condition overwrites in the blacklist.
* **Action Steps**:
  1. Wrap `reportCounter` in `addReport` using Firestore's `runTransaction` to increment atomically.
  2. In `addBlacklistItem` and `removeBlacklistItem`: Replace full array replacement with Firestore `arrayUnion(value)` and `arrayRemove(value)`.
* **Verification**: Rapidly trigger two mock report submissions; verify they receive sequential unique IDs (e.g. `#000001`, `#000002`).

#### Task L-5: [ENH-01] Core Multimodal Vision Analysis Engine (Gemini 1.5 Flash)
* **Priority**: 🔴 Strategic Enhancement / High Distinction
* **Files**: [aiEngine.js](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/utils/aiEngine.js), [rulesEngine.js](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/utils/rulesEngine.js)
* **Objective**: Implement backend multimodal screenshot analysis to evaluate visual crests, sender IDs, and extracted text.
* **Action Steps**:
  1. In `aiEngine.js`: Implement `analyzeScreenshotWithGemini(fileBase64, mimeType, contextLang)`.
  2. Use Gemini 1.5 Flash vision with structured JSON output returning: `platform`, `sender`, `visualRedFlags` (forged PDRM/LHDN logos, fake seals), `extractedText`, `riskScore`, and `explanation`.
  3. Feed the verbatim extracted text into `rulesEngine.js` for hybrid verification against local Malaysian blacklists.
* **Verification**: Upload a screenshot of a suspicious WhatsApp message; confirm Gemini returns platform, extracted text, and visual red flags.

---

### 🛡️ 2. nikkaide (UI Resilience, AI Guardrails & Vision UX)
**Core Strengths**: Responsive Layouts, Mobile Overlap Fixes, Context-Aware AI Rules, Accessibility (WCAG).

#### Task N-1: [ARCH-03] React Error Boundary Implementation
* **Priority**: 🟡 High
* **Files**: `src/components/ErrorBoundary.jsx` (NEW), [App.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/App.jsx)
* **Objective**: Protect the application from white-screen crashes caused by unhandled runtime errors in charts or TTS.
* **Action Steps**:
  1. Create a modern class-based `ErrorBoundary.jsx` displaying a friendly retry screen with a "Reload View" button.
  2. In `App.jsx`: Wrap each conditional tab view (`<UserChecker />`, `<TrendsDashboard />`, `<KnowledgeCentre />`, `<ModeratorDashboard />`) inside `<ErrorBoundary>`.
* **Verification**: Simulate a component render error; confirm a clean fallback error card appears without crashing the entire app.

#### Task N-2: [AI-01] Responsible Zero-Day Safety Framing & Officer Escalation
* **Priority**: 🟡 Medium
* **Files**: [UserChecker.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/components/UserChecker.jsx)
* **Objective**: Eliminate user complacency and legal liability from zero-day scams that receive low risk scores.
* **Action Steps**:
  1. For scans with score $< 35$: Replace "Safe / Genuine" with `"No Known Threat Indicators Detected"`.
  2. Add a persistent disclaimer card: *"Scammers continuously invent new tactics. If anyone asks you for money, passwords, or OTP, never proceed."*
  3. Add a 1-tap button: `"Still suspicious? Request Officer Second Opinion"` that opens `ReportModal` with pre-filled content.
* **Verification**: Run a scan on benign text; verify the card says "No Known Threat Indicators Detected" and displays the second-opinion button.

#### Task N-3: [PERF-01] Context Value Memoization & Mobile Render Optimization
* **Priority**: 🟢 Medium
* **Files**: [AppContext.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/context/AppContext.jsx)
* **Objective**: Stop typing lag and stutter on mobile devices and in Elderly Mode.
* **Action Steps**:
  1. Wrap all functions in `AppContext.jsx` (`registerUser`, `loginUser`, `registerAdmin`, `loginAdmin`, `updateCurrentUser`, `updateGuardian`, `deleteCurrentUser`) in `useCallback`.
  2. Clean up the `useMemo` dependency array of `contextValue` so references only update when state actually changes.
* **Verification**: Monitor React DevTools Profiler while typing in `UserChecker`; ensure sibling components do not re-render.

#### Task N-4: [ENH-01 UI] Dual-Layer Screenshot Verification Panel & OCR Text Editor
* **Priority**: 🔴 Strategic Enhancement / High Distinction
* **Files**: [UserChecker.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/components/UserChecker.jsx)
* **Objective**: Build the user-facing screenshot upload interface and transparent verification panel.
* **Action Steps**:
  1. Add an intuitive Drag-and-Drop / File Upload tab for screenshots in `UserChecker.jsx`.
  2. In the Results View for screenshots: Display a **Visual Forensic Card** showing detected platform (WhatsApp/Telegram/SMS), overseas sender warnings (e.g. +234, +62), and visual red flag badges.
  3. Provide an **"Extracted Text Review"** collapsible box with a 1-tap button: **"✏️ Edit Extracted Text & Re-Scan"** so users can verify and adjust OCR text transparency.
* **Verification**: Upload an image in `UserChecker`; confirm image preview displays, visual red flags appear, and the text can be edited and re-evaluated.

---

### 🌐 3. Chee Wei Jing (Privacy Masking, Form UX & Account Recovery)
**Core Strengths**: Guardian Ecosystem, Kid/Elderly Modes, Bahasa Melayu Localization, Form Modals.

#### Task C-1: [SEC-03] Malaysian PII Masking Engine Overhaul
* **Priority**: 🔴 Critical / High
* **Files**: [redaction.js](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/utils/redaction.js)
* **Objective**: Mask all sensitive Malaysian identification formats before reports are saved.
* **Action Steps**:
  1. Add Malaysian NRIC pattern: `\b\d{6}[-\s]?\d{2}[-\s]?\d{4}\b` $\rightarrow$ `[REDACTED IC/NRIC]`.
  2. Expand Malaysian phone pattern to support spaces, dashes, and international prefixes: `(?:\+?60|0)[\s-]?1[0-9](?:[\s-]?[0-9]){7,8}\b` $\rightarrow$ `[REDACTED PHONE]`.
  3. Expand bank account pattern to handle numbers with spaces or dashes: `\b(?:\d[\s-]?){8,16}\b` $\rightarrow$ `[REDACTED BANK ACCOUNT]`.
  4. Add email address masking: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` $\rightarrow$ `[REDACTED EMAIL]`.
* **Verification**: Call `redactSensitiveInformation("IC: 980102-14-5566, Acc: 1642 2891 0239")`; confirm both are masked.

#### Task C-2: [DATA-01 Part A] User-Facing Duplicate Linking & Reassurance UX
* **Priority**: 🟡 Medium
* **Files**: [ReportModal.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/components/ReportModal.jsx)
* **Objective**: Give citizens warm, reassuring feedback when submitting an indicator that is already in the database.
* **Action Steps**:
  1. When submitting, check if any extracted phone or bank account matches an existing report in `reportsList`.
  2. If matching: Instead of showing an error or duplicate block, attach `linkedToReportCode: matchedReport.reportCode`.
  3. Display a friendly confirmation dialog in English and Bahasa Melayu thanking the user for strengthening community evidence.
* **Verification**: Submit a report with an existing phone number; verify the warm confirmation message displays.

#### Task C-3: [DOC-01 & CQ-01 Part A] Dictionary Deduplication & Outdated String Pruning
* **Priority**: 🟢 Low
* **Files**: [LanguageContext.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/context/LanguageContext.jsx), [README.md](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/README.md)
* **Objective**: Remove duplicate dictionary keys and prune decommissioned feature references.
* **Action Steps**:
  1. Fix the duplicate keys in `LanguageContext.jsx` flagged by the linter.
  2. In `LanguageContext.jsx` line 60: Change *"verify URLs, messages and QR codes"* to *"verify URLs, messages and phone numbers"*.
  3. In `README.md`: Remove mentions of the decommissioned regional threat map and camera QR scanning.
* **Verification**: Run `npm run lint` or Oxlint; confirm duplicate key warnings drop to zero.

#### Task C-4: [ENH-02] Resilient Account Recovery & Password Reset via Gmail OTP
* **Priority**: 🔴 Strategic Enhancement / High Usability
* **Files**: [LoginScreen.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/components/LoginScreen.jsx), [AppContext.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/context/AppContext.jsx), [UserProfile.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/components/UserProfile.jsx)
* **Objective**: Prevent permanent account lockout for users who forget their password.
* **Action Steps**:
  1. Update `registerUser` and `UserProfile` to capture and store `email` (Gmail).
  2. On `LoginScreen.jsx`: Add a **"Forgot Password?"** link under the password input.
  3. Clicking "Forgot Password?" opens a 3-step modal:
     * Step 1: Enter Username or registered Gmail address.
     * Step 2: Enter 6-digit OTP sent to email (with a deterministic demo fallback like `123456` to guarantee 100% reliability during live competition judging).
     * Step 3: Enter and confirm new password (hashed via `hashPassword` before updating Firestore).
* **Verification**: Click "Forgot Password?", enter username, input OTP, set new password, and log in with the new password.

---

### 📊 4. Yeexingg (Emergency Intervention, Admin Governance & Analytics)
**Core Strengths**: Trends Dashboard, Curated Educational Lessons, Floating Emergency Help, Moderator Workflows.

#### Task Y-1: [RESP-01] Immediate Emergency First-Aid Pop-Up (NSRC 997 Direct Dial)
* **Priority**: 🟡 High
* **Files**: [UserChecker.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/components/UserChecker.jsx)
* **Objective**: Provide instant emergency assistance to victims during active scams without waiting for manual review.
* **Action Steps**:
  1. When scan analysis completes with `score >= 80` (High/Critical Threat), trigger a compact emergency pop-up.
  2. Content:
     * Alert text: *"🚨 High Risk Detected! If you transferred money or shared banking OTP, contact the National Scam Response Centre (NSRC) immediately."*
     * **1-Tap Direct Call Button**: `tel:997` (NSRC Malaysia Hotline).
     * Quick link to major Malaysian bank emergency fraud numbers.
     * Easy dismiss button ("I haven't transferred money").
* **Verification**: Test with a high-risk prompt; confirm the popup renders with clickable `tel:997` action.

#### Task Y-2: [ARCH-02] Moderator Dashboard Access Guard & Audit Trail Explorer
* **Priority**: 🟡 High
* **Files**: [ModeratorDashboard.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/components/ModeratorDashboard.jsx)
* **Objective**: Restrict police dashboard access and make administrative audit logs searchable and traceable.
* **Action Steps**:
  1. At top of `ModeratorDashboard`: Check `if (!adminProfile)`. If not logged in as officer, render an "Access Denied" screen.
  2. In the Audit Sub-Tab:
     * Add a Search Input (search by Officer ID, Officer Name, or Report Code).
     * Add an Action Type Filter (All, Status Updates, Blacklist Changes, Threat Alerts).
     * Display Officer ID, department, formatted timestamp, and specific rationale notes.
* **Verification**: Log out as admin; verify the moderator tab is blocked. Log in; verify audit logs can be searched and filtered.

#### Task Y-3: [DATA-01 Part B & CQ-01 Part B] Clustered Incident View & Trends Cleanup
* **Priority**: 🟢 Medium
* **Files**: [ModeratorDashboard.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/components/ModeratorDashboard.jsx), [TrendsDashboard.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/components/TrendsDashboard.jsx)
* **Objective**: Group duplicate reports in the moderator queue and clean up unused chart code.
* **Action Steps**:
  1. In `ModeratorDashboard.jsx`: Replace `r.category === report.category` duplicate logic with exact indicator matching (`r.phone === report.phone`, `r.bankAccount === report.bankAccount`, or `r.linkedToReportCode`).
  2. Display a cluster badge on grouped cards: `🔗 3 Linked Reports (High Velocity)`.
  3. In `TrendsDashboard.jsx`: Prune unreferenced imports and unused variables flagged by the linter.
* **Verification**: Create two reports with the same phone number; verify the moderator queue displays the linked badge on the incident card.

#### Task Y-4: [ENH-03] Zero-Friction Emergency Quick Scan (Guest Triage) & Conversion Funnel
* **Priority**: 🔴 Strategic Enhancement / Civic Growth
* **Files**: [LoginScreen.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/components/LoginScreen.jsx), [App.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/App.jsx), [UserChecker.jsx](file:///c:/Users/LENOVO_QT0524/Downloads/UCRIX%202026%20-Scam%20Away/src/components/UserChecker.jsx)
* **Objective**: Remove registration friction for victims during an active scam emergency, while creating a post-scan conversion funnel.
* **Action Steps**:
  1. On `LoginScreen.jsx`: Add a high-visibility button: **"⚡ Quick Scan / Emergency Check (No Sign Up Needed)"**.
  2. Clicking enters `App.jsx` in Guest Mode, directly opening `UserChecker.jsx` for scanning text, URLs, and screenshots.
  3. Add Tab Gating: If a guest clicks on `KnowledgeCentre` or `UserProfile`, display a modal: *"Unlock Full Protection: Sign up free to save report tracking, take scam awareness quizzes, and protect family members."*
  4. Post-Scan Hook in `UserChecker.jsx`: When a scan detects threat markers, show a call-to-action: *"Create free citizen account to save this report for police evidence"*.
* **Verification**: Open the app logged out; click "Quick Scan"; confirm scanner works immediately without signing up, and protected tabs prompt for registration.

---

## 🚀 Git Branching & Coordination Rules

To prevent code merge conflicts, each member should create their respective feature branch:

```bash
# Lui Qi Theng
git checkout -b feature/core-crypto-scoring-vision

# nikkaide
git checkout -b feature/error-boundary-and-vision-ui

# Chee Wei Jing
git checkout -b feature/pii-redaction-and-otp-recovery

# Yeexingg
git checkout -b feature/emergency-popup-and-guest-triage
```

### Order of Integration:
1. **Lui Qi Theng** merges `feature/core-crypto-scoring-vision` into `main` (establishes `cryptoAuth.js`, dynamic scoring, and Gemini vision engine).
2. **Chee Wei Jing** merges `feature/pii-redaction-and-otp-recovery` (updates `redaction.js`, `ReportModal`, and OTP reset flow).
3. **Yeexingg** merges `feature/emergency-popup-and-guest-triage` (adds NSRC 997 popup, Guest triage mode, and Moderator queue clustering).
4. **nikkaide** merges `feature/error-boundary-and-vision-ui` (adds `ErrorBoundary`, vision verification panel, and final UX polish).
