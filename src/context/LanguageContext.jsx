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
    
    // Scanner
    "scanner.title": "Scan Suspicious Context",
    "scanner.placeholder": "Paste suspicious text message, email, or context here...",
    "scanner.button": "Analyze Risk",
    "scanner.upload_btn": "Upload Screenshot (OCR)",
    "scanner.qr_btn": "Scan QR Code",
    "scanner.url_btn": "URL & Phone Check",
    "scanner.text_paste": "Paste the copied text",
    "scanner.assistant": "ScamShield Assistant",
    "scanner.assistant_desc": "Multi-format evidence analyzer & safety guide",
    "scanner.switch_regular": "👵 Switch to Regular Mode",
    "scanner.switch_elderly": "👵 Switch to Elderly Mode",
    
    // Results
    "result.high_risk": "High Risk Detected",
    "result.safe": "Appears Safe",
    "result.caution": "Caution Advised",
    "result.flags": "Red Flags:",
    "result.submit_db": "Submit to Global Database",
    "result.risk_score": "Risk Score",
    "result.evidence_breakdown": "Why does this matter? Evidence Breakdown:",
    "result.no_critical_evidence": "No critical social-engineering pressure, blacklisted accounts, or malicious redirect URLs were extracted.",
    "result.safety_guidance": "Recommended Safety Guidance:",
    "result.report_scam_btn": "Report Scam & Alert Community",
    "result.scan_another_btn": "Scan Another Content",
    "result.weight": "Weight",
    
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
    "knowledge.quiz_title": "Daily 12-Question Challenge",
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
    
    // Categories
    "category.all": "All",
    "category.courier": "Courier & Delivery",
    "category.job": "Job & Task Scams",
    "category.threat": "Threat & Govt Impersonation",
    "category.investment": "Impossible Investment",
    "category.emergency": "Emergency & Secrecy",
    "category.qr": "Quishing / QR Code",
    
    // General
    "common.close": "Close",
    "common.loading": "Processing..."
  },
  ms: {
    // Navigation
    "nav.scanner": "Pengimbas",
    "nav.knowledge": "Pusat Ilmu",
    "nav.profile": "Profil Saya",
    "nav.elderly": "Mod Warga Emas",
    "nav.submit_report": "Hantar Laporan",
    "nav.moderator": "Moderasi Admin",
    
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

    // Scanner
    "scanner.title": "Imbas Konteks Mencurigakan",
    "scanner.placeholder": "Tampal mesej teks, e-mel, atau konteks mencurigakan di sini...",
    "scanner.button": "Analisis Risiko",
    "scanner.upload_btn": "Muat Naik Tangkapan Skrin (OCR)",
    "scanner.qr_btn": "Imbas Kod QR",
    "scanner.url_btn": "Semak URL & Telefon",
    "scanner.text_paste": "Tampal teks yang disalin",
    "scanner.assistant": "Pembantu ScamShield",
    "scanner.assistant_desc": "Penganalisis bukti pelbagai format & panduan keselamatan",
    "scanner.switch_regular": "👵 Tukar ke Mod Biasa",
    "scanner.switch_elderly": "👵 Tukar ke Mod Warga Emas",
    
    // Results
    "result.high_risk": "Risiko Tinggi Dikesan",
    "result.safe": "Kelihatan Selamat",
    "result.caution": "Berhati-hati Nasihat",
    "result.flags": "Amaran:",
    "result.submit_db": "Hantar ke Pangkalan Data Global",
    "result.risk_score": "Skor Risiko",
    "result.evidence_breakdown": "Kenapa ini penting? Pecahan Bukti:",
    "result.no_critical_evidence": "Tiada tekanan kejuruteraan sosial kritikal, akaun senarai hitam, atau pautan lencongan berbahaya dikesan.",
    "result.safety_guidance": "Panduan Keselamatan Disyorkan:",
    "result.report_scam_btn": "Lapor Scam & Maklum Komuniti",
    "result.scan_another_btn": "Imbas Kandungan Lain",
    "result.weight": "Pemberat",
    
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
    "knowledge.quiz_title": "Cabaran 12-Soalan Harian",
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
    
    // Categories
    "category.all": "Semua",
    "category.courier": "Kurier & Penghantaran",
    "category.job": "Scam Pekerjaan & Tugasan",
    "category.threat": "Ancaman & Penyamaran Kerajaan",
    "category.investment": "Pelaburan Mustahil",
    "category.emergency": "Kecemasan & Rahsia",
    "category.qr": "Quishing / Kod QR",
    
    // General
    "common.close": "Tutup",
    "common.loading": "Sedang memproses..."
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
