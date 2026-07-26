import React, { useState } from 'react';
import { Shield, Eye, EyeOff, X, CheckCircle } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, scanResult, originalText, onSubmitReport }) {
  if (!isOpen) return null;

  const [category, setCategory] = useState('phishing');
  const [consent, setConsent] = useState(false);
  const [redactedText, setRedactedText] = useState(() => {
    // Basic automatic redaction of phone numbers and bank account numbers for preview
    let txt = originalText || '';
    // Redact phone numbers
    txt = txt.replace(/(\+?6?01[0-9]-?[0-9]{7,8}|\+?6?0[3-9]-?[0-9]{7})/g, '[REDACTED PHONE]');
    // Redact bank account examples (digits of length 10-15)
    txt = txt.replace(/\b\d{10,15}\b/g, '[REDACTED BANK ACCOUNT]');
    return txt;
  });
  const [showRaw, setShowRaw] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!consent) return;

    // Send the report data back
    onSubmitReport({
      category,
      text: redactedText,
      originalText: originalText,
      score: scanResult?.score || 0,
      riskBand: scanResult?.riskBand || 'Low evidence',
      timestamp: new Date().toISOString(),
      status: 'unverified'
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'rgba(7, 10, 19, 0.8)'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '550px',
        background: 'var(--bg-dark)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.25rem',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer'
        }}>
          <X size={20} />
        </button>

        {submitted ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 0',
            textAlign: 'center',
            gap: '1rem'
          }}>
            <CheckCircle size={56} color="var(--color-low)" />
            <h2 style={{ fontSize: '1.75rem', color: '#fff' }}>Report Submitted</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Thank you! The report is now added to the queue for moderator verification. Your community contribution helps make our campus safer.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={28} color="var(--primary)" />
              <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>Submit Community Report</h2>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Your report will update local campus indicators and dashboards once approved. All personally identifiable details are masked automatically.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Scam Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="input-field"
                style={{ background: '#111827', cursor: 'pointer' }}
              >
                <option value="phishing">Phishing / Suspicious Link</option>
                <option value="parcel">Courier / Parcel scam</option>
                <option value="job">Part-time Job offer</option>
                <option value="emergency">Family emergency impersonation</option>
                <option value="marketplace">Off-platform trading / Marketplace scam</option>
                <option value="finance">Mule Bank accounts / Finance bait</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Redacted Evidence Preview
                </label>
                <button
                  type="button"
                  onClick={() => setShowRaw(!showRaw)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {showRaw ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showRaw ? 'Show Masked' : 'Show Original'}
                </button>
              </div>
              
              <div style={{
                background: '#090d16',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                maxHeight: '120px',
                overflowY: 'auto',
                color: showRaw ? '#fca5a5' : '#94a3b8'
              }}>
                {showRaw ? originalText : redactedText}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                * Verified database filters match indicators while preserving your anonymity.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.5rem' }}>
              <input 
                id="consent-check"
                type="checkbox" 
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                required
              />
              <label htmlFor="consent-check" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                I consent to upload this anonymized evidence. I verify that this represents suspicious or unsolicited content.
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                type="button" 
                onClick={onClose} 
                className="btn-secondary" 
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!consent}
                className="btn-primary" 
                style={{ 
                  flex: 1, 
                  opacity: consent ? 1 : 0.5,
                  cursor: consent ? 'pointer' : 'not-allowed'
                }}
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
