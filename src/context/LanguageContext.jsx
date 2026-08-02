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
    "nav.trends": "Community Alerts",

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
    "trends.title": "Community Scam Alerts",
    "trends.alert_title": "Community Scam Alert",
    "trends.hero_eyebrow": "Most Reported Scam Today",
    "trends.alert_top_suffix": "is currently the most frequently reported scam by the ScamShield community.",
    "trends.guidance_parcel": "Be cautious of fake courier SMS asking for delivery fees.",
    "trends.guidance_banking": "Never reveal your OTP or banking credentials.",
    "trends.guidance_investment": "Beware of guaranteed profit schemes.",
    "trends.guidance_job": "Never pay upfront fees for employment opportunities.",
    "trends.guidance_government": "Verify all calls claiming to be from government agencies.",
    "trends.guidance_emergency": "Cross-check emergency claims directly with family before sending money.",
    "trends.guidance_marketplace": "Avoid making bank transfers outside trusted platform checkout.",
    "trends.guidance_default": "Stay cautious before clicking unknown links or transferring funds.",
    "trends.last_updated": "Last Updated:",

    "trends.lesson_header": "Today's Scam Lesson",
    "trends.lesson_subtitle": "⏱️ 1-minute Scam Lesson",
    "trends.lesson_target_label": "Who is Targeted?",
    "trends.lesson_how_label": "How it Works",
    "trends.lesson_warning_label": "Warning Signs",
    "trends.lesson_stay_safe_label": "Stay Safe",
    "trends.lesson_did_you_know": "Did You Know?",

    "trends.safety_title": "How to Stay Safe",
    "trends.safety_tip1_title": "Never click suspicious links.",
    "trends.safety_tip1_desc": "Always inspect URLs before opening them.",
    "trends.safety_tip2_title": "Verify unknown phone numbers.",
    "trends.safety_tip2_desc": "Cross-check callers claiming to represent banks, courier services or government agencies.",
    "trends.safety_tip3_title": "Never share OTP or TAC codes.",
    "trends.safety_tip3_desc": "Official organisations will never request your verification codes.",
    "trends.safety_tip4_title": "Scan suspicious content.",
    "trends.safety_tip4_desc": "Use ScamShield Scanner to verify URLs, messages and QR codes before taking action.",

    "trends.info_title": "Community Insights",
    "trends.info_content": "These charts are based on scam reports submitted by ScamShield users. They help you understand the most common scam types and identify emerging scam trends within the community.",

    "trends.summary_title": "Quick Scam Summary",
    "trends.card_most_active": "Most Active Scam",
    "trends.card_most_active_suffix": "is currently the most frequently reported scam by the ScamShield community.",
    "trends.card_target": "Main Target",
    "trends.card_method": "Typical Scam Method",
    "trends.card_trend": "Current Trend",

    // Target descriptions
    "trends.target_parcel": "People expecting parcel deliveries.",
    "trends.target_marketplace": "Online buyers and sellers.",
    "trends.target_banking": "Bank account holders.",
    "trends.target_investment": "People looking for investment opportunities.",
    "trends.target_job": "Job seekers.",
    "trends.target_government": "Members of the public contacted by fake authorities.",
    "trends.target_default": "General public using mobile services.",

    // Method descriptions
    "trends.method_parcel": "Victims receive fake courier SMS containing payment links.",
    "trends.method_marketplace": "Victims are persuaded to make direct bank transfers outside trusted platforms.",
    "trends.method_banking": "Victims are tricked into revealing OTP or banking credentials.",
    "trends.method_investment": "Victims are promised guaranteed high profits for fake investment plans.",
    "trends.method_job": "Victims are asked to pay advance fees or deposits to start simple online tasks.",
    "trends.method_government": "Victims are threatened with legal action or arrest unless they transfer funds.",
    "trends.method_default": "Victims are tricked into opening malicious links or transferring money.",

    "trends.chart_category": "Most Reported Scam Categories",
    "trends.chart_category_sub": "These are the scam categories reported most frequently by the ScamShield community.",

    "trends.operate_title": "How Scammers Operate",
    
    // Operate steps - Marketplace
    "trends.operate_market_step1": "1. The scammer contacts the victim through an online marketplace.",
    "trends.operate_market_step2": "2. The victim is encouraged to continue the conversation outside the platform.",
    "trends.operate_market_step3": "3. The scammer requests payment through direct bank transfer.",
    "trends.operate_market_step4": "4. After receiving the payment, the scammer disappears.",

    // Operate steps - Parcel
    "trends.operate_parcel_step1": "1. A fake courier SMS is sent.",
    "trends.operate_parcel_step2": "2. The victim clicks a fake payment link.",
    "trends.operate_parcel_step3": "3. Personal or banking information is collected.",
    "trends.operate_parcel_step4": "4. The victim loses money or account access.",

    // Operate steps - Banking
    "trends.operate_banking_step1": "1. The scammer impersonates a bank officer.",
    "trends.operate_banking_step2": "2. The victim is informed of an urgent banking issue.",
    "trends.operate_banking_step3": "3. OTP or banking credentials are requested.",
    "trends.operate_banking_step4": "4. The scammer gains access to the victim's account.",

    // Operate steps - Job
    "trends.operate_job_step1": "1. A high-paying work-from-home offer is advertised.",
    "trends.operate_job_step2": "2. The victim completes initial simple tasks to build trust.",
    "trends.operate_job_step3": "3. The scammer requests an advance deposit to unlock higher earnings.",
    "trends.operate_job_step4": "4. The deposit is stolen and withdrawal requests are blocked.",

    // Operate steps - Investment
    "trends.operate_invest_step1": "1. An exclusive investment scheme with guaranteed returns is promoted.",
    "trends.operate_invest_step2": "2. The victim is shown fake profit dashboards.",
    "trends.operate_invest_step3": "3. Additional funds are requested to release profits.",
    "trends.operate_invest_step4": "4. The platform closes and funds cannot be recovered.",

    // Operate steps - Government
    "trends.operate_gov_step1": "1. The scammer calls impersonating police, LHDN, or court officials.",
    "trends.operate_gov_step2": "2. The victim is accused of involvement in a crime or tax debt.",
    "trends.operate_gov_step3": "3. The scammer instructs the victim to transfer money to safe accounts.",
    "trends.operate_gov_step4": "4. The victim's funds are stolen without any receipt.",

    // Operate steps - Default
    "trends.operate_default_step1": "1. The scammer initiates contact via SMS, call, or social media.",
    "trends.operate_default_step2": "2. Urgency or high reward is used to manipulate the victim.",
    "trends.operate_default_step3": "3. The victim is asked to click a link or transfer funds.",
    "trends.operate_default_step4": "4. The scammer cuts off contact once money or data is taken.",

    "trends.chart_timeline_title": "Scam Activity",
    "trends.chart_timeline_sub": "This chart shows how scam reports have changed over recent days.",
    "trends.trend_increased": "📈 Scam reports increased recently.",
    "trends.trend_decreased": "📉 Scam reports decreased recently.",
    "trends.trend_stable": "📊 Scam activity remains stable.",
    "trends.sparse_notice": "Community data is still growing. Trends become more meaningful as more scam reports are submitted.",
    "trends.no_data": "No report data available to display trends.",

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
    "mode.kid": "🎮 Kid / Teenager",

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

    // Emergency Help Feature
    "emergency.btn_label": "Emergency Help",
    "emergency.modal_title": "🆘 Emergency Help",
    "emergency.modal_subtitle": "What happened? Select the situation that best matches your problem.",
    "emergency.back": "← Back to Options",
    "emergency.close": "Close",

    // Options
    "emergency.opt_money": "💸 I Sent Money to a Scammer",
    "emergency.opt_otp": "🔑 I Shared My OTP",
    "emergency.opt_link": "🌐 I Clicked a Suspicious Link",
    "emergency.opt_apk": "📲 I Installed a Suspicious App (APK)",
    "emergency.opt_call": "📱 I Received a Scam Call",
    "emergency.opt_msg": "💬 I Received a Suspicious Message",
    "emergency.opt_banks": "🏦 Contact My Bank",
    "emergency.opt_contacts": "☎️ Emergency Contacts",

    // Checklist Header
    "emergency.prep_title": "📋 Prepare Before Contacting Authorities",
    "emergency.prep_desc": "Before contacting your bank or making a police report, prepare:",
    "emergency.prep_item_tx": "Transaction reference number",
    "emergency.prep_item_date": "Date and time of incident",
    "emergency.prep_item_phone": "Scam phone number or caller ID",
    "emergency.prep_item_url": "Scam website link or URL",
    "emergency.prep_item_screens": "Screenshots of conversation/receipts",
    "emergency.prep_item_account": "Bank account number (if applicable)",
    "emergency.prep_item_device": "Device model and OS version",
    "emergency.prep_item_appname": "Name of the suspicious application (if known)",

    // Agency Descriptions
    "emergency.agency_nsrc_desc": "Primary national contact for victims of online financial scams. Contact NSRC immediately if you have transferred money to a scammer.",
    "emergency.agency_mcmc_desc": "Report suspicious websites, scam messages, fake online advertisements, or communication-related scams.",
    "emergency.agency_mycert_desc": "Assists with cybersecurity incidents, malicious websites, phishing attacks, malware infections, hacked accounts, and other computer security incidents.",
    "emergency.agency_notice": "If you believe you have become a victim of a scam, contact the appropriate authority immediately. Acting quickly can improve the chances of limiting financial losses.",

    // Guidance Titles & Explanations
    "emergency.guide_money_title": "💸 Money Transferred to a Scammer",
    "emergency.guide_money_desc": "Take immediate action to stop further loss and report the transaction.",
    "emergency.guide_money_step1": "1. Call NSRC at 997 immediately (operating 8am - 8pm daily) to request a fund freeze across banks.",
    "emergency.guide_money_step2": "2. Call your bank's 24/7 fraud hotline to suspend your online banking access and freeze affected accounts.",
    "emergency.guide_money_step3": "3. Lodge an official police report at the nearest PDRM station as soon as possible.",

    "emergency.guide_otp_title": "🔑 Shared OTP or TAC Verification Code",
    "emergency.guide_otp_desc": "Your online banking or app account may be accessed by unauthorised parties.",
    "emergency.guide_otp_step1": "1. Immediately log into your bank app and change your online banking password.",
    "emergency.guide_otp_step2": "2. Contact your bank hotline to suspend online banking and revoke active sessions.",
    "emergency.guide_otp_step3": "3. Check your account statement for unauthorised pending transfers.",

    "emergency.guide_link_title": "🌐 Clicked a Suspicious Link",
    "emergency.guide_link_desc": "Suspicious links may attempt to steal credentials or download malware.",
    "emergency.guide_link_step1": "1. Immediately disconnect Wi-Fi and mobile data on your device.",
    "emergency.guide_link_step2": "2. Do not type any passwords, credit card numbers, or banking credentials.",
    "emergency.guide_link_step3": "3. Clear your browser history and cache, then run an antivirus scan.",

    "emergency.guide_apk_title": "📲 Installed a Suspicious App (APK)",
    "emergency.guide_apk_desc": "Malicious APK files can steal SMS messages, OTPs, and banking credentials.",
    "emergency.guide_apk_step1": "1. Disconnect your device from Wi-Fi and mobile data immediately.",
    "emergency.guide_apk_step2": "2. Do not open any banking, e-wallet, or financial applications.",
    "emergency.guide_apk_step3": "3. Uninstall the suspicious application from device settings if safe to do so.",
    "emergency.guide_apk_step4": "4. Change important passwords from another trusted, secure device.",
    "emergency.guide_apk_step5": "5. Contact your bank immediately if you entered banking credentials or suspect account compromise.",

    "emergency.guide_call_title": "📱 Received a Scam Call",
    "emergency.guide_call_desc": "Scammers impersonate bank officers, police, or courier agents over phone calls.",
    "emergency.guide_call_step1": "1. Hang up immediately. Do not call back the number.",
    "emergency.guide_call_step2": "2. Never transfer money or reveal TAC/OTP codes over a phone call.",
    "emergency.guide_call_step3": "3. Verify suspicious caller claims directly with official organization hotlines.",

    "emergency.guide_msg_title": "💬 Received a Suspicious Message",
    "emergency.guide_msg_desc": "Phishing SMS or messaging apps often contain fake delivery or payment prompts.",
    "emergency.guide_msg_step1": "1. Do not click any links or download attached files/APKs.",
    "emergency.guide_msg_step2": "2. Block the sender number on your phone.",
    "emergency.guide_msg_step3": "3. Copy the URL or message content to analyze on ScamShield Scanner.",

    // Bank Directory View
    "emergency.bank_title": "🏦 Contact My Bank",
    "emergency.bank_subtitle": "Visit your bank's official emergency or fraud support page to obtain the latest hotline numbers and reporting procedures.",
    "emergency.bank_card_desc": "Fraud & Customer Support",
    "emergency.bank_visit_btn": "Visit Official Support Page ↗",
    "emergency.bank_notice": "Always contact your bank immediately if you suspect your banking credentials or account has been compromised. Use the official hotline or official support page below for the latest assistance.",

    // Buttons & Notices
    "emergency.action_call": "Call Hotline",
    "emergency.action_visit": "Visit Official Website ↗",
    "emergency.disclaimer_title": "Emergency Guidance",
    "emergency.disclaimer_text": "These recommendations are provided to help users respond quickly to potential scam incidents. Always follow the instructions provided by your bank and the relevant Malaysian authorities.",

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
    "nav.trends": "Amaran Komuniti",

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
    "trends.title": "Amaran Scam Komuniti",
    "trends.alert_title": "Amaran Scam Komuniti",
    "trends.hero_eyebrow": "Scam Paling Banyak Dilaporkan Hari Ini",
    "trends.alert_top_suffix": "merupakan penipuan yang paling kerap dilaporkan oleh komuniti ScamShield pada masa ini.",
    "trends.guidance_parcel": "Berwaspada dengan SMS kurier palsu yang meminta bayaran penghantaran.",
    "trends.guidance_banking": "Jangan sekali-kali mendedahkan OTP atau maklumat perbankan anda.",
    "trends.guidance_investment": "Berwaspada dengan skim pulangan terjamin.",
    "trends.guidance_job": "Jangan bayar yuran pendahuluan untuk peluang pekerjaan.",
    "trends.guidance_government": "Sahkan semua panggilan yang mendakwa daripada agensi kerajaan.",
    "trends.guidance_emergency": "Semak semula dakwaan kecemasan secara terus dengan keluarga sebelum memindahkan wang.",
    "trends.guidance_marketplace": "Elakkan pemindahan bank di luar pembayaran platform yang dipercayai.",
    "trends.guidance_default": "Kekal berwaspada sebelum menekan pautan tidak dikenali atau memindahkan dana.",
    "trends.last_updated": "Kemas Kini Terakhir:",

    "trends.lesson_header": "Pengajaran Scam Hari Ini",
    "trends.lesson_subtitle": "⏱️ Pelajaran Scam 1 Minit",
    "trends.lesson_target_label": "Siapa Yang Disasar?",
    "trends.lesson_how_label": "Bagaimana Ia Beroperasi",
    "trends.lesson_warning_label": "Tanda-Tanda Amaran",
    "trends.lesson_stay_safe_label": "Kekal Selamat",
    "trends.lesson_did_you_know": "Tahukah Anda?",

    "trends.safety_title": "Cara-cara Kekal Selamat",
    "trends.safety_tip1_title": "Jangan klik pautan mencurigakan.",
    "trends.safety_tip1_desc": "Sentiasa semak URL sebelum membukanya.",
    "trends.safety_tip2_title": "Sahkan nombor telefon tidak dikenali.",
    "trends.safety_tip2_desc": "Semak semula pemanggil yang mendakwa daripada bank, perkhidmatan kurier atau agensi kerajaan.",
    "trends.safety_tip3_title": "Jangan kongsi kod OTP atau TAC.",
    "trends.safety_tip3_desc": "Organisasi rasmi tidak akan sekali-kali meminta kod pengesahan anda.",
    "trends.safety_tip4_title": "Imbas kandungan mencurigakan.",
    "trends.safety_tip4_desc": "Gunakan Pengimbas ScamShield untuk menyemak URL, mesej dan kod QR sebelum mengambil tindakan.",

    "trends.info_title": "Wawasan Komuniti",
    "trends.info_content": "Carta ini berdasarkan laporan scam yang dihantar oleh pengguna ScamShield. Ia membantu anda memahami jenis scam yang paling kerap berlaku serta mengenal pasti trend scam yang sedang meningkat dalam komuniti.",

    "trends.summary_title": "Ringkasan Ringkas Scam",
    "trends.card_most_active": "Scam Paling Aktif",
    "trends.card_most_active_suffix": "merupakan penipuan yang paling kerap dilaporkan oleh komuniti ScamShield pada masa ini.",
    "trends.card_target": "Sasaran Utama",
    "trends.card_method": "Kaedah Penipuan Biasa",
    "trends.card_trend": "Trend Semasa",

    // Target descriptions
    "trends.target_parcel": "Orang yang menunggu penghantaran bungkusan.",
    "trends.target_marketplace": "Pembeli dan penjual dalam talian.",
    "trends.target_banking": "Pemegang akaun bank.",
    "trends.target_investment": "Individu yang mencari peluang pelaburan.",
    "trends.target_job": "Pencari kerja.",
    "trends.target_government": "Orang awam yang dihubungi oleh pihak berkuasa palsu.",
    "trends.target_default": "Orang awam yang menggunakan perkhidmatan mudah alih.",

    // Method descriptions
    "trends.method_parcel": "Mangsa menerima SMS kurier palsu yang mengandungi pautan bayaran.",
    "trends.method_marketplace": "Mangsa dipujuk untuk membuat pemindahan bank secara terus di luar platform dipercayai.",
    "trends.method_banking": "Mangsa ditipu untuk mendedahkan OTP atau maklumat perbankan.",
    "trends.method_investment": "Mangsa dijanjikan pulangan tinggi terjamin untuk pelan pelaburan palsu.",
    "trends.method_job": "Mangsa diminta membayar yuran pendahuluan atau deposit untuk memulakan tugasan.",
    "trends.method_government": "Mangsa diancam dengan tindakan undang-undang atau tangkapan kecuali memindahkan dana.",
    "trends.method_default": "Mangsa ditipu untuk membuka pautan berbahaya atau memindahkan wang.",

    "trends.chart_category": "Kategori Scam Paling Banyak Dilaporkan",
    "trends.chart_category_sub": "Ini merupakan kategori penipuan yang paling kerap dilaporkan oleh komuniti ScamShield.",

    "trends.operate_title": "Bagaimana Penipu Beroperasi",
    
    // Operate steps - Marketplace
    "trends.operate_market_step1": "1. Penipu menghubungi mangsa melalui pasaran dalam talian.",
    "trends.operate_market_step2": "2. Mangsa digalakkan meneruskan perbualan di luar platform.",
    "trends.operate_market_step3": "3. Penipu meminta bayaran melalui pemindahan bank terus.",
    "trends.operate_market_step4": "4. Selepas menerima bayaran, penipu hilang.",

    // Operate steps - Parcel
    "trends.operate_parcel_step1": "1. SMS kurier palsu dihantar.",
    "trends.operate_parcel_step2": "2. Mangsa menekan pautan bayaran palsu.",
    "trends.operate_parcel_step3": "3. Maklumat peribadi atau perbankan dikumpul.",
    "trends.operate_parcel_step4": "4. Mangsa kehilangan wang atau akses akaun.",

    // Operate steps - Banking
    "trends.operate_banking_step1": "1. Penipu menyamar sebagai pegawai bank.",
    "trends.operate_banking_step2": "2. Mangsa dimaklumkan mengenai isu perbankan mendesak.",
    "trends.operate_banking_step3": "3. OTP atau maklumat perbankan diminta.",
    "trends.operate_banking_step4": "4. Penipu mendapat akses ke akaun mangsa.",

    // Operate steps - Job
    "trends.operate_job_step1": "1. Tawaran kerja dari rumah bergaji tinggi diiklankan.",
    "trends.operate_job_step2": "2. Mangsa menyiapkan tugasan mudah awal untuk membina kepercayaan.",
    "trends.operate_job_step3": "3. Penipu meminta deposit pendahuluan untuk membuka ganjaran lebih tinggi.",
    "trends.operate_job_step4": "4. Deposit dicuri dan permintaan pengeluaran disekat.",

    // Operate steps - Investment
    "trends.operate_invest_step1": "1. Skim pelaburan eksklusif dengan pulangan terjamin dipromosikan.",
    "trends.operate_invest_step2": "2. Mangsa ditunjukkan papan pemuka keuntungan palsu.",
    "trends.operate_invest_step3": "3. Dana tambahan diminta untuk mengeluarkan keuntungan.",
    "trends.operate_invest_step4": "4. Platform ditutup dan dana tidak dapat dipulihkan.",

    // Operate steps - Government
    "trends.operate_gov_step1": "1. Penipu menelefon menyamar sebagai polis, LHDN, atau mahkamah.",
    "trends.operate_gov_step2": "2. Mangsa dituduh terlibat dalam jenayah atau tunggakan cukai.",
    "trends.operate_gov_step3": "3. Penipu mengarahkan mangsa memindahkan wang ke akaun selamat.",
    "trends.operate_gov_step4": "4. Dana mangsa dicuri tanpa sebarang resit.",

    // Operate steps - Default
    "trends.operate_default_step1": "1. Penipu memulakan hubungan melalui SMS, panggilan, atau media sosial.",
    "trends.operate_default_step2": "2. Desakan atau ganjaran tinggi digunakan untuk memanipulasi mangsa.",
    "trends.operate_default_step3": "3. Mangsa diminta menekan pautan atau memindahkan dana.",
    "trends.operate_default_step4": "4. Penipu memutuskan hubungan sebaik sahaja wang atau data diambil.",

    "trends.chart_timeline_title": "Aktiviti Penipuan",
    "trends.chart_timeline_sub": "Carta ini menunjukkan bagaimana laporan penipuan telah berubah sejak beberapa hari lalu.",
    "trends.trend_increased": "📈 Laporan penipuan meningkat baru-baru ini.",
    "trends.trend_decreased": "📉 Laporan penipuan menurun baru-baru ini.",
    "trends.trend_stable": "📊 Aktiviti penipuan kekal stabil.",
    "trends.sparse_notice": "Data komuniti masih berkembang. Trend menjadi lebih bermakna apabila lebih banyak laporan penipuan diserahkan.",
    "trends.no_data": "Tiada data laporan tersedia untuk memaparkan trend.",

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

    // Emergency Help Feature
    "emergency.btn_label": "Bantuan Kecemasan",
    "emergency.modal_title": "🆘 Bantuan Kecemasan",
    "emergency.modal_subtitle": "Apa yang berlaku? Pilih situasi yang paling bertepatan dengan masalah anda.",
    "emergency.back": "← Kembali ke Pilihan",
    "emergency.close": "Tutup",

    // Options
    "emergency.opt_money": "💸 Saya Telah Memindahkan Wang kepada Penipu",
    "emergency.opt_otp": "🔑 Saya Telah Berkongsi OTP",
    "emergency.opt_link": "🌐 Saya Telah Menekan Pautan Mencurigakan",
    "emergency.opt_apk": "📲 Saya Telah Memasang Apl Mencurigakan (APK)",
    "emergency.opt_call": "📱 Saya Telah Menerima Panggilan Scam",
    "emergency.opt_msg": "💬 Saya Telah Menerima Mesej Mencurigakan",
    "emergency.opt_banks": "🏦 Hubungi Bank Saya",
    "emergency.opt_contacts": "☎️ Talian Kecemasan",

    // Checklist Header
    "emergency.prep_title": "📋 Sediakan Sebelum Menghubungi Pihak Berkuasa",
    "emergency.prep_desc": "Sebelum menghubungi bank anda atau membuat laporan polis, sediakan:",
    "emergency.prep_item_tx": "Nombor rujukan transaksi",
    "emergency.prep_item_date": "Tarikh dan masa kejadian",
    "emergency.prep_item_phone": "Nombor telefon penipu atau ID pemanggil",
    "emergency.prep_item_url": "Pautan laman web atau URL penipuan",
    "emergency.prep_item_screens": "Tangkapan skrin perbualan/resit",
    "emergency.prep_item_account": "Nombor akaun bank (jika berkenaan)",
    "emergency.prep_item_device": "Model peranti dan versi OS",
    "emergency.prep_item_appname": "Nama aplikasi mencurigakan (jika diketahui)",

    // Agency Descriptions
    "emergency.agency_nsrc_desc": "Saluran utama kebangsaan untuk mangsa penipuan kewangan dalam talian. Hubungi NSRC dengan segera jika anda telah memindahkan wang kepada penipu.",
    "emergency.agency_mcmc_desc": "Laporkan laman web mencurigakan, mesej penipuan, iklan palsu dalam talian atau penipuan berkaitan komunikasi.",
    "emergency.agency_mycert_desc": "Membantu dalam insiden keselamatan siber seperti laman web berbahaya, serangan phishing, jangkitan malware, akaun digodam dan insiden keselamatan komputer yang lain.",
    "emergency.agency_notice": "Jika anda percaya telah menjadi mangsa penipuan, hubungi pihak berkuasa yang berkaitan dengan segera. Tindakan pantas boleh membantu mengurangkan kerugian kewangan.",

    // Guidance Titles & Explanations
    "emergency.guide_money_title": "💸 Wang Dipindahkan kepada Penipu",
    "emergency.guide_money_desc": "Ambil tindakan serta-merta untuk menghentikan kerugian selanjutnya dan melaporkan transaksi.",
    "emergency.guide_money_step1": "1. Hubungi NSRC di talian 997 serta-merta (beroperasi 8 pagi - 8 malam harian) untuk memohon pembekuan dana di semua bank.",
    "emergency.guide_money_step2": "2. Hubungi hotline penipuan 24/7 bank anda untuk menggantung akses perbankan dalam talian dan membekukan akaun terjejas.",
    "emergency.guide_money_step3": "3. Buat laporan polis rasmi di balai PDRM terdekat secepat mungkin.",

    "emergency.guide_otp_title": "🔑 Berkongsi Kod Pengesahan OTP atau TAC",
    "emergency.guide_otp_desc": "Akaun perbankan atau aplikasi dalam talian anda mungkin diakses oleh pihak yang tidak dibenarkan.",
    "emergency.guide_otp_step1": "1. Log masuk ke aplikasi bank anda serta-merta dan tukar kata laluan perbankan dalam talian anda.",
    "emergency.guide_otp_step2": "2. Hubungi hotline bank anda untuk menggantung perbankan dalam talian dan membatalkan sesi aktif.",
    "emergency.guide_otp_step3": "3. Semak penyata akaun anda untuk pemindahan tergantung yang tidak dibenarkan.",

    "emergency.guide_link_title": "🌐 Menekan Pautan Mencurigakan",
    "emergency.guide_link_desc": "Pautan mencurigakan mungkin cuba mencuri maklumat log masuk atau memuat turun perisian berbahaya.",
    "emergency.guide_link_step1": "1. Putuskan sambungan Wi-Fi dan data mudah alih pada peranti anda serta-merta.",
    "emergency.guide_link_step2": "2. Jangan taip sebarang kata laluan, nombor kad kredit, atau maklumat perbankan.",
    "emergency.guide_link_step3": "3. Padamkan sejarah dan tembolok penyemak imbas anda, kemudian jalankan imbasan antivirus.",

    "emergency.guide_apk_title": "📲 Memasang Apl Mencurigakan (APK)",
    "emergency.guide_apk_desc": "Fail APK berbahaya boleh mencuri mesej SMS, OTP, dan maklumat perbankan anda.",
    "emergency.guide_apk_step1": "1. Putuskan sambungan peranti anda daripada Wi-Fi dan data mudah alih serta-merta.",
    "emergency.guide_apk_step2": "2. Jangan buka sebarang aplikasi perbankan, e-dompet, atau kewangan.",
    "emergency.guide_apk_step3": "3. Nyahpasang aplikasi mencurigakan daripada tetapan peranti jika selamat untuk berbuat demikian.",
    "emergency.guide_apk_step4": "4. Tukar kata laluan penting daripada peranti lain yang selamat dan dipercayai.",
    "emergency.guide_apk_step5": "5. Hubungi bank anda serta-merta jika anda telah memasukkan maklumat perbankan atau mengesyaki akaun anda terjejas.",

    "emergency.guide_call_title": "📱 Menerima Panggilan Scam",
    "emergency.guide_call_desc": "Penipu menyamar sebagai pegawai bank, polis, atau ejen kurier melalui panggilan telefon.",
    "emergency.guide_call_step1": "1. Tamatkan panggilan serta-merta. Jangan telefon semula nombor tersebut.",
    "emergency.guide_call_step2": "2. Jangan sekali-kali memindahkan wang atau mendedahkan kod TAC/OTP melalui panggilan telefon.",
    "emergency.guide_call_step3": "3. Sahkan dakwaan pemanggil mencurigakan secara terus dengan hotline rasmi organisasi.",

    "emergency.guide_msg_title": "💬 Menerima Mesej Mencurigakan",
    "emergency.guide_msg_desc": "SMS pancingan data atau aplikasi mesej kerap mengandungi gesaan penghantaran atau bayaran palsu.",
    "emergency.guide_msg_step1": "1. Jangan klik sebarang pautan atau muat turun fail/APK yang disertakan.",
    "emergency.guide_msg_step2": "2. Sekat nombor penghantar pada telefon anda.",
    "emergency.guide_msg_step3": "3. Salin pautan URL atau kandungan mesej untuk diimbas pada Pengimbas ScamShield.",

    // Bank Directory View
    "emergency.bank_title": "🏦 Hubungi Bank Saya",
    "emergency.bank_subtitle": "Lawati halaman sokongan kecemasan atau penipuan rasmi bank anda untuk mendapatkan nombor hotline dan tatacara pelaporan terkini.",
    "emergency.bank_card_desc": "Sokongan Penipuan & Khidmat Pelanggan",
    "emergency.bank_visit_btn": "Lawati Halaman Sokongan Rasmi ↗",
    "emergency.bank_notice": "Hubungi bank anda dengan segera jika anda mengesyaki maklumat perbankan atau akaun anda telah terjejas. Gunakan talian rasmi atau laman sokongan rasmi di bawah untuk mendapatkan bantuan terkini.",

    // Buttons & Notices
    "emergency.action_call": "Panggil Hotline",
    "emergency.action_visit": "Lawati Laman Web Rasmi ↗",
    "emergency.disclaimer_title": "Panduan Kecemasan",
    "emergency.disclaimer_text": "Saranan ini disediakan untuk membantu pengguna bertindak pantas menangani insiden penipuan. Sentiasa ikuti arahan yang diberikan oleh bank anda dan pihak berkuasa Malaysia yang berkaitan.",

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
