import React, { useState } from 'react';
import { Shield, Check, X, AlertTriangle, MessageSquare, ShieldAlert, Award, FileText, Send, UserCheck } from 'lucide-react';
import { LOCAL_BLACK_LIST } from '../utils/rulesEngine';

export default function ModeratorDashboard({ reportsList, onUpdateReportStatus, onAddAlert, reputationProfiles, onUpdateReputation }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [alertText, setAlertText] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [rationale, setRationale] = useState('');

  const handleAction = (id, decision) => {
    onUpdateReportStatus(id, decision, rationale);
    
    // Auto-update reputation profile if reporter is listed
    const report = reportsList.find(r => r.id === id);
    if (report && report.reporterId) {
      onUpdateReputation(report.reporterId, decision === 'confirmed');
    }

    // Add indicators to blacklists if confirmed
    if (decision === 'confirmed' && report) {
      // Find matches of URL/phone to push into local blacklist
      const urlRegex = /(pos-laju\.info|maybank|shopee|tnb|lhdn|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/gi;
      const urls = report.text.match(urlRegex);
      if (urls) {
        urls.forEach(url => {
          if (!LOCAL_BLACK_LIST.urls.includes(url.toLowerCase())) {
            LOCAL_BLACK_LIST.urls.push(url.toLowerCase());
          }
        });
      }
      const phoneRegex = /(\+?6?01[0-9]-?[0-9]{7,8})/g;
      const phones = report.text.match(phoneRegex);
      if (phones) {
        phones.forEach(p => {
          if (!LOCAL_BLACK_LIST.phoneNumbers.includes(p)) {
            LOCAL_BLACK_LIST.phoneNumbers.push(p);
          }
        });
      }
    }

    setSelectedReport(null);
    setRationale('');
  };

  const handlePublishAlert = (e) => {
    e.preventDefault();
    if (!alertText.trim()) return;

    onAddAlert({
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Overview stats header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Verification Queue</span>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>
            {reportsList.filter(r => r.status === 'unverified' || r.status === 'under_review').length} cases
          </h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-low)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Confirmed Local Scams</span>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>
            {reportsList.filter(r => r.status === 'confirmed').length} items
          </h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-caution)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reputation Accuracy Index</span>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>92.8%</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Incident List and Review details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={22} color="var(--primary)" />
              Moderation Case Queue
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reportsList.length === 0 ? (
                <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No active reports in queue. Everything is reviewed!
                </div>
              ) : (
                reportsList.map(report => (
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
          </div>

          {/* Expanded Selected Report Details */}
          {selectedReport && (
            <div className="glass-panel fade-in" style={{ padding: '2rem', border: '1px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Reviewing Report #{selectedReport.id.toString().slice(-6)}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category: <strong style={{color: 'var(--primary)'}}>{selectedReport.category}</strong></span>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Close Details
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
                    <Check size={18} /> Confirm Scam Case
                  </button>
                  <button 
                    onClick={() => handleAction(selectedReport.id, 'rejected')}
                    className="btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--color-high), #7f1d1d)', color: '#fff', border: 'none', boxShadow: 'none' }}
                  >
                    <X size={18} /> Reject / Dismiss Report
                  </button>
                  <button 
                    onClick={() => handleAction(selectedReport.id, 'under_review')}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Flag Under Review
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Right Side: Campus Alert Publisher & User Reputation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Broadcaster */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={20} color="var(--color-high)" />
              Broadcast Campus Alert
            </h3>
            
            <form onSubmit={handlePublishAlert} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <textarea 
                className="input-field"
                rows={3}
                value={alertText}
                onChange={(e) => setAlertText(e.target.value)}
                placeholder="Type high-risk threat warning to broadcast to all students..."
                style={{ fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Send size={14} /> Publish Broadcast Alert
              </button>
            </form>

            {alertSuccess && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-low)', textAlign: 'center' }}>
                ✓ Alert published to student view screens.
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
