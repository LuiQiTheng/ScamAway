import React, { useState, useEffect } from 'react';
import { Shield, Check, X, AlertTriangle, MessageSquare, ShieldAlert, Award, FileText, Send, UserCheck, Search, Filter, BarChart2, Edit2, Trash2, Save } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import {
  extractIndicators,
  normalizeBankAccount,
  normalizeHostname,
  normalizePhone,
} from '../utils/rulesEngine';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ModeratorDashboard() {
  const { 
    reportsList, updateReportStatus, addAlert, 
    reputationProfiles, updateReputation, addBlacklistItem, blacklist,
    removeBlacklistItem, updateBlacklistItem 
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedForBulk, setSelectedForBulk] = useState(new Set());

  // Blacklist Management State
  const [newBlacklistItem, setNewBlacklistItem] = useState('');
  const [newBlacklistType, setNewBlacklistType] = useState('urls');
  const [editingItem, setEditingItem] = useState(null); // { type, oldValue }
  const [editValue, setEditValue] = useState('');

  // Dynamic placeholder for blacklist input
  const getBlacklistPlaceholder = () => {
    if (newBlacklistType === 'urls') return "e.g. scam-site.com";
    if (newBlacklistType === 'phoneNumbers') return "e.g. 012-3456789";
    if (newBlacklistType === 'bankAccounts') return "e.g. 15874269019";
    return "e.g. scam-site.com";
  };

  const handleAction = (id, decision) => {
    updateReportStatus(id, decision, rationale);
    
    // Auto-update reputation profile if reporter is listed
    const report = reportsList.find(r => r.id === id);
    if (report && report.reporterId) {
      updateReputation(report.reporterId, decision === 'confirmed');
    }

    // Confirming a report does not prove that every phone number or domain
    // inside it is malicious. Indicators must be reviewed and added manually
    // in the Blacklists tab so legitimate company details are not poisoned.

    // Log action to audit trail
    setAuditLogs(prev => [{
      id: Date.now(),
      reportId: id,
      action: decision,
      rationale,
      timestamp: new Date().toISOString()
    }, ...prev]);

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

  const translateText = async (text, sourceLang, targetLang) => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      const data = await response.json();
      return data[0][0][0];
    } catch (error) {
      console.error("Translation error:", error);
      return `[Translation Failed] ${text}`;
    }
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

    const timestamp = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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
    new Set(reportsList.map(r => (r.category || r.type || '').toLowerCase()).filter(Boolean))
  );

  const categoryLabels = {
    phishing: lang === "ms" ? "Pancingan Data" : "Phishing",
    parcel: lang === "ms" ? "Bungkusan" : "Parcel",
    job: lang === "ms" ? "Pekerjaan" : "Job",
  };

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

  const handleAddManualBlacklist = (e) => {
    e.preventDefault();
    if (!newBlacklistItem.trim()) return;
    const normalizers = {
      urls: normalizeHostname,
      phoneNumbers: normalizePhone,
      bankAccounts: normalizeBankAccount,
    };
    const normalizedValue = normalizers[newBlacklistType](newBlacklistItem);
    if (!normalizedValue) return;
    addBlacklistItem(newBlacklistType, normalizedValue);
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
            if(editValue.trim() && editValue !== value) {
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
                <input type="text" value={alertCategory} required onChange={() => {}} style={{ opacity: 0, height: 0, width: 0, position: 'absolute' }} />
              </div>
            </div>
            
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                {lang === 'ms' ? 'Butiran / Maklumat Tambahan' : 'Details / Extra Info'}
              </label>
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
                        {categoryLabels[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1))}
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
                  filteredReports.slice(0, 10).map(report => ( // Basic Pagination / Limiting for MVP
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
                          <span className="badge badge-caution" style={{ fontSize: '0.7rem' }}>{report.category}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{report.id.toString().slice(-6)}</span>
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
                        <span className={`badge ${
                          report.status === 'confirmed' ? 'badge-low' : 
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
              </div>
            )}

            {activeSubTab === 'blacklist' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>{t('admin.add_blacklist')}</h3>
                  <form onSubmit={handleAddManualBlacklist} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <select 
                      value={newBlacklistType} 
                      onChange={(e) => setNewBlacklistType(e.target.value)}
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
                      onChange={(e) => setNewBlacklistItem(e.target.value)}
                      className="input-field"
                      placeholder={getBlacklistPlaceholder()}
                      style={{ flex: 2, minWidth: '200px' }}
                    />
                    <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>{t('admin.add_btn')}</button>
                  </form>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {auditLogs.length === 0 ? (
                  <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {t('admin.no_audit')}
                  </div>
                ) : (
                  auditLogs.map(log => (
                    <div key={log.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#fff' }}>{t('admin.action')} <strong style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>{log.action}</strong> {t('admin.on_report')}{log.reportId.toString().slice(-6)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('admin.note')} {log.rationale || 'N/A'}</span>
                    </div>
                  ))
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
                { name: 'Confirmed', value: statusCounts['confirmed'] || 0, color: '#10b981' },
                { name: 'Rejected', value: statusCounts['rejected'] || 0, color: '#ef4444' },
                { name: 'Pending', value: (statusCounts['unverified'] || 0) + (statusCounts['under_review'] || 0), color: '#f59e0b' },
              ].filter(d => d.value > 0);

              // Prepare data for Bar Chart (Category Distribution)
              const categoryCounts = reportsList.reduce((acc, report) => {
                acc[report.category] = (acc[report.category] || 0) + 1;
                return acc;
              }, {});
              const barData = Object.keys(categoryCounts).map(key => ({
                name: key.charAt(0).toUpperCase() + key.slice(1),
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
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
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

        {/* Bottom: Community Reporters */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={20} color="var(--primary)" />
            {t('admin.community_reporters')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {reputationProfiles.map(rep => (
              <div 
                key={rep.profileId}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block' }}>{rep.userName}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('admin.role')} {rep.role} | {t('admin.level')} {rep.identityLevel}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-low)', fontWeight: 600 }}>{rep.agreementRate}% {t('admin.agree')}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>{rep.verifiedReports} {t('admin.verified')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
