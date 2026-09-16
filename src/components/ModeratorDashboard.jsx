import React, { useState, useEffect } from 'react';
import { Shield, Check, X, UserCheck, ShieldAlert, FileText, CheckCircle, XCircle, Search, Filter, Clock, ShieldCheck, Mail, Send, Activity, User, BookOpen, BarChart2, Edit2, Trash2, Save, GitMerge, Split, CornerDownRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../utils/translateText';
import {
  extractIndicators,
  normalizeBankAccount,
  normalizeHostname,
  normalizePhone,
} from '../utils/rulesEngine';
import { getGroupedCases } from '../utils/caseGrouping';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SCAM_CATEGORIES, getCategoryLabel } from '../config/categories';

export default function ModeratorDashboard({ onNavigate }) {
  const {
    reportsList, updateReportStatus, addAlert,
    addBlacklistItem, blacklist,
    removeBlacklistItem, updateBlacklistItem, auditLogs,
    adminProfile,
    unmergeReportAction, reassignReportAction, mergeCasesAction
  } = useAppContext();
  const { t, lang } = useLanguage();
  const [selectedReport, setSelectedReport] = useState(null);
  const [alertCategory, setAlertCategory] = useState('');
  const [alertDetails, setAlertDetails] = useState('');
  const [alertSolution, setAlertSolution] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [showConfirmBroadcast, setShowConfirmBroadcast] = useState(false);
  const [rationale, setRationale] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // New features state
  const [activeSubTab, setActiveSubTab] = useState('queue'); // queue, blacklist, audit
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);
  const [isAuditExpanded, setIsAuditExpanded] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedForBulk, setSelectedForBulk] = useState(new Set());
  const [expandedClusters, setExpandedClusters] = useState(new Set());

  // Case Grouping Correction state
  const [reassignModalReport, setReassignModalReport] = useState(null);
  const [mergeModalCase, setMergeModalCase] = useState(null);
  const [targetCaseIdSelection, setTargetCaseIdSelection] = useState('');
  const [caseActionFeedback, setCaseActionFeedback] = useState(null);

  const handleUnmerge = async (reportId) => {
    await unmergeReportAction(reportId);
    setCaseActionFeedback({
      type: 'success',
      message: lang === 'ms' ? 'Laporan berjaya diasingkan ke dalam kes PENDING baharu.' : 'Report successfully unmerged into a new PENDING case.'
    });
    setTimeout(() => setCaseActionFeedback(null), 4000);
  };

  const handleReassign = async () => {
    if (!reassignModalReport || !targetCaseIdSelection) return;
    await reassignReportAction(reassignModalReport.id, targetCaseIdSelection);
    setCaseActionFeedback({
      type: 'success',
      message: lang === 'ms' ? 'Laporan berjaya ditugaskan semula ke kes sasaran.' : 'Report successfully reassigned to destination case.'
    });
    setReassignModalReport(null);
    setTargetCaseIdSelection('');
    setTimeout(() => setCaseActionFeedback(null), 4000);
  };

  const handleMerge = async () => {
    if (!mergeModalCase || !targetCaseIdSelection) return;
    await mergeCasesAction(targetCaseIdSelection, mergeModalCase.caseId);
    setCaseActionFeedback({
      type: 'success',
      message: lang === 'ms' ? 'Kes berjaya digabungkan.' : 'Cases successfully merged.'
    });
    setMergeModalCase(null);
    setTargetCaseIdSelection('');
    setTimeout(() => setCaseActionFeedback(null), 4000);
  };

  // Audit Sub-tab Search, Action Type & Time Range Filter state
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditTimeFilter, setAuditTimeFilter] = useState('7days'); // '7days' or 'all'

  // Blacklist Management State
  const [newBlacklistItem, setNewBlacklistItem] = useState('');
  const [newBlacklistType, setNewBlacklistType] = useState('urls');
  const [editingItem, setEditingItem] = useState(null); // { type, oldValue }
  const [editValue, setEditValue] = useState('');
  const [blacklistFeedback, setBlacklistFeedback] = useState(null);

  // Helper for audit action translation/formatting
  const formatAuditAction = (action = '', currentLang = 'en') => {
    if (!action) return '';

    if (currentLang !== 'ms') {
      let act = action;
      act = act.replace(/Case Status Updated to confirmed/i, 'Case Status Updated to Confirmed');
      act = act.replace(/Case Status Updated to rejected/i, 'Case Status Updated to Rejected');
      act = act.replace(/Case Status Updated to dismissed/i, 'Case Status Updated to Dismissed');
      act = act.replace(/Case Status Updated to archived/i, 'Case Status Updated to Archived');
      act = act.replace(/Case Status Updated to under_review/i, 'Case Status Updated to Under Review');
      act = act.replace(/Case Status Updated to unverified/i, 'Case Status Updated to Unverified');
      act = act.replace(/Added to Blacklist \(bankAccounts\)/i, 'Added to Blacklist (Bank Accounts)');
      act = act.replace(/Added to Blacklist \(phoneNumbers\)/i, 'Added to Blacklist (Phone Numbers)');
      act = act.replace(/Added to Blacklist \(urls\)/i, 'Added to Blacklist (Domain / URL)');
      act = act.replace(/Removed from Blacklist \(bankAccounts\)/i, 'Removed from Blacklist (Bank Accounts)');
      act = act.replace(/Removed from Blacklist \(phoneNumbers\)/i, 'Removed from Blacklist (Phone Numbers)');
      act = act.replace(/Removed from Blacklist \(urls\)/i, 'Removed from Blacklist (Domain / URL)');
      act = act.replace(/Updated Blacklist Item \(bankAccounts\)/i, 'Updated Blacklist Item (Bank Accounts)');
      act = act.replace(/Updated Blacklist Item \(phoneNumbers\)/i, 'Updated Blacklist Item (Phone Numbers)');
      act = act.replace(/Updated Blacklist Item \(urls\)/i, 'Updated Blacklist Item (Domain / URL)');
      return act;
    }

    // Bahasa Melayu translations
    let act = action;

    // 1. Status Update actions
    if (/Case Status Updated/i.test(act)) {
      const statusPart = act
        .replace(/^Case Status Updated\s*(to\s*)?/i, '')
        .trim()
        .toLowerCase();

      let translatedStatus = statusPart;
      if (statusPart === 'archived') {
        translatedStatus = 'Diarkibkan';
      } else if (statusPart === 'confirmed') {
        translatedStatus = 'Disahkan';
      } else if (statusPart === 'rejected' || statusPart === 'dismissed') {
        translatedStatus = 'Ditolak';
      } else if (statusPart === 'under_review' || statusPart === 'under review') {
        translatedStatus = 'Dalam Semakan';
      } else if (statusPart === 'unverified' || statusPart === 'pending') {
        translatedStatus = 'Belum Disahkan';
      }

      return `Status Laporan Ditukar kepada ${translatedStatus}`;
    }

    // 2. Merge / Unmerge / Reassign actions
    if (/Admin Merged Cases/i.test(act)) {
      return 'Pentadbir Menggabungkan Kes';
    }
    if (/Admin Unmerged Report/i.test(act)) {
      return act.replace(/Admin Unmerged Report/i, 'Pentadbir Mengasingkan Laporan');
    }
    if (/Admin Reassigned Report/i.test(act)) {
      return act.replace(/Admin Reassigned Report/i, 'Pentadbir Menugaskan Semula Laporan');
    }

    // 3. Broadcast Alert actions
    if (/Broadcast Threat Alert Published/i.test(act)) {
      return 'Makluman Ancaman Diterbitkan';
    }

    // 4. Blacklist actions
    if (/Added to Blacklist/i.test(act)) {
      return act
        .replace(/Added to Blacklist/i, 'Ditambah ke Senarai Hitam')
        .replace(/\(bankAccounts\)/i, '(Akaun Bank)')
        .replace(/\(phoneNumbers\)/i, '(Nombor Telefon)')
        .replace(/\(urls\)/i, '(Domain / URL)');
    }
    if (/Removed from Blacklist/i.test(act)) {
      return act
        .replace(/Removed from Blacklist/i, 'Dikeluarkan dari Senarai Hitam')
        .replace(/\(bankAccounts\)/i, '(Akaun Bank)')
        .replace(/\(phoneNumbers\)/i, '(Nombor Telefon)')
        .replace(/\(urls\)/i, '(Domain / URL)');
    }
    if (/Updated Blacklist Item/i.test(act)) {
      return act
        .replace(/Updated Blacklist Item/i, 'Dikemas Kini Item Senarai Hitam')
        .replace(/\(bankAccounts\)/i, '(Akaun Bank)')
        .replace(/\(phoneNumbers\)/i, '(Nombor Telefon)')
        .replace(/\(urls\)/i, '(Domain / URL)');
    }

    return act;
  };

  // Helper for audit rationale / note translation
  const formatAuditNote = (note = '', currentLang = 'en') => {
    if (!note || note === 'N/A') return 'N/A';
    if (currentLang !== 'ms') return note;

    let txt = note;

    // Exact string matches
    const exactTranslations = {
      'Verified scam. Added to blacklist.': 'Penipuan disahkan. Ditambah ke senarai hitam.',
      'Scam disahkan. Tambah ke senarai hitam.': 'Penipuan disahkan. Ditambah ke senarai hitam.',
      'Job & Employment Scam': 'Penipuan Pekerjaan',
      'Legitimate/safe message.': 'Mesej sah/selamat.',
      'Insufficient evidence provided.': 'Bukti yang diberikan tidak mencukupi.',
      'Duplicate report.': 'Laporan ulangan',
      'No harm at all': 'Tiada kemudaratan sama sekali',
      'Parcel & Delivery Scam': 'Penipuan Bungkusan & Penghantaran',
      'Family Emergency & Impersonation Scam': 'Penipuan Kecemasan Keluarga & Penyamaran',
      'Bank & Financial Impersonation Scam': 'Penipuan Bank & Penyamaran Kewangan',
      'Online Shopping & E-Commerce Scam': 'Penipuan Membeli-belah Dalam Talian & E-Dagang',
      'Phishing & Account Takeover Scam': 'Penipuan Phishing & Pengambilalihan Akaun',
      'Investment & Quick Profit Scam': 'Penipuan Pelaburan & Keuntungan Pantas',
      'Matches CCID police records.': 'Sepadan dengan rekod polis (CCID).',
      'Requires secondary manual review.': 'Perlu semakan manual sekunder.'
    };

    if (exactTranslations[txt.trim()]) {
      return exactTranslations[txt.trim()];
    }

    // Pattern & phrase replacements
    txt = txt.replace(/Verified scam\.?\s*Added to blacklist\.?/gi, 'Penipuan disahkan. Ditambah ke senarai hitam.');
    txt = txt.replace(/Job & Employment Scam/gi, 'Penipuan Pekerjaan');
    txt = txt.replace(/Legitimate\/safe message\.?/gi, 'Mesej sah/selamat.');
    txt = txt.replace(/Insufficient evidence provided\.?/gi, 'Bukti yang diberikan tidak mencukupi.');
    txt = txt.replace(/Duplicate report\.?/gi, 'Laporan ulangan');
    txt = txt.replace(/No harm at all/gi, 'Tiada kemudaratan sama sekali');
    txt = txt.replace(/Parcel & Delivery Scam/gi, 'Penipuan Bungkusan & Penghantaran');
    txt = txt.replace(/Family Emergency & Impersonation Scam/gi, 'Penipuan Kecemasan Keluarga & Penyamaran');
    txt = txt.replace(/Bank & Financial Impersonation Scam/gi, 'Penipuan Bank & Penyamaran Kewangan');

    txt = txt.replace(/Merged Case (\S+) \((\d+) reports?\) into Case (\S+)/g, 'Menggabungkan Kes $1 ($2 laporan) ke dalam Kes $3');
    txt = txt.replace(/Detached from Case (\S+) into new Pending Case (\S+)/g, 'Dikeluarkan dari Kes $1 ke dalam Kes Menunggu baharu $2');
    txt = txt.replace(/Moved from Case (\S+) to Case (\S+)/g, 'Dipindahkan dari Kes $1 ke Kes $2');
    txt = txt.replace(/^Value:\s*/i, 'Nilai: ');
    txt = txt.replace(/^From:\s*(.*)\s*->\s*To:\s*(.*)/i, 'Dari: $1 -> Ke: $2');
    txt = txt.replace(/Bulk cleared by admin/i, 'Dibersihkan secara pukal oleh pentadbir');

    return txt;
  };

  // Helper for audit categorization
  const getAuditCategory = (action = '') => {
    const act = (action || '').toLowerCase();
    if (act.includes('blacklist')) return 'Blacklist Changes';
    if (act.includes('alert') || act.includes('broadcast') || act.includes('threat')) return 'Threat Alerts';
    return 'Status Updates';
  };

  // PART 1: Access Guard Check
  if (!adminProfile) {
    return (
      <div className="page-shell moderator-page">
        <div className="glass-panel" style={{
          padding: '3rem 2rem',
          maxWidth: '520px',
          margin: '3rem auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          background: 'rgba(15, 23, 42, 0.95)',
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.15)',
          borderRadius: '16px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <ShieldAlert size={36} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            {t('admin.access_denied') || 'Access Denied'}
          </h2>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {lang === 'ms'
              ? 'Papan pemuka ini terhad kepada pegawai polis dan pentadbir yang berkuasa sahaja. Sila log masuk dengan akaun pentadbir untuk mengakses halaman ini.'
              : 'This dashboard is restricted to authorised police and admin officers. Please log in with an administrative account to access this page.'}
          </p>

          <button
            onClick={() => {
              if (typeof onNavigate === 'function') {
                onNavigate('check');
              } else {
                try { localStorage.setItem('scam_shield_active_tab', 'check'); } catch {}
                window.location.reload();
              }
            }}
            className="btn-primary"
            style={{ marginTop: '0.5rem', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Shield size={18} />
            {lang === 'ms' ? 'Kembali ke Halaman Utama' : 'Return to Main Page'}
          </button>
        </div>
      </div>
    );
  }


  // Dynamic placeholder for blacklist input
  const getBlacklistPlaceholder = () => {
    const example = lang === 'ms' ? 'cth.' : 'e.g.';

    if (newBlacklistType === 'urls')
      return `${example} scam-site.com`;

    if (newBlacklistType === 'phoneNumbers')
      return `${example} 012-3456789`;

    if (newBlacklistType === 'bankAccounts')
      return `${example} 15874269019`;

    return `${example} scam-site.com`;
  };

  const handleAction = (id, decision) => {
    updateReportStatus(id, decision, rationale);

    // in the Blacklists tab so legitimate company details are not poisoned.

    setSelectedReport(null);
    setRationale('');
  };

  const handleBulkClear = () => {
    selectedForBulk.forEach(id => {
      updateReportStatus(id, 'archived', 'Bulk cleared by admin');
    });
    setSelectedForBulk(new Set());
  };

  const handlePublishAlert = (e) => {
    e.preventDefault();
    if (!alertCategory.trim() || !alertDetails.trim() || !alertSolution.trim()) return;
    setShowConfirmBroadcast(true);
  };


// Helper for normalized scam pattern / concept classification
function getScamConceptPattern(report = {}) {
  const text = `${report.text || ''} ${report.description || ''} ${report.title || ''} ${report.category || ''}`.toLowerCase();
  
  // 1. Parcel / Delivery COD Payment Scam
  if (
    /(?:parcel|package|delivery|bungkusan|pos\s*laju|poslaju|ninja\s*van|j&t|courier|cod|cash-on-delivery)/i.test(text) &&
    /(?:fee|pay|payment|transfer|bayar|clearance|release|held|hold|customs|kastam|tertahan|gagal)/i.test(text)
  ) {
    return 'parcel_delivery_payment';
  }

  // 2. Bank Account Suspension / Phishing Verification Scam
  if (
    /(?:bank|banking|online\s*banking|account|akaun|maybank|cimb|rhb|public\s*bank|tac|otp)/i.test(text) &&
    /(?:suspend|risk|verify|confirm|update|locked|blocked|gantung|sekat|sahkan|kemaskini|log\s*in)/i.test(text)
  ) {
    return 'bank_account_verification';
  }

  // 3. Government / Tax Refund Scam
  if (
    /(?:lhdn|tax|cukai|government|kerajaan|refund|pemulangan|hasil|kwsp|epf)/i.test(text) &&
    /(?:refund|pay|processing|fee|pemulangan|bayar|yuran)/i.test(text)
  ) {
    return 'government_refund_payment';
  }

  // 4. Job Offer / Task Advance Fee Scam
  if (
    /(?:job|work|hiring|kerja|jawatan|recruiter|task|tugasan|wfh|part-time|like\s*video|tiktok|shopee\s*agent)/i.test(text) &&
    /(?:fee|deposit|commission|komisen|pay|bayar|starter|yuran|unlock|aktifkan)/i.test(text)
  ) {
    return 'job_offer_fee';
  }

  // 5. Investment / High Return Scam
  if (
    /(?:investment|pelaburan|crypto|trading|forex|bursa|profit|untung|guaranteed|pulangan)/i.test(text) &&
    /(?:return|profit|guaranteed|untung|dijamin|deposit|capital|modal)/i.test(text)
  ) {
    return 'investment_return_scam';
  }

  // 6. Police / Authority Impersonation Scam
  if (
    /(?:police|polis|pdrm|court|mahkamah|warrant|waran|arrest|tangkap|lhdn|kastam|sprm|investigation)/i.test(text) &&
    /(?:fine|jail|denda|penjara|transfer|safe\s*account|akaun\s*selamat|bail|jaminan|cuci\s*wang)/i.test(text)
  ) {
    return 'police_impersonation_scam';
  }

  // 7. Family / Friend Emergency Scam
  if (
    /(?:mom|dad|mak|ayah|ibu|bapa|son|daughter|anak|hospital|accident|kemalangan|kidnap|culik|phone\s*broken)/i.test(text) &&
    /(?:money|transfer|wang|duit|pindah|hospital|emergency|kecemasan)/i.test(text)
  ) {
    return 'family_emergency_scam';
  }

  return null;
}

function areReportsRelated(reportA, reportB) {
  if (!reportA || !reportB || reportA.id === reportB.id) return false;

  // 1. Explicit reportCode or linkedToReportCode link
  const codeA = (reportA.reportCode || `#${reportA.id}`).toString().toLowerCase();
  const codeB = (reportB.reportCode || `#${reportB.id}`).toString().toLowerCase();

  if (reportA.linkedToReportCode && (reportA.linkedToReportCode.toLowerCase() === codeB || reportA.linkedToReportCode.toLowerCase() === (reportB.reportCode || '').toLowerCase())) {
    return true;
  }
  if (reportB.linkedToReportCode && (reportB.linkedToReportCode.toLowerCase() === codeA || reportB.linkedToReportCode.toLowerCase() === (reportA.reportCode || '').toLowerCase())) {
    return true;
  }

  // 2. Exact Indicator Matches (Ignoring empty / null values!)
  const indA = extractIndicators(`${reportA.text || ''} ${reportA.phone || ''} ${reportA.bankAccount || ''}`);
  const indB = extractIndicators(`${reportB.text || ''} ${reportB.phone || ''} ${reportB.bankAccount || ''}`);

  if (reportA.phone) {
    const pA = normalizePhone(reportA.phone);
    if (pA && !indA.normalizedPhones.includes(pA)) indA.normalizedPhones.push(pA);
  }
  if (reportB.phone) {
    const pB = normalizePhone(reportB.phone);
    if (pB && !indB.normalizedPhones.includes(pB)) indB.normalizedPhones.push(pB);
  }
  if (reportA.bankAccount) {
    const bA = normalizeBankAccount(reportA.bankAccount);
    if (bA && !indA.bankAccounts.includes(bA)) indA.bankAccounts.push(bA);
  }
  if (reportB.bankAccount) {
    const bB = normalizeBankAccount(reportB.bankAccount);
    if (bB && !indB.bankAccounts.includes(bB)) indB.bankAccounts.push(bB);
  }

  // Check matching phones (ignoring empty)
  const sharedPhones = indA.normalizedPhones.filter(p => Boolean(p) && indB.normalizedPhones.includes(p));
  if (sharedPhones.length > 0) return true;

  // Check matching bank accounts (ignoring empty)
  const sharedBanks = indA.bankAccounts.filter(b => Boolean(b) && indB.bankAccounts.includes(b));
  if (sharedBanks.length > 0) return true;

  // 3. Scam Concept / Pattern Semantic Matching
  const conceptA = getScamConceptPattern(reportA);
  const conceptB = getScamConceptPattern(reportB);

  if (conceptA && conceptB && conceptA === conceptB) {
    return true;
  }

  return false;
}

  const confirmBroadcast = async () => {
    let catEn = alertCategory;
    let catMs = alertCategory;
    let detEn = alertDetails;
    let detMs = alertDetails;
    let solEn = alertSolution;
    let solMs = alertSolution;

    if (lang === 'ms') {
      catEn = await translateText(alertCategory, 'ms', 'en');
      detEn = await translateText(alertDetails, 'ms', 'en');
      solEn = await translateText(alertSolution, 'ms', 'en');
    } else {
      catMs = await translateText(alertCategory, 'en', 'ms');
      detMs = await translateText(alertDetails, 'en', 'ms');
      solMs = await translateText(alertSolution, 'en', 'ms');
    }

    const timestamp = new Date().toISOString();

    addAlert({
      id: Date.now(),
      category: catEn,
      category_ms: catMs,
      details: detEn,
      details_ms: detMs,
      solution: solEn,
      solution_ms: solMs,
      timestamp: timestamp,
      type: 'rich'
    });

    setAlertCategory('');
    setAlertDetails('');
    setAlertSolution('');
    setShowConfirmBroadcast(false);
    setAlertSuccess(true);
    setTimeout(() => setAlertSuccess(false), 3000);
  };

  // Find cluster size and reports for a case based on exact indicators & semantic pattern matching
  const getClusterReports = (report) => {
    if (!report || !reportsList) return [];
    return reportsList.filter(r => r.id === report.id || areReportsRelated(report, r));
  };

  const getDuplicateReportsCount = (report) => {
    return getClusterReports(report).length;
  };

  const toggleClusterExpand = (reportId, e) => {
    if (e) e.stopPropagation();
    setExpandedClusters(prev => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const availableCategories = Array.from(
    new Set([
      ...SCAM_CATEGORIES.map(c => c.id),
      ...reportsList.map(r => (r.category || r.type || '').toLowerCase()).filter(Boolean)
    ])
  );

  // Group flat reports into aggregate Cases for case-centric moderation
  const allGroupedCases = getGroupedCases(reportsList);

  const filteredCases = allGroupedCases
    .filter(c => c.status !== 'archived')
    .filter(c => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'pending') return c.status === 'unverified' || c.status === 'under_review';
      return c.status === filterStatus;
    })
    .filter(c => {
      if (filterCategory === 'all') return true;
      return (c.category || '').toLowerCase() === filterCategory.toLowerCase();
    })
    .filter(c => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const code = (c.caseCode || '').toLowerCase();
      const id = (c.caseId || '').toLowerCase();
      const cat = (c.category || '').toLowerCase();
      const anyTextMatches = c.reports.some(r =>
        (r.text || '').toLowerCase().includes(q) ||
        (r.reportCode || '').toLowerCase().includes(q) ||
        (r.reporterId || '').toLowerCase().includes(q)
      );
      return code.includes(q) || id.includes(q) || cat.includes(q) || anyTextMatches;
    });

  const filteredReports = filteredCases.map(c => c.rootReport);

  const handleAddManualBlacklist = async (e) => {
    e.preventDefault();
    if (!newBlacklistItem.trim()) return;
    const normalizers = {
      urls: normalizeHostname,
      phoneNumbers: normalizePhone,
      bankAccounts: normalizeBankAccount,
    };
    const normFn = normalizers[newBlacklistType] || ((v) => v);
    const rawVal = newBlacklistItem.trim();
    const normalizedValue = normFn(rawVal);
    if (!normalizedValue) return;

    const res = await addBlacklistItem(newBlacklistType, normalizedValue);
    if (res?.duplicate) {
      setBlacklistFeedback({
        type: 'error',
        message: lang === 'ms'
          ? `Entri '${rawVal}' sudah wujud dalam senarai hitam.`
          : `Entry '${rawVal}' is already registered in the blacklist.`
      });
      return;
    }

    setBlacklistFeedback({
      type: 'success',
      message: lang === 'ms'
        ? `Berjaya menambah '${normalizedValue}' ke dalam senarai hitam.`
        : `Successfully added '${normalizedValue}' to the blacklist.`
    });
    setNewBlacklistItem('');
  };


  const renderBlacklistItem = (type, value) => {
    const isEditing = editingItem?.type === type && editingItem?.oldValue === value;

    if (isEditing) {
      return (
        <li key={value} style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--primary)' }}>
          <input
            type="text"
            className="input-field"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            style={{ flex: 1, padding: '0.25rem', fontSize: '0.85rem' }}
          />
          <button onClick={() => {
            if (editValue.trim() && editValue !== value) {
              updateBlacklistItem(type, value, editValue.trim());
            }
            setEditingItem(null);
          }} className="btn-primary" style={{ padding: '0.25rem 0.5rem' }} title="Save"><Save size={14} /></button>
          <button onClick={() => setEditingItem(null)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem' }} title="Cancel"><X size={14} /></button>
        </li>
      );
    }

    return (
      <li key={value} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ wordBreak: 'break-all' }}>{value}</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { setEditingItem({ type, oldValue: value }); setEditValue(value); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }} title="Edit"><Edit2 size={14} /></button>
          <button onClick={() => removeBlacklistItem(type, value)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: 0 }} title="Delete"><Trash2 size={14} /></button>
        </div>
      </li>
    );
  };

  // Audit trail search & action type filter logic (using authentic context audit logs)
  const rawAuditLogs = auditLogs || [];

  const filteredAuditLogs = rawAuditLogs.filter(log => {
    // 0. Exclude August audit logs completely (per user requirement)
    if (log.timestamp && (String(log.timestamp).startsWith('2026-08') || String(log.timestamp).includes('-08-'))) {
      return false;
    }

    // 1. Time Range Filter (Default: Last 7 Days; 'all' shows full historical archive)
    if (auditTimeFilter === '7days' && log.timestamp) {
      const logTime = new Date(log.timestamp).getTime();
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (logTime < cutoff) return false;
    }

    // 2. Action Type Filter
    const cat = getAuditCategory(log.action);
    if (auditActionFilter !== 'all' && cat !== auditActionFilter) {
      return false;
    }

    // 2. Search Query Filter (Officer ID, Officer Name, Report Code)
    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase().trim();
      const officerId = (log.officerId || log.performedBy || '').toLowerCase();
      const officerName = (log.officerName || log.performedByName || '').toLowerCase();

      let reportCode = (log.reportCode || '').toLowerCase();
      if (!reportCode && log.reportId) {
        const matchingReport = reportsList.find(r => r.id === log.reportId);
        reportCode = (matchingReport?.reportCode || `#${log.reportId.toString().slice(-6)}`).toLowerCase();
      }

      const rationale = (log.rationale || log.details || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const actionTranslated = formatAuditAction(log.action, lang).toLowerCase();
      const noteTranslated = formatAuditNote(log.rationale || log.details, lang).toLowerCase();
      const department = (log.department || '').toLowerCase();

      const isMatch = officerId.includes(q) ||
                      officerName.includes(q) ||
                      reportCode.includes(q) ||
                      rationale.includes(q) ||
                      action.includes(q) ||
                      actionTranslated.includes(q) ||
                      noteTranslated.includes(q) ||
                      department.includes(q);

      if (!isMatch) return false;
    }

    return true;
  });

  return (
    <div className="page-shell moderator-page">

      {/* Overview stats header */}
      <div className="admin-stats-grid">
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('admin.pending_queue')}</span>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>
            {reportsList.filter(r => r.status === 'unverified' || r.status === 'under_review').length} {t('admin.cases')}
          </h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-low)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('admin.confirmed_scams')}</span>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>
            {reportsList.filter(r => r.status === 'confirmed').length} {t('admin.items')}
          </h2>
        </div>
      </div>

      <div className="broadcast-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '-0.75rem' }}>

        {/* Top: Community Alert Publisher */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={24} color="var(--color-high)" />
            {t('admin.broadcast_title')}
          </h3>

          <form onSubmit={handlePublishAlert} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                {lang === 'ms' ? 'Kategori Scam' : 'Scam Category'}
              </label>
              <div
                className="input-field custom-select-container"
                style={{ position: 'relative', padding: 0, cursor: 'pointer', outline: 'none' }}
                tabIndex={0}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsCategoryOpen(false);
                  }
                }}
              >
                <div
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  style={{ padding: '0.85rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: alertCategory ? '#fff' : 'var(--text-secondary)' }}>
                    {alertCategory
                      ? (lang === 'ms'
                        ? {
                          'Banking & Phishing Scam': 'Scam Perbankan & Phishing',
                          'E-Commerce & Online Shopping Scam': 'Scam E-Dagang & Membeli-belah Dalam Talian',
                          'Job & Employment Scam': 'Scam Pekerjaan',
                          'Investment Scam': 'Scam Pelaburan',
                          'Parcel & Delivery Scam': 'Scam Bungkusan & Penghantaran',
                          'Emergency & Impersonation Scam': 'Scam Kecemasan & Penyamaran',
                          'Malware & Technical Support Scam': 'Scam Hasad & Sokongan Teknikal',
                          'General Scam Alert': 'Amaran Scam Umum'
                        }[alertCategory] || alertCategory
                        : alertCategory)
                      : (lang === 'ms' ? 'Pilih kategori scam...' : 'Select a scam category...')}
                  </span>
                  <span style={{ transform: isCategoryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: '0.7rem' }}>▼</span>
                </div>

                {isCategoryOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#0f172a',
                    border: '1px solid var(--primary)',
                    borderRadius: '8px',
                    marginTop: '4px',
                    zIndex: 50,
                    maxHeight: '250px',
                    overflowY: 'auto',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}>
                    {[
                      { val: 'Banking & Phishing Scam', ms: 'Scam Perbankan & Phishing' },
                      { val: 'E-Commerce & Online Shopping Scam', ms: 'Scam E-Dagang & Membeli-belah Dalam Talian' },
                      { val: 'Job & Employment Scam', ms: 'Scam Pekerjaan' },
                      { val: 'Investment Scam', ms: 'Scam Pelaburan' },
                      { val: 'Parcel & Delivery Scam', ms: 'Scam Bungkusan & Penghantaran' },
                      { val: 'Emergency & Impersonation Scam', ms: 'Scam Kecemasan & Penyamaran' },
                      { val: 'Malware & Technical Support Scam', ms: 'Scam Hasad & Sokongan Teknikal' },
                      { val: 'General Scam Alert', ms: 'Amaran Scam Umum' }
                    ].map(opt => (
                      <div
                        key={opt.val}
                        onClick={() => {
                          setAlertCategory(opt.val);
                          setIsCategoryOpen(false);
                        }}
                        style={{
                          padding: '0.75rem 1.2rem',
                          fontSize: '0.9rem',
                          color: '#fff',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          background: alertCategory === opt.val ? 'rgba(6, 182, 212, 0.1)' : 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = alertCategory === opt.val ? 'rgba(6, 182, 212, 0.1)' : 'transparent'}
                      >
                        {lang === 'ms' ? opt.ms : opt.val}
                      </div>
                    ))}
                  </div>
                )}
                {/* Hidden input to satisfy required field on form submit */}
                <input type="text" value={alertCategory} required onChange={() => { }} style={{ opacity: 0, height: 0, width: 0, position: 'absolute' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                {lang === 'ms' ? 'Butiran / Maklumat Tambahan' : 'Details / Extra Info'}
              </label>

              {/* Quick Broadcast Templates */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                {[
                  {
                    label: { en: "Pos Laju COD", ms: "COD Pos Laju" },
                    cat: "Parcel & Delivery Scam",
                    det: { en: "A wave of parcel cash-on-delivery (COD) SMS scams impersonating Pos Laju (pos-laju.info) has targeted the Selangor and Klang Valley regions.", ms: "Gelombang penipuan SMS bayaran semasa terima (COD) yang menyamar sebagai Pos Laju (pos-laju.info) sedang aktif di kawasan Selangor dan Lembah Klang." },
                    sol: { en: "Do not pay or open the link. Verify tracking numbers on the official Pos Laju website.", ms: "Jangan bayar atau buka pautan. Sahkan nombor penjejakan di laman web rasmi Pos Laju." }
                  },
                  {
                    label: { en: "LHDN Tax", ms: "Cukai LHDN" },
                    cat: "Banking & Phishing Scam",
                    det: { en: "Scammers are sending fake LHDN tax refund links via WhatsApp, asking victims to log into fake banking portals.", ms: "Scammer menghantar pautan pemulangan cukai LHDN palsu melalui WhatsApp dan meminta mangsa log masuk ke portal bank palsu." },
                    sol: { en: "LHDN will never send refund links via WhatsApp. Log in only via mytax.hasil.gov.my.", ms: "LHDN tidak akan menghantar pautan pemulangan melalui WhatsApp. Log masuk hanya melalui mytax.hasil.gov.my." }
                  },
                  {
                    label: { en: "Job Scam", ms: "Scam Kerja" },
                    cat: "Job & Employment Scam",
                    det: { en: "Fake HR agents are offering easy part-time jobs (e.g. liking YouTube videos) but require a deposit to unlock tasks.", ms: "Ejen HR palsu menawarkan kerja sambilan mudah (cth: like video YouTube) tetapi meminta deposit untuk memulakan tugasan." },
                    sol: { en: "Legitimate employers never ask you to pay a deposit or fee to start working.", ms: "Majikan yang sah tidak akan meminta deposit atau yuran untuk memulakan kerja." }
                  }
                ].map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      setAlertCategory(tmpl.cat);
                      setAlertDetails(lang === 'ms' ? tmpl.det.ms : tmpl.det.en);
                      setAlertSolution(lang === 'ms' ? tmpl.sol.ms : tmpl.sol.en);
                    }}
                    style={{
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: 'var(--primary)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.1)'; }}
                  >
                    ⚡ {lang === 'ms' ? tmpl.label.ms : tmpl.label.en}
                  </button>
                ))}
              </div>

              <textarea
                className="input-field"
                rows={2}
                value={alertDetails}
                onChange={(e) => setAlertDetails(e.target.value)}
                placeholder={lang === 'ms' ? 'cth. adalah scam yang paling kerap dilaporkan oleh komuniti Scam Away buat masa ini.' : 'e.g. is currently the most frequently reported scam by the Scam Away community.'}
                style={{ fontSize: '0.9rem' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                {lang === 'ms' ? 'Penyelesaian Utama' : 'Key Solution'}
              </label>
              <input
                type="text"
                className="input-field"
                value={alertSolution}
                onChange={(e) => setAlertSolution(e.target.value)}
                placeholder={lang === 'ms' ? 'cth. Jangan sesekali mendedahkan OTP atau bukti kelayakan perbankan anda.' : 'e.g. Never reveal your OTP or banking credentials.'}
                style={{ fontSize: '0.9rem' }}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Send size={14} /> {lang === 'ms' ? 'Terbitkan Amaran Ancaman' : 'Publish Threat Alert'}
            </button>
          </form>

          {alertSuccess && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-low)', textAlign: 'center' }}>
              ✓ {lang === 'ms' ? 'Amaran diterbitkan ke skrin paparan awam.' : 'Alert published to public view screens.'}
            </div>
          )}

          {showConfirmBroadcast && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-high)', borderRadius: '8px' }}>
              <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
                {lang === 'ms' ? 'Adakah anda pasti mahu menyiarkan amaran ini kepada semua pengguna?' : 'Are you sure you want to broadcast this alert to all users?'}
              </strong>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={confirmBroadcast} className="btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}>
                  {lang === 'ms' ? 'Ya, Terbitkan' : 'Yes, Publish'}
                </button>
                <button onClick={() => setShowConfirmBroadcast(false)} className="btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}>
                  {lang === 'ms' ? 'Batal' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Middle: Incident List and Review details */}
        <div className="admin-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="glass-panel admin-workspace" style={{ padding: '2rem' }}>
            <div className="admin-workspace-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
              <div className="admin-tabs">
                <button
                  onClick={() => setActiveSubTab('queue')}
                  className={`nav-link ${activeSubTab === 'queue' ? 'active' : ''}`}
                  aria-pressed={activeSubTab === 'queue'}
                >
                  <Shield size={18} /> {t('admin.queue')}
                </button>
                <button
                  onClick={() => setActiveSubTab('blacklist')}
                  className={`nav-link ${activeSubTab === 'blacklist' ? 'active' : ''}`}
                  aria-pressed={activeSubTab === 'blacklist'}
                >
                  <Filter size={18} /> {t('admin.blacklists')}
                </button>
                <button
                  onClick={() => setActiveSubTab('audit')}
                  className={`nav-link ${activeSubTab === 'audit' ? 'active' : ''}`}
                  aria-pressed={activeSubTab === 'audit'}
                >
                  <FileText size={18} /> {t('admin.audit')}
                </button>
                <button
                  onClick={() => setActiveSubTab('analytics')}
                  className={`nav-link ${activeSubTab === 'analytics' ? 'active' : ''}`}
                  aria-pressed={activeSubTab === 'analytics'}
                >
                  <BarChart2 size={18} /> {t('admin.analytics')}
                </button>
              </div>

              {activeSubTab === 'queue' && (
                <div className="admin-queue-filters" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <label className="admin-search-field" style={{ flex: 1, minWidth: '200px' }}>
                    <Search size={16} color="var(--text-muted)" aria-hidden="true" />
                    <input
                      className="admin-search-input"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('admin.search_placeholder')}
                      aria-label={t('admin.search_placeholder')}
                    />
                  </label>
                  <select
                    className="input-field admin-filter"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    aria-label={t('admin.all_categories')}
                  >
                    <option value="all">{t('admin.all_categories')}</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {getCategoryLabel(cat, t)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input-field admin-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    aria-label={t('admin.filter_all')}
                  >
                    <option value="all">{t('admin.filter_all')}</option>
                    <option value="pending">{t('admin.filter_pending')}</option>
                    <option value="confirmed">{t('admin.filter_confirmed')}</option>
                    <option value="rejected">{t('admin.filter_rejected')}</option>
                  </select>

                  {selectedForBulk.size > 0 && (
                    <button
                      onClick={handleBulkClear}
                      className="btn-primary"
                      style={{ background: 'linear-gradient(135deg, var(--color-high), #7f1d1d)', border: 'none', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                    >
                      <X size={16} /> Clear {selectedForBulk.size} {selectedForBulk.size === 1 ? 'Case' : 'Cases'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {activeSubTab === 'queue' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {caseActionFeedback && (
                  <div style={{
                    padding: '0.85rem 1.25rem',
                    background: caseActionFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${caseActionFeedback.type === 'error' ? '#ef4444' : '#10b981'}`,
                    borderRadius: '10px',
                    color: caseActionFeedback.type === 'error' ? '#fca5a5' : '#6ee7b7',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}>
                    <CheckCircle size={18} />
                    <span>{caseActionFeedback.message}</span>
                  </div>
                )}

                {filteredCases.length === 0 ? (
                  <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {searchQuery.trim() || filterCategory !== 'all' || filterStatus !== 'all' ? t('admin.no_reports_search') : t('admin.no_reports')}
                  </div>
                ) : (
                  (isQueueExpanded ? filteredCases : filteredCases.slice(0, 3)).map(caseItem => {
                    const report = caseItem.rootReport;
                    const isSelected = selectedReport?.id === report.id;

                    return (
                      <div key={caseItem.caseId} className="admin-report-card-container" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div
                          onClick={() => setSelectedReport(isSelected ? null : report)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedReport(isSelected ? null : report);
                            }
                          }}
                          role="button"
                          tabIndex="0"
                          aria-pressed={isSelected}
                          className="admin-report-card"
                          style={{
                            padding: '1.25rem',
                            background: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                            borderRadius: isSelected ? '12px 12px 0 0' : '12px',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                          }}
                        >
                          {/* Bulk Selection Checkbox */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedForBulk.has(report.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                const newSet = new Set(selectedForBulk);
                                if (e.target.checked) newSet.add(report.id);
                                else newSet.delete(report.id);
                                setSelectedForBulk(newSet);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{ cursor: 'pointer', width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }}
                              aria-label={`Select case ${caseItem.caseCode}`}
                            />
                          </div>

                          <div className="admin-report-copy" style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span className="badge badge-caution" style={{ fontSize: '0.7rem' }}>
                                {getCategoryLabel(caseItem.category || report.category || report.type, t)}
                              </span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>
                                {caseItem.caseCode || `CASE-${caseItem.caseId}`}
                              </span>
                              <span style={{
                                background: caseItem.reportCount > 1 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                                border: `1px solid ${caseItem.reportCount > 1 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.15)'}`,
                                color: caseItem.reportCount > 1 ? '#60a5fa' : '#cbd5e1',
                                borderRadius: '12px',
                                padding: '0.15rem 0.55rem',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}>
                                <span>🔗</span>
                                <span>{caseItem.reportCount} {lang === 'ms' ? 'Laporan' : (caseItem.reportCount === 1 ? 'Report' : 'Reports')}</span>
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                • {new Date(report.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p style={{
                              fontSize: '0.9rem',
                              color: '#fff',
                              marginTop: '0.5rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {report.text}
                            </p>
                          </div>

                          <div className="admin-report-status" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textAlign: 'right' }}>{t('admin.ai_score')}</span>
                              <strong style={{
                                color: report.score >= 80 ? 'var(--color-high)' : report.score >= 30 ? 'var(--color-caution)' : 'var(--color-low)',
                                fontSize: '1rem',
                                display: 'block',
                                textAlign: 'right'
                              }}>
                                {report.score}/100
                              </strong>
                            </div>
                            <span className={`badge ${caseItem.status === 'confirmed' ? 'badge-low' :
                              caseItem.status === 'rejected' ? 'badge-high' : 'badge-caution'
                              }`} style={{ textTransform: 'capitalize' }}>
                              {t(`status.${caseItem.status}`) || caseItem.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Inline Expanded Review UI */}
                        {isSelected && (
                          <div className="admin-report-details fade-in" style={{ padding: '1.5rem', background: 'rgba(6, 182, 212, 0.04)', border: '1px solid var(--primary)', borderTop: 'none', borderRadius: '0 0 12px 12px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                            {/* Header and Close Button */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
                              <h4 style={{ fontSize: '1.05rem', color: '#fff', margin: 0, fontWeight: 600 }}>
                                {caseItem.caseCode} — {t('admin.reviewing', 'Case Investigation Details')}
                              </h4>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedReport(null); }}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.35rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                aria-label={t('common.close', 'Close')}
                              >
                                <X size={16} />
                              </button>
                            </div>

                            <div>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                                {t('admin.text_evidence')}
                              </strong>
                              <div style={{ background: '#090d16', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', fontFamily: 'monospace', color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
                                {report.text}
                              </div>
                            </div>

                            {(() => {
                              const indicators = extractIndicators(report.text);
                              const hasIndicators = indicators.urls.length > 0 || indicators.phones.length > 0 || indicators.hasPaymentKeywords;
                              if (!hasIndicators) return null;

                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Extracted Threat Indicators
                                  </strong>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                    {indicators.urls.map(url => (
                                      <span key={url} className="badge badge-caution" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                                        🌐 {url}
                                      </span>
                                    ))}
                                    {indicators.phones.map(phone => (
                                      <span key={phone} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                                        📞 {phone}
                                      </span>
                                    ))}
                                    {indicators.hasPaymentKeywords && (
                                      <span className="badge badge-high" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                                        💵 {indicators.extractedPayment ? `${indicators.extractedPayment} Requested` : 'Payment Request Detected'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Case Reports Hierarchy Section (Section 16 & 17) */}
                            <div style={{
                              background: 'rgba(15, 23, 42, 0.85)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              borderRadius: '10px',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.75rem'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <FileText size={18} color="#38bdf8" />
                                  <strong style={{ color: '#38bdf8', fontSize: '0.92rem' }}>
                                    {lang === 'ms'
                                      ? `Hierarki Laporan Komuniti (${caseItem.reportCount} Laporan)`
                                      : `Attached Community Reports (${caseItem.reportCount} Reports)`}
                                  </strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMergeModalCase(caseItem);
                                    setTargetCaseIdSelection('');
                                  }}
                                  className="btn-secondary"
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '0.3rem 0.65rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    color: '#c084fc',
                                    borderColor: 'rgba(192, 132, 252, 0.4)'
                                  }}
                                  title={lang === 'ms' ? 'Gabungkan kes lain ke dalam kes ini' : 'Merge another case into this case'}
                                >
                                  <GitMerge size={14} />
                                  {lang === 'ms' ? 'Gabung Kes...' : 'Merge with Case...'}
                                </button>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                {caseItem.reports.map(r => {
                                  const isRoot = r.id === caseItem.rootReport.id;
                                  const type = r.reportType || (isRoot ? 'ORIGINAL' : 'DUPLICATE');
                                  const typeColor = type === 'ORIGINAL' ? '#3b82f6' : (type === 'DUPLICATE' ? '#f59e0b' : '#a855f7');
                                  const typeBg = type === 'ORIGINAL' ? 'rgba(59, 130, 246, 0.15)' : (type === 'DUPLICATE' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(168, 85, 247, 0.15)');

                                  return (
                                    <div
                                      key={r.id}
                                      style={{
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: `1px solid ${isRoot ? 'rgba(59, 130, 246, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                                        borderRadius: '8px',
                                        padding: '0.75rem 1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.35rem'
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                          <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.85rem' }}>
                                            {r.reportCode || `#${String(r.id).slice(-6)}`}
                                          </span>
                                          <span style={{
                                            background: typeBg,
                                            color: typeColor,
                                            border: `1px solid ${typeColor}`,
                                            fontSize: '0.68rem',
                                            fontWeight: 700,
                                            padding: '0.12rem 0.5rem',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase'
                                          }}>
                                            {type}
                                          </span>
                                          {r.aiConfidence && (
                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                              {r.aiConfidence}% AI Conf.
                                            </span>
                                          )}
                                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            • {new Date(r.timestamp).toLocaleDateString()}
                                          </span>
                                        </div>

                                        {/* Correction Actions (Section 18 & 19: Unmerge and Reassign) */}
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                          {!isRoot && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleUnmerge(r.id);
                                                }}
                                                className="btn-secondary"
                                                style={{
                                                  fontSize: '0.72rem',
                                                  padding: '0.2rem 0.55rem',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '0.3rem',
                                                  color: '#f59e0b',
                                                  borderColor: 'rgba(245, 158, 11, 0.4)'
                                                }}
                                                title={lang === 'ms' ? 'Asingkan laporan ke dalam kes baharu' : 'Unmerge into new pending case'}
                                              >
                                                <Split size={12} />
                                                {lang === 'ms' ? 'Asingkan' : 'Unmerge'}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setReassignModalReport(r);
                                                  setTargetCaseIdSelection('');
                                                }}
                                                className="btn-secondary"
                                                style={{
                                                  fontSize: '0.72rem',
                                                  padding: '0.2rem 0.55rem',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '0.3rem',
                                                  color: '#38bdf8',
                                                  borderColor: 'rgba(56, 189, 248, 0.4)'
                                                }}
                                                title={lang === 'ms' ? 'Tugaskan semula ke kes lain' : 'Reassign to another case'}
                                              >
                                                <CornerDownRight size={12} />
                                                {lang === 'ms' ? 'Tugaskan Semula' : 'Reassign'}
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                                        "{r.text}"
                                      </div>

                                      {Array.isArray(r.matchingFactors) && r.matchingFactors.length > 0 && (
                                        <div style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                          <span>🎯</span>
                                          <span>{r.matchingFactors.join(' | ')}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('admin.mod_note')}</label>
                              
                              {/* Quick Moderation Notes */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                {[
                                  { ms: "Scam disahkan. Tambah ke senarai hitam.", en: "Verified scam. Added to blacklist." },
                                  { ms: "Sepadan dengan rekod polis (CCID).", en: "Matches CCID police records." },
                                  { ms: "Bukti tidak mencukupi.", en: "Insufficient evidence provided." },
                                  { ms: "Laporan ulangan.", en: "Duplicate report." },
                                  { ms: "Mesej sah/selamat.", en: "Legitimate/safe message." },
                                  { ms: "Perlu semakan manual sekunder.", en: "Requires secondary manual review." }
                                ].map((note, idx) => (
                                  <button
                                    key={idx}
                                    onClick={(e) => { e.preventDefault(); setRationale(lang === 'ms' ? note.ms : note.en); }}
                                    style={{
                                      background: 'rgba(255,255,255,0.05)',
                                      border: '1px solid rgba(255,255,255,0.1)',
                                      color: '#cbd5e1',
                                      padding: '0.2rem 0.5rem',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                                  >
                                    {lang === 'ms' ? note.ms : note.en}
                                  </button>
                                ))}
                              </div>

                              <input
                                type="text"
                                value={rationale}
                                onChange={(e) => setRationale(e.target.value)}
                                placeholder={t('admin.mod_note_placeholder')}
                                className="input-field"
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <button
                                onClick={() => { handleAction(report.id, 'confirmed'); setSelectedReport(null); }}
                                className="btn-primary"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--color-low), #065f46)', color: '#fff', border: 'none', boxShadow: 'none' }}
                              >
                                <Check size={18} /> {t('admin.confirm_btn')}
                              </button>
                              <button
                                onClick={() => { handleAction(report.id, 'rejected'); setSelectedReport(null); }}
                                className="btn-primary"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--color-high), #7f1d1d)', color: '#fff', border: 'none', boxShadow: 'none' }}
                              >
                                <X size={18} /> {t('admin.reject_btn')}
                              </button>
                              <button
                                onClick={() => { handleAction(report.id, 'under_review'); setSelectedReport(null); }}
                                className="btn-secondary"
                                style={{ width: '100%' }}
                              >
                                {t('admin.flag_btn')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {filteredCases.length > 3 && (
                  <div style={{ textAlign: 'center', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <button
                      onClick={() => setIsQueueExpanded(!isQueueExpanded)}
                      className="btn-secondary"
                      style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                    >
                      {isQueueExpanded
                        ? (lang === 'ms' ? 'Tunjuk Kurang' : 'Show Less')
                        : (lang === 'ms'
                          ? `Tunjuk Lebih (${filteredCases.length - 3} lagi)`
                          : `Show More (${filteredCases.length - 3} more)`)}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'blacklist' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>{t('admin.add_blacklist')}</h3>
                  <form onSubmit={handleAddManualBlacklist} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <select
                      value={newBlacklistType}
                      onChange={(e) => {
                        setNewBlacklistType(e.target.value);
                        if (blacklistFeedback) setBlacklistFeedback(null);
                      }}
                      className="input-field"
                      style={{ flex: 1, minWidth: '150px' }}
                    >
                      <option value="urls">{t('admin.domain_url')}</option>
                      <option value="phoneNumbers">{t('admin.phone_number')}</option>
                      <option value="bankAccounts">{t('admin.bank_account')}</option>
                    </select>
                    <input
                      type="text"
                      value={newBlacklistItem}
                      onChange={(e) => {
                        setNewBlacklistItem(e.target.value);
                        if (blacklistFeedback) setBlacklistFeedback(null);
                      }}
                      className="input-field"
                      placeholder={getBlacklistPlaceholder()}
                      style={{ flex: 2, minWidth: '200px' }}
                    />
                    <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>{t('admin.add_btn')}</button>
                  </form>
                  {blacklistFeedback && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: blacklistFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      border: blacklistFeedback.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                      color: blacklistFeedback.type === 'error' ? '#fca5a5' : '#a7f3d0'
                    }}>
                      <span>{blacklistFeedback.type === 'error' ? '⚠️' : '✅'}</span>
                      <span>{blacklistFeedback.message}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--color-caution)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('admin.blocked_domains')}</h4>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {blacklist.urls.map(url => renderBlacklistItem('urls', url))}
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-caution)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('admin.blocked_phones')}</h4>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {blacklist.phoneNumbers.map(phone => renderBlacklistItem('phoneNumbers', phone))}
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-caution)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('admin.bank_account') || 'Blocked Bank Accounts'}</h4>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {blacklist.bankAccounts.map(account => renderBlacklistItem('bankAccounts', account))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'audit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Search & Action Filter Controls */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.25rem'
                }}>
                  {/* Search Box */}
                  <div style={{
                    flex: 1,
                    minWidth: '240px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Search
                      size={16}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }}
                    />
                    <input
                      type="search"
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      placeholder={lang === 'ms' ? 'Cari ID Pegawai, Nama atau Kod Laporan...' : 'Search Officer ID, Name or Report Code...'}
                      aria-label="Search audit logs"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Action Type Filter Dropdown */}
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: '160px'
                  }}>
                    <Filter
                      size={15}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '0.85rem', pointerEvents: 'none', zIndex: 1 }}
                    />
                    <select
                      value={auditActionFilter}
                      onChange={(e) => setAuditActionFilter(e.target.value)}
                      aria-label="Filter audit logs by action type"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2rem 0.75rem 2.25rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none'
                      }}
                    >
                      <option value="all" style={{ background: '#0f172a', color: '#fff' }}>
                        {lang === 'ms' ? 'Semua' : 'All'}
                      </option>
                      <option value="Status Updates" style={{ background: '#0f172a', color: '#fff' }}>
                        {lang === 'ms' ? 'Kemaskini Status' : 'Status Updates'}
                      </option>
                      <option value="Blacklist Changes" style={{ background: '#0f172a', color: '#fff' }}>
                        {lang === 'ms' ? 'Perubahan Senarai Hitam' : 'Blacklist Changes'}
                      </option>
                      <option value="Threat Alerts" style={{ background: '#0f172a', color: '#fff' }}>
                        {lang === 'ms' ? 'Amaran Ancaman' : 'Threat Alerts'}
                      </option>
                    </select>
                    <span style={{ position: 'absolute', right: '0.85rem', pointerEvents: 'none', color: '#94a3b8', fontSize: '0.75rem' }}>▼</span>
                  </div>

                  {/* Time Range Filter Dropdown */}
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: '170px'
                  }}>
                    <Clock
                      size={15}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '0.85rem', pointerEvents: 'none', zIndex: 1 }}
                    />
                    <select
                      value={auditTimeFilter}
                      onChange={(e) => setAuditTimeFilter(e.target.value)}
                      aria-label="Filter audit logs by time range"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2rem 0.75rem 2.25rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none'
                      }}
                    >
                      <option value="7days" style={{ background: '#0f172a', color: '#fff' }}>
                        {lang === 'ms' ? '7 Hari Terkini' : 'Last 7 Days'}
                      </option>
                      <option value="all" style={{ background: '#0f172a', color: '#fff' }}>
                        {lang === 'ms' ? 'Semua Rekod (Arkib)' : 'All Records (Archive)'}
                      </option>
                    </select>
                    <span style={{ position: 'absolute', right: '0.85rem', pointerEvents: 'none', color: '#94a3b8', fontSize: '0.75rem' }}>▼</span>
                  </div>
                </div>

                {/* Audit Cards List */}
                {filteredAuditLogs.length === 0 ? (
                  <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {auditSearchQuery.trim() || auditActionFilter !== 'all'
                      ? (lang === 'ms' ? 'Tiada rekod audit ditemui mengikut carian anda.' : 'No audit records match your search criteria.')
                      : t('admin.no_audit')}
                  </div>
                ) : (
                  <>
                    {(isAuditExpanded ? filteredAuditLogs : filteredAuditLogs.slice(0, 3)).map(log => (
                      <div key={log.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                            <span>{t('admin.action')}</span>
                            <strong style={{ color: 'var(--primary)' }}>{formatAuditAction(log.action, lang)}</strong>
                            {(log.reportCode || log.reportId) && (
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {t('admin.on_report') || (lang === 'ms' ? 'pada Laporan #' : 'on Report #')}
                                {(log.reportCode || log.reportId?.toString().slice(-6)).replace(/^#/, '')}
                              </span>
                            )}
                            {(log.performedBy || log.officerId) && (
                              <span style={{ color: 'var(--text-muted)' }}>
                                {lang === 'ms' ? 'oleh' : 'by'} {log.officerId || log.performedBy}
                              </span>
                            )}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString(lang === 'ms' ? 'ms-MY' : 'en-US')}</span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('admin.note')} {formatAuditNote(log.rationale || log.details, lang)}</span>
                      </div>
                    ))}

                    {filteredAuditLogs.length > 3 && (
                      <button
                        onClick={() => setIsAuditExpanded(!isAuditExpanded)}
                        className="btn-secondary"
                        style={{ alignSelf: 'center', marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 1rem' }}
                      >
                        {isAuditExpanded
                          ? (lang === 'ms' ? 'Papar Sedikit' : 'Show Less')
                          : (lang === 'ms'
                            ? `Papar Lebih (${filteredAuditLogs.length - 3} lagi)`
                            : `Show More (${filteredAuditLogs.length - 3} more)`)}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {activeSubTab === 'analytics' && (() => {
              // Prepare data for Pie Chart (Status Distribution)
              const statusCounts = reportsList.reduce((acc, report) => {
                acc[report.status] = (acc[report.status] || 0) + 1;
                return acc;
              }, {});
              const pieData = [
                {
                  name: lang === 'ms' ? 'Disahkan' : 'Confirmed',
                  value: statusCounts['confirmed'] || 0,
                  color: '#10b981'
                },
                {
                  name: lang === 'ms' ? 'Ditolak' : 'Rejected',
                  value: statusCounts['rejected'] || 0,
                  color: '#ef4444'
                },
                {
                  name: lang === 'ms' ? 'Menunggu' : 'Pending',
                  value: (statusCounts['unverified'] || 0) + (statusCounts['under_review'] || 0),
                  color: '#f59e0b'
                }
              ].filter(d => d.value > 0);

              // Prepare data for Bar Chart (Category Distribution)
              const categoryCounts = reportsList.reduce((acc, report) => {
                acc[report.category] = (acc[report.category] || 0) + 1;
                return acc;
              }, {});
              const getChartCategoryLabel = (key) => {
                const labels = {
                  emergency: lang === "ms" ? "Kecemasan" : "Emergency",
                  finance: lang === "ms" ? "Kewangan" : "Finance",
                  parcel: lang === "ms" ? "Bungkusan" : "Parcel",
                  job: lang === "ms" ? "Pekerjaan" : "Job",
                  phishing: "Phishing",
                };

                return labels[key.toLowerCase()] || key;
              };

              const barData = Object.keys(categoryCounts).map(key => ({
                name: getChartCategoryLabel(key),
                count: categoryCounts[key]
              }));

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ height: '300px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1rem', textAlign: 'center' }}>{t('admin.category_breakdown')}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                          formatter={(value) => [
                            value,
                            lang === 'ms' ? 'Bilangan' : 'Count'
                          ]} />
                        <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ height: '300px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1rem', textAlign: 'center' }}>{t('admin.resolution_status')}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Expanded Selected Report Details have been moved inline into the queue map */}

        </div>

      </div>

      {/* Reassign Report Modal */}
      {reassignModalReport && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: '#0d1322',
              border: '1px solid var(--primary)',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CornerDownRight size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>
                  {lang === 'ms' ? 'Tugaskan Semula Laporan' : 'Reassign Report'}
                </h3>
              </div>
              <button
                onClick={() => { setReassignModalReport(null); setTargetCaseIdSelection(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                aria-label={t('common.close', 'Close')}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                {lang === 'ms' ? 'Laporan yang Ditugaskan Semula:' : 'Report Being Reassigned:'}
              </span>
              <div style={{ background: '#090d16', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '0.25rem' }}>
                  {reassignModalReport.reportCode || `#${String(reassignModalReport.id).slice(-6)}`}
                </strong>
                <div style={{ color: '#cbd5e1', fontStyle: 'italic', maxHeight: '60px', overflowY: 'auto' }}>
                  "{reassignModalReport.text}"
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                {lang === 'ms' ? 'Pilih Kes Sasaran:' : 'Select Destination Case:'}
              </label>
              <select
                className="input-field"
                value={targetCaseIdSelection}
                onChange={(e) => setTargetCaseIdSelection(e.target.value)}
                style={{ width: '100%', background: '#0f172a', color: '#fff', fontSize: '0.88rem', padding: '0.65rem' }}
              >
                <option value="">
                  {lang === 'ms' ? '-- Pilih Kes Sasaran --' : '-- Choose Target Case --'}
                </option>
                {allGroupedCases
                  .filter(c => c.caseId !== (reassignModalReport.caseId || reassignModalReport.id))
                  .map(c => (
                    <option key={c.caseId} value={c.caseId}>
                      {c.caseCode || `CASE-${c.caseId}`} — ({c.reportCount} {c.reportCount === 1 ? 'report' : 'reports'}) - {(c.rootReport?.text || '').slice(0, 45)}...
                    </option>
                  ))}
              </select>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', marginBottom: 0 }}>
                {lang === 'ms'
                  ? 'Menugaskan semula laporan akan mengemas kini kiraan laporan komuniti secara automatik bagi kedua-dua kes.'
                  : 'Reassigning transfers this report into the target case, automatically recalculating community report counts for both cases.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setReassignModalReport(null); setTargetCaseIdSelection(''); }}
              >
                {lang === 'ms' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!targetCaseIdSelection}
                onClick={handleReassign}
                style={{
                  opacity: !targetCaseIdSelection ? 0.5 : 1,
                  cursor: !targetCaseIdSelection ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <CornerDownRight size={16} />
                {lang === 'ms' ? 'Sahkan Penugasan' : 'Confirm Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Case Modal */}
      {mergeModalCase && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: '#0d1322',
              border: '1px solid var(--primary)',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GitMerge size={20} color="#c084fc" />
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>
                  {lang === 'ms' ? 'Gabungkan Kes' : 'Merge Cases'}
                </h3>
              </div>
              <button
                onClick={() => { setMergeModalCase(null); setTargetCaseIdSelection(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                aria-label={t('common.close', 'Close')}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                {lang === 'ms' ? 'Kes Sumber (Akan Digabung):' : 'Source Case (Will Be Merged):'}
              </span>
              <div style={{ background: '#090d16', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <strong style={{ color: '#c084fc', display: 'block', marginBottom: '0.25rem' }}>
                  {mergeModalCase.caseCode || `CASE-${mergeModalCase.caseId}`} ({mergeModalCase.reportCount} {mergeModalCase.reportCount === 1 ? 'report' : 'reports'})
                </strong>
                <div style={{ color: '#cbd5e1', fontStyle: 'italic', maxHeight: '60px', overflowY: 'auto' }}>
                  "{mergeModalCase.rootReport?.text}"
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                {lang === 'ms' ? 'Pilih Kes Sasaran (Kekal Aktif):' : 'Select Target Case (Remains Active):'}
              </label>
              <select
                className="input-field"
                value={targetCaseIdSelection}
                onChange={(e) => setTargetCaseIdSelection(e.target.value)}
                style={{ width: '100%', background: '#0f172a', color: '#fff', fontSize: '0.88rem', padding: '0.65rem' }}
              >
                <option value="">
                  {lang === 'ms' ? '-- Pilih Kes Sasaran --' : '-- Choose Target Case --'}
                </option>
                {allGroupedCases
                  .filter(c => c.caseId !== mergeModalCase.caseId)
                  .map(c => (
                    <option key={c.caseId} value={c.caseId}>
                      {c.caseCode || `CASE-${c.caseId}`} — ({c.reportCount} {c.reportCount === 1 ? 'report' : 'reports'}) - {(c.rootReport?.text || '').slice(0, 45)}...
                    </option>
                  ))}
              </select>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', marginBottom: 0 }}>
                {lang === 'ms'
                  ? 'Semua laporan dalam kes sumber akan dipindahkan ke kes sasaran. Kiraan laporan komuniti akan disatukan.'
                  : 'All reports in the source case will be moved into the target case, and community report counters will be consolidated.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setMergeModalCase(null); setTargetCaseIdSelection(''); }}
              >
                {lang === 'ms' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!targetCaseIdSelection}
                onClick={handleMerge}
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
                  opacity: !targetCaseIdSelection ? 0.5 : 1,
                  cursor: !targetCaseIdSelection ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  border: 'none'
                }}
              >
                <GitMerge size={16} />
                {lang === 'ms' ? 'Sahkan Penggabungan' : 'Confirm Merge'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
