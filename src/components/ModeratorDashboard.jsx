import React, { useState, useEffect } from 'react';
import { Shield, Check, X, UserCheck, ShieldAlert, FileText, CheckCircle, XCircle, Search, Filter, ShieldCheck, Mail, Send, Activity, User, BookOpen, BarChart2, Edit2, Trash2, Save } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../utils/translateText';
import {
  extractIndicators,
  normalizeBankAccount,
  normalizeHostname,
  normalizePhone,
} from '../utils/rulesEngine';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SCAM_CATEGORIES, getCategoryLabel } from '../config/categories';

const DEFAULT_MOCK_AUDIT_LOGS = [
  {
    id: 'audit-1',
    officerId: 'admin1',
    officerName: 'Inspector Ali',
    department: 'Royal Malaysia Police',
    action: 'Case Status Updated to Confirmed Scam',
    reportCode: '511814',
    reportId: '511814',
    rationale: 'Marked report as confirmed scam after reviewing supporting evidence.',
    timestamp: '2026-09-11T13:04:00.000Z'
  },
  {
    id: 'audit-2',
    officerId: 'officer02',
    officerName: 'Sgt. Kumar',
    department: 'Royal Malaysia Police',
    action: 'Blacklist Added',
    reportCode: '498732',
    reportId: '498732',
    rationale: 'Added phone number to blacklist due to multiple verified reports.',
    timestamp: '2026-09-10T16:32:00.000Z'
  },
  {
    id: 'audit-3',
    officerId: 'admin1',
    officerName: 'Inspector Ali',
    department: 'Royal Malaysia Police',
    action: 'Threat Alert Raised',
    reportCode: '487201',
    reportId: '487201',
    rationale: 'Raised threat alert after high-risk indicators were detected.',
    timestamp: '2026-09-09T11:15:00.000Z'
  },
  {
    id: 'audit-4',
    officerId: 'officer05',
    officerName: 'Cpl. Tan',
    department: 'Royal Malaysia Police',
    action: 'Case Status Updated to Under Review',
    reportCode: '472659',
    reportId: '472659',
    rationale: 'Set case status to under review pending additional information.',
    timestamp: '2026-09-08T15:27:00.000Z'
  },
  {
    id: 'audit-5',
    officerId: 'admin1',
    officerName: 'Inspector Ali',
    department: 'Royal Malaysia Police',
    action: 'Blacklist Removed',
    reportCode: '461223',
    reportId: '461223',
    rationale: 'Removed number from blacklist after manual verification.',
    timestamp: '2026-09-07T10:08:00.000Z'
  }
];

