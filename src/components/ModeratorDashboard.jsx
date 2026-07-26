import React, { useState } from 'react';
import { Shield, Check, X, AlertTriangle, MessageSquare, ShieldAlert, Award, FileText, Send, UserCheck, Search, Filter, BarChart2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ModeratorDashboard() {
  const { 
    reportsList, updateReportStatus, addAlert, 
    reputationProfiles, updateReputation, addBlacklistItem, blacklist 
  } = useAppContext();
  const { t } = useLanguage();
  const [selectedReport, setSelectedReport] = useState(null);
  const [alertText, setAlertText] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [rationale, setRationale] = useState('');

  // New features state
  const [activeSubTab, setActiveSubTab] = useState('queue'); // queue, blacklist, audit
  const [filterStatus, setFilterStatus] = useState('all');
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

    addAlert({
      id: Date.now(),
      message: alertText,
      timestamp: new Date().toISOString()
    });

    setAlertText('');
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

  const filteredReports = reportsList.filter(r => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return r.status === 'unverified' || r.status === 'under_review';
    return r.status === filterStatus;
  });

  const handleAddManualBlacklist = (e) => {
    e.preventDefault();
    if (!newBlacklistItem.trim()) return;
    addBlacklistItem(newBlacklistType, newBlacklistItem.trim().toLowerCase());
    setNewBlacklistItem('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Overview stats header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('admin.pending_queue')}</span>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>
            {reportsList.filter(r => r.status === 'unverified' || r.status === 'under_review').length} cases
          </h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-low)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('admin.confirmed_scams')}</span>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>
            {reportsList.filter(r => r.status === 'confirmed').length} items
          </h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-caution)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('admin.rep_index')}</span>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>92.8%</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Incident List and Review details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setActiveSubTab('queue')}
                  className={`nav-link ${activeSubTab === 'queue' ? 'active' : ''}`}
                >
                  <Shield size={18} /> {t('admin.queue')}
                </button>
                <button 
                  onClick={() => setActiveSubTab('blacklist')}
                  className={`nav-link ${activeSubTab === 'blacklist' ? 'active' : ''}`}
                >
                  <Filter size={18} /> {t('admin.blacklists')}
                </button>
                <button 
                  onClick={() => setActiveSubTab('audit')}
                  className={`nav-link ${activeSubTab === 'audit' ? 'active' : ''}`}
                >
                  <FileText size={18} /> {t('admin.audit')}
                </button>
                <button 
                  onClick={() => setActiveSubTab('analytics')}
                  className={`nav-link ${activeSubTab === 'analytics' ? 'active' : ''}`}
                >
                  <BarChart2 size={18} /> {t('admin.analytics')}
                </button>
              </div>
              
              {activeSubTab === 'queue' && (
                <select 
                  className="input-field" 
                  style={{ width: 'auto', padding: '0.5rem 1rem' }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Cases</option>
                  <option value="pending">Pending Review</option>
                  <option value="confirmed">Confirmed Scams</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}
            </div>

            {activeSubTab === 'queue' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredReports.length === 0 ? (
                  <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No active reports match this filter.
                  </div>
                ) : (
                  filteredReports.slice(0, 10).map(report => ( // Basic Pagination / Limiting for MVP
                  <div 
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
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
                    <div style={{ flex: 1, minWidth: '280px' }}>
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textAlign: 'right' }}>AI Risk Score</span>
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
                        {report.status.replace('_', ' ')}
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
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Add to Blacklist</h3>
                  <form onSubmit={handleAddManualBlacklist} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <select 
                      value={newBlacklistType} 
                      onChange={(e) => setNewBlacklistType(e.target.value)}
                      className="input-field" 
                      style={{ flex: 1, minWidth: '150px' }}
                    >
                      <option value="urls">Domain / URL</option>
                      <option value="phoneNumbers">Phone Number</option>
                      <option value="bankAccounts">Bank Account</option>
                    </select>
                    <input 
                      type="text"
                      value={newBlacklistItem}
                      onChange={(e) => setNewBlacklistItem(e.target.value)}
                      className="input-field"
                      placeholder="e.g. scam-site.com"
                      style={{ flex: 2, minWidth: '200px' }}
                    />
                    <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Add to List</button>
                  </form>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--color-caution)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Blocked Domains</h4>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {blacklist.urls.map(url => (
                        <li key={url} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{url}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-caution)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Blocked Phones</h4>
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
                    No moderation actions logged yet.
                  </div>
                ) : (
                  auditLogs.map(log => (
                    <div key={log.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#fff' }}>Action: <strong style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>{log.action}</strong> on Report #{log.reportId.toString().slice(-6)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Note: {log.rationale || 'N/A'}</span>
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
                    <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1rem', textAlign: 'center' }}>Scam Category Breakdown</h3>
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
                    <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1rem', textAlign: 'center' }}>Platform Resolution Status</h3>
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
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category: <strong style={{color: 'var(--primary)'}}>{selectedReport.category}</strong></span>
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
                    Anonymized Text Evidence:
                  </strong>
                  <div style={{ background: '#090d16', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', fontFamily: 'monospace', color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
                    {selectedReport.text}
                  </div>
                </div>

                {/* Technical duplicate audit */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI Risk Evaluation</span>
                    <h4 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '0.25rem' }}>{selectedReport.score}% ({selectedReport.riskBand})</h4>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Duplicate Incidents Matched</span>
                    <h4 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                      {getDuplicateReportsCount(selectedReport)} matching cases
                    </h4>
                  </div>
                </div>

                {/* Rationale input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Moderation Note / Rationale</label>
                  <input 
                    type="text" 
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="e.g., Matches verified POS Laju SMS phishing URL format. Added pos-laju.info to blocklist."
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
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
                placeholder="Type high-risk threat warning to broadcast to all users..."
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
          </div>

          {/* Reputation Lists (9.2 Reporter and reviewer reputation) */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={20} color="var(--primary)" />
              Community Reporters
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
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role: {rep.role} | level {rep.identityLevel}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-low)', fontWeight: 600 }}>{rep.agreementRate}% Agree</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>{rep.verifiedReports} verified</span>
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
