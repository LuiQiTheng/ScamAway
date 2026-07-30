import React, { useState } from 'react';
import { Shield, Check, X, AlertTriangle, MessageSquare, ShieldAlert, Award, FileText, Send, UserCheck, Search, Filter, BarChart2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { extractIndicators } from '../utils/rulesEngine';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ModeratorDashboard() {
  const { 
    reportsList, updateReportStatus, addAlert, 
    reputationProfiles, updateReputation, addBlacklistItem, blacklist 
  } = useAppContext();
  const { t, lang } = useLanguage();
  const [selectedReport, setSelectedReport] = useState(null);
  const [alertText, setAlertText] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [showConfirmBroadcast, setShowConfirmBroadcast] = useState(false);
  const [rationale, setRationale] = useState('');

  // New features state
  const [activeSubTab, setActiveSubTab] = useState('queue'); // queue, blacklist, audit
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [auditLogs, setAuditLogs] = useState([]);

  // Blacklist Management State
  const [newBlacklistItem, setNewBlacklistItem] = useState('');
  const [newBlacklistType, setNewBlacklistType] = useState('urls');

  const handleAction = (id, decision) => {
    updateReportStatus(id, decision, rationale);
    
    // Auto-update reputation profile if reporter is listed
    const report = reportsList.find(r => r.id === id);
    if (report && report.reporterId) {
      updateReputation(report.reporterId, decision === 'confirmed');
    }

    // Add indicators to blacklists if confirmed
    if (decision === 'confirmed' && report) {
      // Find matches of URL/phone to push into local blacklist
      const urlRegex = /(pos-laju\.info|maybank|shopee|tnb|lhdn|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/gi;
      const urls = report.text.match(urlRegex);
      if (urls) {
        urls.forEach(url => {
          if (!blacklist.urls.includes(url.toLowerCase())) {
            addBlacklistItem('urls', url.toLowerCase());
          }
        });
      }
      const phoneRegex = /(\+?6?01[0-9]-?[0-9]{7,8})/g;
      const phones = report.text.match(phoneRegex);
      if (phones) {
        phones.forEach(p => {
          if (!blacklist.phoneNumbers.includes(p)) {
            addBlacklistItem('phoneNumbers', p);
          }
        });
      }
    }

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

  const handlePublishAlert = (e) => {
    e.preventDefault();
    if (!alertText.trim()) return;
    setShowConfirmBroadcast(true);
  };

  const confirmBroadcast = () => {
    addAlert({
      id: Date.now(),
      message: alertText,
      timestamp: new Date().toISOString()
    });

    setAlertText('');
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
    new Set(reportsList.map(r => r.category || r.type).filter(Boolean))
  );

  const categoryLabels = {
  phishing: lang === "ms" ? "Pancingan Data" : "Phishing",
  parcel: lang === "ms" ? "Bungkusan" : "Parcel",
  job: lang === "ms" ? "Pekerjaan" : "Job",
};

  const filteredReports = reportsList
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
    addBlacklistItem(newBlacklistType, newBlacklistItem.trim().toLowerCase());
    setNewBlacklistItem('');
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
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-caution)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('admin.rep_index')}</span>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>92.8%</h2>
        </div>
      </div>

      <div className="admin-layout">
        
        {/* Left Side: Incident List and Review details */}
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
                <div className="admin-queue-filters">
                  <label className="admin-search-field">
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
                        {categoryLabels[cat.toLowerCase()] || cat}
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
                  <div 
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedReport(report);
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
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div className="admin-report-copy" style={{ flex: 1 }}>
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
                          {report.score}%
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
                      placeholder="e.g. scam-site.com"
                      style={{ flex: 2, minWidth: '200px' }}
                    />
                    <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>{t('admin.add_btn')}</button>
                  </form>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--color-caution)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('admin.blocked_domains')}</h4>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {blacklist.urls.map(url => (
                        <li key={url} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{url}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-caution)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('admin.blocked_phones')}</h4>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {blacklist.phoneNumbers.map(phone => (
                        <li key={phone} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{phone}</li>
                      ))}
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

          {/* Expanded Selected Report Details */}
          {selectedReport && (
            <div className="glass-panel fade-in" style={{ padding: '2rem', border: '1px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>{t('admin.reviewing')} #{selectedReport.id.toString().slice(-6)}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('admin.category_label')} <strong style={{color: 'var(--primary)'}}>{selectedReport.category}</strong></span>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  {t('common.close')}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Text evidence content */}
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    {t('admin.text_evidence')}
                  </strong>
                  <div style={{ background: '#090d16', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', fontFamily: 'monospace', color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
                    {selectedReport.text}
                  </div>
                </div>

                {/* Extracted Scam Indicators */}
                {(() => {
                  const indicators = extractIndicators(selectedReport.text);
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

                {/* Technical duplicate audit */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('admin.ai_eval')}</span>
                    <h4 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '0.25rem' }}>{selectedReport.score}% ({selectedReport.riskBand})</h4>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('admin.dup_incidents')}</span>
                    <h4 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                      {getDuplicateReportsCount(selectedReport)} {t('admin.matching_cases')}
                    </h4>
                  </div>
                </div>

                {/* Rationale input */}
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

                {/* Review Action Controls */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleAction(selectedReport.id, 'confirmed')}
                    className="btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--color-low), #065f46)', color: '#fff', border: 'none', boxShadow: 'none' }}
                  >
                    <Check size={18} /> {t('admin.confirm_btn')}
                  </button>
                  <button 
                    onClick={() => handleAction(selectedReport.id, 'rejected')}
                    className="btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--color-high), #7f1d1d)', color: '#fff', border: 'none', boxShadow: 'none' }}
                  >
                    <X size={18} /> {t('admin.reject_btn')}
                  </button>
                  <button 
                    onClick={() => handleAction(selectedReport.id, 'under_review')}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    {t('admin.flag_btn')}
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Right Side: Community Alert Publisher & User Reputation */}
        <div className="admin-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Broadcaster */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={20} color="var(--color-high)" />
              {t('admin.broadcast_title')}
            </h3>
            
            <form onSubmit={handlePublishAlert} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <textarea 
                className="input-field"
                rows={3}
                value={alertText}
                onChange={(e) => setAlertText(e.target.value)}
                placeholder={t("admin.broadcast_placeholder")}
                style={{ fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Send size={14} /> {t('admin.broadcast_btn')}
              </button>
            </form>

            {alertSuccess && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-low)', textAlign: 'center' }}>
                ✓ Alert published to public view screens.
              </div>
            )}

            {showConfirmBroadcast && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-high)', borderRadius: '8px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'block', marginBottom: '0.5rem' }}>Are you sure you want to broadcast this alert to all users?</strong>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={confirmBroadcast} className="btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}>Yes, Publish</button>
                  <button onClick={() => setShowConfirmBroadcast(false)} className="btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Reputation Lists (9.2 Reporter and reviewer reputation) */}
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

    </div>
  );
}