export default function ModeratorDashboard({ onNavigate }) {
  const {
    reportsList, updateReportStatus, addAlert,
    addBlacklistItem, blacklist,
    removeBlacklistItem, updateBlacklistItem, auditLogs,
    adminProfile
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

  // Audit Sub-tab Search & Action Type Filter state
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  // Blacklist Management State
  const [newBlacklistItem, setNewBlacklistItem] = useState('');
  const [newBlacklistType, setNewBlacklistType] = useState('urls');
  const [editingItem, setEditingItem] = useState(null); // { type, oldValue }
  const [editValue, setEditValue] = useState('');
  const [blacklistFeedback, setBlacklistFeedback] = useState(null);

  // Helper for audit categorization and formatting
  const getAuditCategory = (action = '') => {
    const act = action.toLowerCase();
    if (act.includes('blacklist')) return 'Blacklist Changes';
    if (act.includes('alert') || act.includes('broadcast') || act.includes('threat')) return 'Threat Alerts';
    return 'Status Updates';
  };

  const formatAuditTimestamp = (ts) => {
    if (!ts) return 'N/A';
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return ts;
      const day = date.getDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    } catch {
      return ts;
    }
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

  // Find duplicates of the selected report based on matching text substrings (e.g. pos-laju or job terms)
  const getDuplicateReportsCount = (report) => {
    if (!report) return 0;
    return reportsList.filter(r =>
      r.id !== report.id &&
      (r.category === report.category ||
        r.text.substring(0, 20) === report.text.substring(0, 20))
    ).length;
  };

  const availableCategories = Array.from(
    new Set([
      ...SCAM_CATEGORIES.map(c => c.id),
      ...reportsList.map(r => (r.category || r.type || '').toLowerCase()).filter(Boolean)
    ])
  );

  // Ensure duplicate case IDs injected by hot-reloading loops are visually cleaned up
  const deduplicatedReports = Array.from(new Map(reportsList.map(r => [r.id, r])).values());

  const filteredReports = deduplicatedReports
    .filter(r => r.status !== 'archived')
    .filter(r => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'pending') return r.status === 'unverified' || r.status === 'under_review';
      return r.status === filterStatus;
    })
    .filter(r => {
      if (filterCategory === 'all') return true;
      return (r.category || r.type || '').toLowerCase() === filterCategory.toLowerCase();
    })
    .filter(r => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const text = (r.text || '').toLowerCase();
      const id = (r.id || '').toString().toLowerCase();
      const category = (r.category || '').toLowerCase();
      const type = (r.type || '').toLowerCase();
      const reporter = (r.submittedBy || r.reporterId || '').toLowerCase();
      return text.includes(q) || id.includes(q) || category.includes(q) || type.includes(q) || reporter.includes(q);
    });

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
  // Audit trail search & action type filter logic
  const rawAuditLogs = (auditLogs && auditLogs.length > 0) ? auditLogs : DEFAULT_MOCK_AUDIT_LOGS;

  const filteredAuditLogs = rawAuditLogs.filter(log => {
    // 1. Action Type Filter
    const cat = getAuditCategory(log.action);
    if (auditActionFilter !== 'all' && cat !== auditActionFilter) {
      return false;
    }

    // 2. Search Query Filter (Officer ID, Officer Name, Report Code)
    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase().trim();
      const officerId = (log.officerId || log.performedBy || 'OFF001').toLowerCase();
      const officerName = (log.officerName || log.performedByName || (log.performedBy && log.performedBy !== log.officerId ? log.performedBy : null) || 'Insp. Ahmad Razak').toLowerCase();

      let reportCode = (log.reportCode || '').toLowerCase();
      if (!reportCode && log.reportId) {
        const matchingReport = reportsList.find(r => r.id === log.reportId);
        reportCode = (matchingReport?.reportCode || `#${log.reportId.toString().slice(-6)}`).toLowerCase();
      }

      const rationale = (log.rationale || log.details || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const department = (log.department || '').toLowerCase();

      const isMatch = officerId.includes(q) ||
                      officerName.includes(q) ||
                      reportCode.includes(q) ||
                      rationale.includes(q) ||
                      action.includes(q) ||
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
                {filteredReports.length === 0 ? (
                  <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {searchQuery.trim() || filterCategory !== 'all' || filterStatus !== 'all' ? t('admin.no_reports_search') : t('admin.no_reports')}
                  </div>
                ) : (
                  (isQueueExpanded ? filteredReports : filteredReports.slice(0, 3)).map(report => (
                    <div key={report.id} className="admin-report-card-container" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div
                        onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedReport(selectedReport?.id === report.id ? null : report);
                          }
                        }}
                        role="button"
                        tabIndex="0"
                        aria-pressed={selectedReport?.id === report.id}
                        className="admin-report-card"
                        style={{
                          padding: '1.25rem',
                          background: selectedReport?.id === report.id ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${selectedReport?.id === report.id ? 'var(--primary)' : 'var(--border-color)'}`,
                          borderRadius: selectedReport?.id === report.id ? '12px 12px 0 0' : '12px',
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
                            aria-label={`Select report ${report.id}`}
                          />
                        </div>

                        <div className="admin-report-copy" style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="badge badge-caution" style={{ fontSize: '0.7rem' }}>{getCategoryLabel(report.category || report.type, t)}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {report.reportCode ? report.reportCode : `#${report.id.toString().slice(-6)}`}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {new Date(report.timestamp).toLocaleTimeString()}</span>
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
                          <span className={`badge ${report.status === 'confirmed' ? 'badge-low' :
                            report.status === 'rejected' ? 'badge-high' : 'badge-caution'
                            }`} style={{ textTransform: 'capitalize' }}>
                            {t(`status.${report.status}`) || report.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Inline Expanded Review UI */}
                      {selectedReport?.id === report.id && (
                        <div className="admin-report-details fade-in" style={{ padding: '1.5rem', background: 'rgba(6, 182, 212, 0.04)', border: '1px solid var(--primary)', borderTop: 'none', borderRadius: '0 0 12px 12px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                          {/* Header and Close Button */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
                            <h4 style={{ fontSize: '1.05rem', color: '#fff', margin: 0, fontWeight: 600 }}>{t('admin.reviewing', 'Incident Report Details')}</h4>
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

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('admin.ai_eval')}</span>
                              <h4 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '0.25rem' }}>{report.score}/100 ({report.riskBand})</h4>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('admin.dup_incidents')}</span>
                              <h4 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                                {getDuplicateReportsCount(report)} {t('admin.matching_cases')}
                              </h4>
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
                                { ms: "Laporan berganda.", en: "Duplicate report." },
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
                  ))
                )}

                {filteredReports.length > 3 && (
                  <div style={{ textAlign: 'center', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <button
                      onClick={() => setIsQueueExpanded(!isQueueExpanded)}
                      className="btn-secondary"
                      style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                    >
                      {isQueueExpanded
                        ? (lang === 'ms' ? 'Tunjuk Kurang' : 'Show Less')
                        : (lang === 'ms'
                          ? `Tunjuk Lebih (${filteredReports.length - 3} lagi)`
                          : `Show More (${filteredReports.length - 3} more)`)}
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
                    minWidth: '260px',
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
                </div>

                {/* Audit Cards List */}
                {filteredAuditLogs.length === 0 ? (
                  <div style={{
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    color: '#94a3b8',
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <p style={{ fontSize: '0.95rem', margin: 0 }}>
                      {auditSearchQuery.trim() || auditActionFilter !== 'all'
                        ? (lang === 'ms' ? 'Tiada rekod audit ditemui mengikut carian anda.' : 'No audit records match your search criteria.')
                        : t('admin.no_audit')}
                    </p>
                  </div>
                ) : (
                  <>
                    {(isAuditExpanded ? filteredAuditLogs : filteredAuditLogs.slice(0, 5)).map(log => {
                      const officerId = log.officerId || log.performedBy || 'admin1';
                      const cat = getAuditCategory(log.action);

                      let reportCode = log.reportCode || null;
                      if (!reportCode && log.reportId) {
                        const rMatch = reportsList.find(r => r.id === log.reportId);
                        reportCode = rMatch?.reportCode || `#${log.reportId.toString().slice(-6)}`;
                      }

                      // Determine Action Icon and Color Palette matching reference design
                      let IconComp = ShieldCheck;
                      let iconBg = 'rgba(16, 185, 129, 0.12)';
                      let iconBorder = '1px solid rgba(16, 185, 129, 0.3)';
                      let iconColor = '#10b981';

                      const actionLower = (log.action || '').toLowerCase();
                      if (actionLower.includes('blacklist')) {
                        IconComp = XCircle;
                        iconBg = 'rgba(239, 68, 68, 0.12)';
                        iconBorder = '1px solid rgba(239, 68, 68, 0.3)';
                        iconColor = '#ef4444';
                      } else if (actionLower.includes('alert') || actionLower.includes('broadcast') || actionLower.includes('threat')) {
                        IconComp = ShieldAlert;
                        iconBg = 'rgba(139, 92, 246, 0.12)';
                        iconBorder = '1px solid rgba(139, 92, 246, 0.3)';
                        iconColor = '#a78bfa';
                      } else if (actionLower.includes('under review')) {
                        IconComp = FileText;
                        iconBg = 'rgba(59, 130, 246, 0.12)';
                        iconBorder = '1px solid rgba(59, 130, 246, 0.3)';
                        iconColor = '#3b82f6';
                      }

                      return (
                        <div
                          key={log.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '1rem',
                            padding: '1.25rem 1.5rem',
                            background: 'rgba(15, 23, 42, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Left Action Icon Circle */}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: iconBg,
                            border: iconBorder,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: iconColor,
                            flexShrink: 0,
                            marginTop: '2px'
                          }}>
                            <IconComp size={20} />
                          </div>

                          {/* Main Card Information */}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                            {/* Header: Action Title & Timestamp */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                                <span style={{ color: '#cbd5e1', fontWeight: 500 }}>Action: </span>
                                <span style={{ color: '#06b6d4' }}>{log.action}</span>
                              </div>
                              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                {formatAuditTimestamp(log.timestamp)}
                              </span>
                            </div>

                            {/* Metadata Row: Officer/Admin ID & Report Code */}
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <User size={15} color="#94a3b8" />
                                <strong style={{ color: '#fff', fontWeight: 600 }}>{officerId}</strong>
                              </div>

                              {reportCode && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <FileText size={15} color="#94a3b8" />
                                  <span>Report #{reportCode.toString().replace(/^#/, '')}</span>
                                </div>
                              )}
                            </div>

                            {/* Note / Rationale */}
                            {(log.rationale || log.details) && (
                              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                                <span style={{ color: '#cbd5e1', fontWeight: 500 }}>Note: </span>
                                {log.rationale || log.details}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Show More Button */}
                    {filteredAuditLogs.length > 5 && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => setIsAuditExpanded(!isAuditExpanded)}
                          style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '20px',
                            padding: '0.5rem 1.5rem',
                            color: '#94a3b8',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontWeight: 500
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                        >
                          {isAuditExpanded
                            ? (lang === 'ms' ? 'Tunjuk Kurang' : 'Show Less')
                            : (lang === 'ms'
                              ? `Tunjuk Lebih (${filteredAuditLogs.length - 5} lagi)`
                              : `Show More (${filteredAuditLogs.length - 5} more)`)}
                        </button>
                      </div>
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

    </div>
  );
}
