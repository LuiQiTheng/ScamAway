import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const translations = {
  en: {
    // Navigation
    "nav.scanner": "Scanner",
    "nav.knowledge": "Knowledge Centre",
    "nav.profile": "My Profile",
    "nav.elderly": "Elderly Mode",
    "nav.submit_report": "Submit Report",
    "nav.moderator": "Admin Moderation",
    "nav.trends": "Scam Trends",

    // Login
    "login.welcome": "Welcome to Scam Away",
    "login.subtitle": "Please select your role to log into the system.",
    "login.user": "Citizen / User",
    "login.user_desc": "Access scanner & reporting profile",
    "login.admin": "Moderator / Admin",
    "login.admin_desc": "Manage reports & review dashboard",

    //Logout
    "app.logout": "Log Out",

    // Trends Dashboard
    "trends.title": "Community Scam Trends",
    "trends.subtitle": "Stay informed about the latest scam activities reported by the Scam Away community. These statistics help users recognize emerging scam threats and stay vigilant.",
    "trends.info_title": "About This Data",
    "trends.info_content": "These statistics are generated from scam reports submitted by the Scam Away community. They are intended to raise public awareness of current scam trends and help users stay vigilant.",
    "trends.kpi_total": "Community Scam Reports",
    "trends.kpi_pending": "Reports Under Review",
    "trends.kpi_confirmed": "Verified Scam Cases",
    "trends.kpi_blacklist": "Known Scam Sources",
    "trends.chart_category": "Most Reported Scam Categories",
    "trends.chart_status": "Report Verification Status",
    "trends.chart_timeline": "Recent Scam Reports",
    "trends.no_data": "No report data available to display trends.",
    "trends.tooltip_count": "Count",
    "trends.tooltip_reports": "Reports",

    // Admin Dashboard
    "admin.queue": "Case Queue",
    "admin.blacklists": "Blacklists",
    "admin.audit": "Audit Log",
    "admin.analytics": "Analytics",
    "admin.pending_queue": "Pending Verification Queue",
    "admin.confirmed_scams": "Confirmed Local Scams",
    "admin.rep_index": "Reputation Accuracy Index",
    "admin.reviewing": "Reviewing Report",
    "admin.confirm_btn": "Confirm Scam Case",
    "admin.reject_btn": "Reject / Dismiss Report",
    "admin.flag_btn": "Flag Under Review",
    "admin.broadcast_title": "Broadcast Community Alert",
    "admin.broadcast_btn": "Publish Threat Alert",
    "admin.broadcast_placeholder": "Type high-risk threat warning to broadcast to all users...",
    "admin.cases": "cases",
    "admin.items": "items",
    "admin.filter_all": "All Cases",
    "admin.filter_pending": "Pending Review",
    "admin.filter_confirmed": "Confirmed Scams",
    "admin.filter_rejected": "Rejected",
    "admin.search_placeholder": "Search text, ID, category, or user...",
    "admin.all_categories": "All Categories",
    "admin.no_reports_search": "No reports found. Try changing your search or filters.",
    "admin.no_reports": "No active reports match this filter.",
    "admin.ai_score": "Risk Index",
    "admin.add_blacklist": "Add to Blacklist",
    "admin.domain_url": "Domain / URL",
    "admin.phone_number": "Phone Number",
    "admin.bank_account": "Bank Account",
    "admin.add_btn": "Add to List",
    "admin.blocked_domains": "Blocked Domains",
    "admin.blocked_phones": "Blocked Phones",
    "admin.no_audit": "No moderation actions logged yet.",
    "admin.action": "Action:",
    "admin.on_report": "on Report #",
    "admin.note": "Note:",
    "admin.category_breakdown": "Scam Category Breakdown",
    "admin.resolution_status": "Platform Resolution Status",
    "admin.category_label": "Category:",
    "admin.text_evidence": "Anonymized Text Evidence:",
    "admin.ai_eval": "AI Risk Evaluation",
    "admin.dup_incidents": "Duplicate Incidents Matched",
    "admin.matching_cases": "matching cases",
    "admin.mod_note": "Moderation Note / Rationale",
    "admin.mod_note_placeholder": "e.g., Matches verified POS Laju SMS phishing URL format. Added pos-laju.info to blocklist.",
    "admin.community_reporters": "Community Reporters",
    "admin.role": "Role:",
    "admin.level": "level",
    "admin.agree": "Agree",
    "admin.verified": "verified",

    // Mode Selector & Accessibility
    "mode.title": "Audience Mode",
    "mode.normal": "👤 Normal",
    "mode.elderly": "👵 Elderly",
    "mode.kid": "🎮 Kid / Teen",

    // Scanner
    "scanner.title": "Scan Suspicious Context",
    "scanner.placeholder": "Paste suspicious text message, email, or context here...",
    "scanner.button": "Analyze Risk",
    "scanner.upload_btn": "Upload Screenshot (OCR)",
    "scanner.qr_btn": "Scan QR Code",
    "scanner.url_btn": "URL & Phone Check",
    "scanner.ai_explanation": "AI Analysis",
    "scanner.assistant": "Scam Away Assistant",
    "scanner.assistant_elderly": "Scam Away Care Assistant",
    "scanner.assistant_kid": "Scam Away Junior Radar 🎮",
    "scanner.analyzing": "Analyzing with AI Models...",
    "scanner.text_paste": "Describe incident",
    "scanner.assistant_desc": "Multi-format evidence analyzer & safety guide",
    "scanner.assistant_desc_kid": "Fun & smart protection against game currency scams, fake top-ups & online traps!",
    "scanner.switch_regular": "👵 Switch to Regular Mode",
    "scanner.switch_elderly": "👵 Switch to Elderly Mode",

    // Results
    "result.high_risk": "High Risk Detected",
    "result.safe": "Appears Safe",
    "result.caution": "Caution Advised",
    "result.flags": "Red Flags:",
    "result.submit_db": "Submit to Global Database",
    "result.risk_score": "Risk Index",
    "result.evidence_breakdown": "Why does this matter? Evidence Breakdown:",
    "result.no_critical_evidence": "No critical social-engineering pressure, blacklisted accounts, or malicious redirect URLs were extracted.",
    "result.safety_guidance": "Recommended Safety Guidance:",
    "result.report_scam_btn": "Report Scam & Alert Community",
    "result.scan_another_btn": "Scan Another Content",
    "result.weight": "Signal weight",

    // Guardian
    "guardian.settings": "Guardian Settings",
    "guardian.settings_desc":
      "Manage your trusted guardian information for emergency protection.",

    "guardian.create": "Add Guardian",
    "guardian.edit": "Edit Guardian",

    "guardian.create_desc":
      "Add a trusted guardian for emergency notifications.",

    "guardian.edit_desc":
      "Update your trusted guardian information.",

    "guardian.add": "Add Guardian",
    "guardian.update": "Update Guardian",

    "guardian.name": "Guardian Name",
    "guardian.name_placeholder": "Enter guardian name",

    "guardian.relationship": "Relationship",
    "guardian.select_relationship": "Select relationship",

    "guardian.phone": "Phone Number",
    "guardian.phone_placeholder": "Enter phone number",

    "guardian.relationships.Father": "Father",
    "guardian.relationships.Mother": "Mother",
    "guardian.relationships.Son": "Son",
    "guardian.relationships.Daughter": "Daughter",
    "guardian.relationships.Sibling": "Sibling",
    "guardian.relationships.Relative": "Relative",
    "guardian.relationships.Caregiver": "Caregiver",
    "guardian.relationships.Other": "Other",

    "guardian.errors.name_required": "Guardian name is required.",
    "guardian.errors.relationship_required":
      "Please select a relationship.",
    "guardian.errors.phone_required":
      "Phone number is required.",
    "guardian.errors.phone_invalid":
      "Please enter a valid phone number.",

    "guardian.alert.title": "Guardian Protection Activated",
    "guardian.alert.description": "Your safety is our priority.",

    "guardian.alert.high_risk": "High Risk Scam Detected",

    "guardian.alert.high_risk_desc":
      "Our AI has identified this content as a high-risk scam. Your registered guardian has already been notified to help keep you safe.",

    "guardian.alert.status": "Guardian Status",

    "guardian.alert.sent": "Notification Sent Successfully",

    "guardian.alert.sent_to": "Notification sent to",

    "guardian.alert.stop":
      "Please stop interacting with this content immediately.",

    "guardian.alert.return": "Return Home",

    "guardian.alert.high_risk_desc":
      "Our AI has identified this content as a high-risk scam. Your registered guardian has already been notified to help keep you safe.",
      
    // Profile
    "profile.title": "My Reports & Tracking",
    "profile.status": "Status",
    "profile.pending": "Pending Review",
    "profile.confirmed": "Confirmed Scam",
    "profile.rejected": "Rejected",
    "profile.update_notice": "Update on your report!",
    "profile.update_desc": "Your report regarding a {category} scam was reviewed by a moderator.",
    "profile.table_date": "Date",
    "profile.table_category": "Category",
    "profile.table_content": "Content Snippet",
    "profile.no_reports": "No reports submitted yet.",

    // Knowledge Centre
    "knowledge.quiz_title": "Daily 15-Question Challenge",
    "knowledge.quiz_start": "Start Challenge",
    "knowledge.quiz_desc": "Test your scam detection skills! Get a streak to unlock safety badges.",
    "knowledge.quiz_header": "Spot the Scam! Awareness Quiz",
    "knowledge.question_count": "Question {current} of {total}",
    "knowledge.streak": "Streak",
    "knowledge.library_title": "Malaysian Scam Pattern Intelligence Library",
    "knowledge.library_desc": "Explore comprehensive real-world Malaysian scam signatures, psychological traps, and official advisories.",
    "knowledge.category": "Category",
    "knowledge.scam_explanation": "Scam Explanation",
    "knowledge.read_case_study": "Read Complete Case Study & Red Flags",
    "knowledge.evidence_sample": "Real-World Text/SMS Evidence Sample",
    "knowledge.red_flags": "Identified Red Flag Markers",
    "knowledge.psychology": "Psychological Strategy Used by Scammer",
    "knowledge.advisory": "Prevention & Verification Advisory",
    "knowledge.quiz_scam_btn": "🔴 It's a Scam / Phishing",
    "knowledge.quiz_safe_btn": "🟢 It's Legitimate / Safe",
    "knowledge.correct_decision": "Correct Decision!",
    "knowledge.incorrect_decision": "Incorrect Decision!",
    "knowledge.next_question": "Next Question",
    "knowledge.next_correction": "Got it, next correction",
    "knowledge.correction_phase": "Correction Phase: {count} remaining",
    "knowledge.challenge_completed": "Challenge Completed!",
    "knowledge.score_msg": "You scored",
    "knowledge.score_msg2": "correctly on the first try.",
    "knowledge.out_of": "out of",
    "knowledge.longest_streak": "Longest Streak",
    "knowledge.final_rank": "Final Rank",
    "knowledge.play_another": "Play Another Round",
    "knowledge.exit_challenge": "Exit Challenge",
    "knowledge.ready_challenge": "Ready for the Daily Challenge?",
    "knowledge.challenge_intro": "Test your skills against the latest scam tactics. Can you identify the red flags and maintain your streak?",
    "knowledge.start_challenge": "Start Challenge",
    "knowledge.example_message": "Example Message / SMS:",
    "knowledge.show_more": "Show More",
    "knowledge.show_less": "Show Less",

    // Categories
    "category.all": "All",
    "category.courier": "Courier & Delivery",
    "category.job": "Job & Task Scams",
    "category.threat": "Threat & Govt Impersonation",
    "category.investment": "Impossible Investment",
    "category.emergency": "Emergency & Secrecy",
    "category.qr": "Quishing / QR Code",

    // Report Modal
    "report.submitted": "Report Submitted",
    "report.thank_you": "Thank you! The report is now added to the queue for moderator verification. Your community contribution helps make our campus safer.",
    "report.community_eyebrow": "Community protection",
    "report.title": "Submit Community Report",
    "report.desc": "Your report will update local campus indicators and dashboards once approved. All personally identifiable details are masked automatically.",
    "report.message_label": "Scam message or evidence",
    "report.message_placeholder": "Paste the suspicious message, link, phone number, or payment request here...",
    "report.message_help": "You can edit the scanner text before submitting. Sensitive numbers are masked in the shared copy.",
    "report.message_required": "Please enter the suspicious message before submitting.",
    "report.close": "Close report form",
    "report.category": "Scam Category",
    "report.cat_phishing": "Phishing / Suspicious Link",
    "report.cat_parcel": "Courier / Parcel scam",
    "report.cat_job": "Part-time Job offer",
    "report.cat_emergency": "Family emergency impersonation",
    "report.cat_marketplace": "Off-platform trading / Marketplace scam",
    "report.cat_finance": "Mule Bank accounts / Finance bait",
    "report.redacted_preview": "Redacted Evidence Preview",
    "report.show_masked": "Show Masked",
    "report.show_original": "Show Original",
    "report.verified_filters": "* Verified database filters match indicators while preserving your anonymity.",
    "report.consent": "I consent to upload this anonymized evidence. I verify that this represents suspicious or unsolicited content.",
    "report.cancel": "Cancel",
    "report.submit_btn": "Submit Report",

    // Scanner Extras
    "scanner.step_ocr": "Extracting text & character recognition (OCR)...",
    "scanner.step_parse": "Parsing URLs & checking QR code destinations...",
    "scanner.step_match": "Matching phone numbers and bank account indicators...",
    "scanner.step_db": "Checking community reputation database...",
    "scanner.step_score": "Calculating hybrid risk score...",
    "scanner.alert_badge": "Community Alert",
    "scanner.alert_title": "Active Threat Advisory",
    "scanner.demo_select": "Select a Demo Case (Simulates Photo Upload & OCR):",
    "scanner.demo_courier": "📦 Courier/Parcel Scam",
    "scanner.demo_job": "💼 Shopee Part-time Job",
    "scanner.demo_emergency": "🚨 Urgent Family Emergency",
    "scanner.demo_legit": "✅ Legitimate TNB Advisory",
    "scanner.upload_title": "Upload a Screenshot / Image",
    "scanner.upload_desc": "PNG, JPG or WebP. Text will be extracted instantly using client OCR simulation.",
    "scanner.loaded": "Loaded:",
    "scanner.clear": "Clear",
    "scanner.open_camera": "Open Camera Scanner",
    "scanner.paste_qr": "Or Paste QR Raw Target URL",
    "scanner.qr_placeholder": "e.g., https://pos-laju.info/pay-fee/2.50",
    "scanner.verify_qr": "Verify URL Code",
    "scanner.url_label": "URL / Web Address",
    "scanner.phone_label": "Sender Phone Number (Optional)",
    "scanner.searching": "Searching database...",
    "scanner.scan_url_btn": "Scan URL & Contact",
    "scanner.empty_url_error": "Please enter a website address.",
    "scanner.invalid_url_detailed_error": "Invalid URL. Please enter a valid website address. Example: https://example.com",
    "scanner.security_check": "Security Check Running",
    "scanner.stop_readout": "Stop Readout",
    "scanner.read_aloud": "Read Aloud",
    "scanner.url_placeholder": "e.g. maybank-secure-login.xyz or pos-laju.info",
    "scanner.phone_placeholder": "e.g. +6011-8762512",
    "scanner.ocr_failed": "Error extracting text. Please type manually.",

    // App Footer & Roles
    "app.role_user": "👤 User",
    "app.role_admin": "👮 Admin",
    "app.footer_title": "Scam Away — Explainable Digital Safety Platform",
    "app.footer_desc": "Prepared for UCRIX Innovation 2026 Competition. Aligning with UN Sustainable Development Goals (SDG 16, 9, 10, 4).",

    // Knowledge Centre Extras
    "knowledge.search_placeholder": "Search scam library by keyword...",
    "knowledge.highlight": "★ Highlight",
    "knowledge.close_case": "Close Case Study",
    "knowledge.rank_1": "Digital Safety Master",
    "knowledge.rank_2": "Vigilant Defender",
    "knowledge.rank_3": "Aware Citizen",
    "knowledge.rank_4": "Beginner Learner",

    // Engine
    "engine.speech_done": "Risk assessment complete. The result is {band} with a risk score of {score} percent.",
    "engine.speech_low": "No strong scam indicators were detected. However, please verify independently.",
    "engine.speech_caution": "Caution. Suspicious elements were found. Please pause and verify.",
    "engine.speech_high": "Warning. High risk elements detected. Do not pay or share credentials.",
    "engine.speech_intro": "Here are the recommended safety actions.",

    // General
    "common.close": "Close",
    "common.loading": "Processing...",

    // Statuses
    "status.unverified": "Unverified",
    "status.under_review": "Under Review",
    "status.confirmed": "Confirmed",
    "status.rejected": "Rejected"
  },
  ms: {
    // Navigation
    "nav.scanner": "Pengimbas",
    "nav.knowledge": "Pusat Ilmu",
    "nav.profile": "Profil Saya",
    "nav.elderly": "Mod Warga Emas",
    "nav.submit_report": "Hantar Laporan",
    "nav.moderator": "Moderasi Admin",
    "nav.trends": "Trend Scam",

    // Login
    "login.welcome": "Selamat Datang ke Scam Away",
    "login.subtitle": "Sila pilih peranan anda untuk log masuk ke sistem.",
    "login.user": "Pengguna Biasa",
    "login.user_desc": "Akses pengimbas & profil pelaporan",
    "login.admin": "Moderator / Admin",
    "login.admin_desc": "Urus laporan & pusat tinjauan",

    //Logout
    "app.logout": "Log Keluar",

    // Trends Dashboard
    "trends.title": "Trend Scam Komuniti",
    "trends.subtitle": "Kekal maklum mengenai aktiviti penipuan terkini yang dilaporkan oleh komuniti Scam Away. Statistik ini membantu pengguna mengenali ancaman penipuan baharu dan kekal berwaspada.",
    "trends.info_title": "Mengenai Data Ini",
    "trends.info_content": "Statistik ini dijana daripada laporan penipuan yang diserahkan oleh komuniti Scam Away. Ia bertujuan untuk meningkatkan kesedaran awam mengenai trend penipuan terkini dan membantu pengguna kekal berwaspada.",
    "trends.kpi_total": "Jumlah Laporan Komuniti",
    "trends.kpi_pending": "Laporan Dalam Semakan",
    "trends.kpi_confirmed": "Kes Scam Disahkan",
    "trends.kpi_blacklist": "Sumber Scam Dikenali",
    "trends.chart_category": "Kategori Scam Paling Banyak Dilaporkan",
    "trends.chart_status": "Status Pengesahan Laporan",
    "trends.chart_timeline": "Laporan Scam Terkini",
    "trends.no_data": "Tiada data laporan tersedia untuk memaparkan trend.",
    "trends.tooltip_count": "Jumlah",
    "trends.tooltip_reports": "Laporan",

    // Admin Dashboard
    "admin.queue": "Gilir Kes",
    "admin.blacklists": "Senarai Hitam",
    "admin.audit": "Log Audit",
    "admin.analytics": "Analitik",
    "admin.pending_queue": "Menunggu Pengesahan",
    "admin.confirmed_scams": "Scam Tempatan Disahkan",
    "admin.rep_index": "Indeks Ketepatan Reputasi",
    "admin.reviewing": "Menyemak Laporan",
    "admin.confirm_btn": "Sahkan Kes Scam",
    "admin.reject_btn": "Tolak / Gugur Laporan",
    "admin.flag_btn": "Tanda Sedang Disemak",
    "admin.broadcast_title": "Hebahan Amaran Komuniti",
    "admin.broadcast_btn": "Terbit Amaran Ancaman",
    "admin.broadcast_placeholder": "Taip amaran ancaman berisiko tinggi untuk dihantar kepada semua pengguna...",
    "admin.cases": "kes",
    "admin.items": "item",
    "admin.filter_all": "Semua Kes",
    "admin.filter_pending": "Menunggu Semakan",
    "admin.filter_confirmed": "Scam Disahkan",
    "admin.filter_rejected": "Ditolak",
    "admin.search_placeholder": "Cari teks, ID, kategori, atau pengguna...",
    "admin.all_categories": "Semua Kategori",
    "admin.no_reports_search": "Tiada laporan ditemui. Cuba tukar carian atau penapis anda.",
    "admin.no_reports": "Tiada laporan aktif yang sepadan dengan penapis ini.",
    "admin.ai_score": "Indeks Risiko",
    "admin.add_blacklist": "Tambah ke Senarai Hitam",
    "admin.domain_url": "Domain / URL",
    "admin.phone_number": "Nombor Telefon",
    "admin.bank_account": "Akaun Bank",
    "admin.add_btn": "Tambah ke Senarai",
    "admin.blocked_domains": "Domain Disekat",
    "admin.blocked_phones": "Telefon Disekat",
    "admin.no_audit": "Tiada tindakan moderasi direkodkan lagi.",
    "admin.action": "Tindakan:",
    "admin.on_report": "pada Laporan #",
    "admin.note": "Nota:",
    "admin.category_breakdown": "Pecahan Kategori Scam",
    "admin.resolution_status": "Status Resolusi Platform",
    "admin.category_label": "Kategori:",
    "admin.text_evidence": "Bukti Teks Tanpa Nama:",
    "admin.ai_eval": "Penilaian Risiko AI",
    "admin.dup_incidents": "Insiden Pendua Sepadan",
    "admin.matching_cases": "kes sepadan",
    "admin.mod_note": "Nota Moderasi / Rasional",
    "admin.mod_note_placeholder": "cth., Sepadan dengan format pancingan data SMS POS Laju. pos-laju.info ditambah ke senarai hitam.",
    "admin.community_reporters": "Pelapor Komuniti",
    "admin.role": "Peranan:",
    "admin.level": "tahap",
    "admin.agree": "Setuju",
    "admin.verified": "disahkan",

    // Mode Selector & Accessibility
    "mode.title": "Mod Khalayak",
    "mode.normal": "👤 Biasa",
    "mode.elderly": "👵 Warga Emas",
    "mode.kid": "🎮 Remaja & Budak",

    // Scanner
    "scanner.title": "Imbas Konteks Mencurigakan",
    "scanner.placeholder": "Tampal mesej teks, e-mel, atau konteks mencurigakan di sini...",
    "scanner.button": "Analisis Risiko",
    "scanner.upload_btn": "Muat Naik Tangkapan Skrin (OCR)",
    "scanner.qr_btn": "Imbas Kod QR",
    "scanner.url_btn": "Semak URL & Telefon",
    "scanner.ai_explanation": "Analisis AI",
    "scanner.assistant": "Pembantu Scam Away",
    "scanner.assistant_elderly": "Pembantu Penjagaan Scam Away",
    "scanner.assistant_kid": "Radar Scam Away Junior 🎮",
    "scanner.analyzing": "Menganalisis dengan Model AI...",
    "scanner.text_paste": "Terangkan insiden",
    "scanner.assistant_desc": "Penganalisis bukti pelbagai format & panduan keselamatan",
    "scanner.assistant_desc_kid": "Perlindungan bijak & menyeronokkan daripada scam tebus game, top-up palsu & perangkap dalam talian!",
    "scanner.switch_regular": "👵 Tukar ke Mod Biasa",
    "scanner.switch_elderly": "👵 Tukar ke Mod Warga Emas",

    // Results
    "result.high_risk": "Risiko Tinggi Dikesan",
    "result.safe": "Kelihatan Selamat",
    "result.caution": "Berhati-hati Nasihat",
    "result.flags": "Amaran:",
    "result.submit_db": "Hantar ke Pangkalan Data Global",
    "result.risk_score": "Indeks Risiko",
    "result.evidence_breakdown": "Kenapa ini penting? Pecahan Bukti:",
    "result.no_critical_evidence": "Tiada tekanan kejuruteraan sosial kritikal, akaun senarai hitam, atau pautan lencongan berbahaya dikesan.",
    "result.safety_guidance": "Panduan Keselamatan Disyorkan:",
    "result.report_scam_btn": "Lapor Scam & Maklum Komuniti",
    "result.scan_another_btn": "Imbas Kandungan Lain",
    "result.weight": "Pemberat isyarat",

    // Guardian
    "guardian.settings": "Tetapan Penjaga",

    "guardian.settings_desc":
      "Urus maklumat penjaga yang dipercayai untuk perlindungan kecemasan.",

    "guardian.create": "Tambah Penjaga",

    "guardian.edit": "Kemas Kini Penjaga",

    "guardian.create_desc":
      "Tambah penjaga yang dipercayai untuk kecemasan.",

    "guardian.edit_desc":
      "Kemas kini maklumat penjaga anda.",

    "guardian.add": "Tambah Penjaga",

    "guardian.update": "Kemas Kini Penjaga",

    "guardian.name": "Nama Penjaga",

    "guardian.name_placeholder":
      "Masukkan nama penjaga",

    "guardian.relationship": "Hubungan",

    "guardian.select_relationship":
      "Pilih hubungan",

    "guardian.phone": "Nombor Telefon",

    "guardian.phone_placeholder":
      "Masukkan nombor telefon",

    "guardian.relationships.Father": "Bapa",
    "guardian.relationships.Mother": "Ibu",
    "guardian.relationships.Son": "Anak Lelaki",
    "guardian.relationships.Daughter": "Anak Perempuan",
    "guardian.relationships.Sibling": "Adik-beradik",
    "guardian.relationships.Relative": "Saudara",
    "guardian.relationships.Caregiver": "Penjaga",
    "guardian.relationships.Other": "Lain-lain",

    "guardian.errors.name_required":
      "Nama penjaga diperlukan.",

    "guardian.errors.relationship_required":
      "Sila pilih hubungan.",

    "guardian.errors.phone_required":
      "Nombor telefon diperlukan.",

    "guardian.errors.phone_invalid":
      "Sila masukkan nombor telefon yang sah.",

    "guardian.alert.title": "Perlindungan Penjaga Diaktifkan",

    "guardian.alert.description":
      "Keselamatan anda adalah keutamaan kami.",

    "guardian.alert.high_risk": "Scam Berisiko Tinggi Dikesan",

    "guardian.alert.high_risk_desc":
      "AI kami telah mengenal pasti kandungan ini sebagai scam berisiko tinggi. Penjaga berdaftar anda telah dimaklumkan untuk membantu memastikan keselamatan anda.",

    "guardian.alert.status": "Status Penjaga",

    "guardian.alert.sent": "Pemberitahuan Berjaya Dihantar",

    "guardian.alert.sent_to": "Pemberitahuan dihantar kepada",

    "guardian.alert.stop":
      "Sila hentikan semua interaksi dengan kandungan ini dengan segera.",

    "guardian.alert.return": "Kembali ke Laman Utama",
    
    "guardian.alert.high_risk_desc":
      "AI kami telah mengenal pasti kandungan ini sebagai scam berisiko tinggi. Penjaga berdaftar anda telah dimaklumkan untuk membantu memastikan keselamatan anda.",

    // Profile
    "profile.title": "Laporan & Penjejakan Saya",
    "profile.status": "Status",
    "profile.pending": "Menunggu Semakan",
    "profile.confirmed": "Disahkan Scam",
    "profile.rejected": "Ditolak",
    "profile.update_notice": "Kemas kini pada laporan anda!",
    "profile.update_desc": "Laporan anda mengenai scam {category} telah disemak oleh moderator.",
    "profile.table_date": "Tarikh",
    "profile.table_category": "Kategori",
    "profile.table_content": "Petikan Kandungan",
    "profile.no_reports": "Tiada laporan dihantar lagi.",

    // Knowledge Centre
    "knowledge.quiz_title": "Cabaran 15-Soalan Harian",
    "knowledge.quiz_start": "Mula Cabaran",
    "knowledge.quiz_desc": "Uji kemahiran mengesan scam anda! Dapatkan rentetan untuk membuka lencana keselamatan.",
    "knowledge.quiz_header": "Kesan Scam! Kuiz Kesedaran",
    "knowledge.question_count": "Soalan {current} daripada {total}",
    "knowledge.streak": "Rentetan",
    "knowledge.library_title": "Perpustakaan Risikan Corak Scam Malaysia",
    "knowledge.library_desc": "Terokai tandatangan scam Malaysia dunia sebenar, perangkap psikologi, dan nasihat rasmi secara komprehensif.",
    "knowledge.category": "Kategori",
    "knowledge.scam_explanation": "Penjelasan Scam",
    "knowledge.read_case_study": "Baca Kajian Kes Penuh & Amaran",
    "knowledge.evidence_sample": "Contoh Bukti Teks/SMS Sebenar",
    "knowledge.red_flags": "Tanda Amaran (Red Flags) Dikenalpasti",
    "knowledge.psychology": "Strategi Psikologi Digunakan Scammer",
    "knowledge.advisory": "Nasihat Pencegahan & Pengesahan",
    "knowledge.quiz_scam_btn": "🔴 Ia Scam / Phishing",
    "knowledge.quiz_safe_btn": "🟢 Ia Sah / Selamat",
    "knowledge.correct_decision": "Keputusan Tepat!",
    "knowledge.incorrect_decision": "Keputusan Salah!",
    "knowledge.next_question": "Soalan Seterusnya",
    "knowledge.next_correction": "Baik, pembetulan seterusnya",
    "knowledge.correction_phase": "Fasa Pembetulan: {count} baki",
    "knowledge.challenge_completed": "Cabaran Selesai!",
    "knowledge.score_msg": "Anda mendapat",
    "knowledge.score_msg2": "dengan betul pada percubaan pertama.",
    "knowledge.out_of": "daripada",
    "knowledge.longest_streak": "Rentetan Terpanjang",
    "knowledge.final_rank": "Pangkat Akhir",
    "knowledge.play_another": "Main Pusingan Lain",
    "knowledge.exit_challenge": "Keluar Cabaran",
    "knowledge.ready_challenge": "Sedia untuk Cabaran Harian?",
    "knowledge.challenge_intro": "Uji kepakaran anda menentang taktik penipuan terbaru. Bolehkah anda mengekalkan rentetan kemenangan anda?",
    "knowledge.start_challenge": "Mula Cabaran",
    "knowledge.example_message": "Contoh Mesej / SMS:",
    "knowledge.show_more": "Tunjukkan Lebih Banyak",
    "knowledge.show_less": "Tunjukkan Kurang",

    // Categories
    "category.all": "Semua",
    "category.courier": "Kurier & Penghantaran",
    "category.job": "Scam Pekerjaan & Tugasan",
    "category.threat": "Ancaman & Penyamaran Kerajaan",
    "category.investment": "Pelaburan Mustahil",
    "category.emergency": "Kecemasan & Rahsia",
    "category.qr": "Quishing / Kod QR",

    // Report Modal
    "report.submitted": "Laporan Dihantar",
    "report.thank_you": "Terima kasih! Laporan kini ditambahkan ke giliran untuk pengesahan moderator. Sumbangan komuniti anda membantu menjadikan kampus kita lebih selamat.",
    "report.community_eyebrow": "Perlindungan komuniti",
    "report.title": "Hantar Laporan Komuniti",
    "report.desc": "Laporan anda akan mengemas kini penunjuk dan papan pemuka kampus tempatan setelah diluluskan. Semua butiran yang boleh dikenal pasti secara peribadi disembunyikan secara automatik.",
    "report.message_label": "Mesej atau bukti scam",
    "report.message_placeholder": "Tampal mesej, pautan, nombor telefon, atau permintaan bayaran yang mencurigakan di sini...",
    "report.message_help": "Anda boleh mengedit teks pengimbas sebelum menghantar. Nombor sensitif disembunyikan dalam salinan yang dikongsi.",
    "report.message_required": "Sila masukkan mesej yang mencurigakan sebelum menghantar.",
    "report.close": "Tutup borang laporan",
    "report.category": "Kategori Scam",
    "report.cat_phishing": "Phishing / Pautan Mencurigakan",
    "report.cat_parcel": "Scam Kurier / Bungkusan",
    "report.cat_job": "Tawaran Kerja Separuh Masa",
    "report.cat_emergency": "Penyamaran kecemasan keluarga",
    "report.cat_marketplace": "Perdagangan luar platform / Scam Marketplace",
    "report.cat_finance": "Akaun Bank Keldai / Umpan Kewangan",
    "report.redacted_preview": "Pratonton Bukti Disunting",
    "report.show_masked": "Tunjuk Disembunyikan",
    "report.show_original": "Tunjuk Asal",
    "report.verified_filters": "* Penapis pangkalan data yang disahkan memadankan penunjuk sambil mengekalkan kerahsiaan anda.",
    "report.consent": "Saya bersetuju untuk memuat naik bukti tanpa nama ini. Saya mengesahkan bahawa ini mewakili kandungan yang mencurigakan atau tidak diminta.",
    "report.cancel": "Batal",
    "report.submit_btn": "Hantar Laporan",

    // Scanner Extras
    "scanner.step_ocr": "Mengekstrak teks & pengecaman aksara (OCR)...",
    "scanner.step_parse": "Menghurai URL & menyemak destinasi kod QR...",
    "scanner.step_match": "Memadankan nombor telefon dan penunjuk akaun bank...",
    "scanner.step_db": "Menyemak pangkalan data reputasi komuniti...",
    "scanner.step_score": "Mengira skor risiko hibrid...",
    "scanner.alert_badge": "Amaran Komuniti",
    "scanner.alert_title": "Nasihat Ancaman Aktif",
    "scanner.demo_select": "Pilih Kes Demo (Mensimulasikan Muat Naik Foto & OCR):",
    "scanner.demo_courier": "📦 Scam Kurier/Bungkusan",
    "scanner.demo_job": "💼 Kerja Sambilan Shopee",
    "scanner.demo_emergency": "🚨 Kecemasan Keluarga Segera",
    "scanner.demo_legit": "✅ Nasihat TNB Sah",
    "scanner.upload_title": "Muat Naik Tangkapan Skrin / Imej",
    "scanner.upload_desc": "PNG, JPG atau WebP. Teks akan diekstrak serta-merta menggunakan simulasi OCR klien.",
    "scanner.loaded": "Dimuatkan:",
    "scanner.clear": "Kosongkan",
    "scanner.open_camera": "Buka Pengimbas Kamera",
    "scanner.paste_qr": "Atau Tampal URL Sasaran Mentah QR",
    "scanner.qr_placeholder": "cth., https://pos-laju.info/pay-fee/2.50",
    "scanner.verify_qr": "Sahkan Kod URL",
    "scanner.url_label": "URL / Alamat Web",
    "scanner.phone_label": "Nombor Telefon Penghantar (Pilihan)",
    "scanner.searching": "Mencari pangkalan data...",
    "scanner.scan_url_btn": "Imbas URL & Kenalan",
    "scanner.empty_url_error": "Sila masukkan alamat laman web.",
    "scanner.invalid_url_detailed_error": "URL tidak sah. Sila masukkan alamat laman web yang sah. Contoh: https://example.com",
    "scanner.security_check": "Pemeriksaan Keselamatan Berjalan",
    "scanner.stop_readout": "Hentikan Bacaan",
    "scanner.read_aloud": "Baca Kuat",
    "scanner.url_placeholder": "cth. maybank-secure-login.xyz atau pos-laju.info",
    "scanner.phone_placeholder": "cth. +6011-8762512",
    "scanner.ocr_failed": "Gagal mengekstrak teks. Sila taip secara manual.",
    
    // App Footer & Roles
    "app.role_user": "👤 Pengguna",
    "app.role_admin": "👮 Admin",
    "app.footer_title": "Scam Away — Platform Keselamatan Digital Boleh Diterangkan",
    "app.footer_desc": "Disediakan untuk Pertandingan Inovasi UCRIX 2026. Sejajar dengan Matlamat Pembangunan Mampan PBB (SDG 16, 9, 10, 4).",

    // Knowledge Centre Extras
    "knowledge.search_placeholder": "Cari perpustakaan scam mengikut kata kunci...",
    "knowledge.highlight": "★ Sorotan",
    "knowledge.close_case": "Tutup Kajian Kes",
    "knowledge.rank_1": "Pakar Keselamatan Digital",
    "knowledge.rank_2": "Pembela Berwaspada",
    "knowledge.rank_3": "Warganegara Sedar",
    "knowledge.rank_4": "Pelajar Baru",

    // Engine
    "engine.speech_done": "Penilaian risiko selesai. Keputusannya adalah {band} dengan skor risiko sebanyak {score} peratus.",
    "engine.speech_low": "Tiada penunjuk scam kuat dikesan. Walau bagaimanapun, sila sahkan secara bebas.",
    "engine.speech_caution": "Berhati-hati. Elemen mencurigakan ditemui. Sila berhenti sebentar dan sahkan.",
    "engine.speech_high": "Amaran. Elemen berisiko tinggi dikesan. Jangan bayar atau kongsi kelayakan.",
    "engine.speech_intro": "Berikut ialah tindakan keselamatan yang disyorkan.",

    // General
    "common.close": "Tutup",
    "common.loading": "Sedang memproses...",

    // Statuses
    "status.unverified": "Belum Disahkan",
    "status.under_review": "Dalam Semakan",
    "status.confirmed": "Disahkan",
    "status.rejected": "Ditolak"
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  const t = (key) => {
    return translations[lang][key] || key;
  };

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'ms' : 'en'));
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
