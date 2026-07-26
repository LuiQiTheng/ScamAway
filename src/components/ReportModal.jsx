import React, { useState, useEffect, useRef } from 'react';
import { Shield, Eye, EyeOff, X, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ReportModal({ isOpen, onClose, scanResult, originalText, onSubmitReport }) {
  const { t } = useLanguage();
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

  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Optional: focus first element when opened
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      <div 
        className="glass-panel" 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
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
            <h2 id="modal-title" style={{ fontSize: '1.75rem', color: '#fff' }}>{t('report.submitted')}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('report.thank_you')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={28} color="var(--primary)" />
              <h2 id="modal-title" style={{ fontSize: '1.5rem', color: '#fff' }}>{t('report.title')}</h2>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {t('report.desc')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('report.category')}</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="input-field"
                style={{ background: '#111827', cursor: 'pointer' }}
              >
                <option value="phishing">{t('report.cat_phishing')}</option>
                <option value="parcel">{t('report.cat_parcel')}</option>
                <option value="job">{t('report.cat_job')}</option>
                <option value="emergency">{t('report.cat_emergency')}</option>
                <option value="marketplace">{t('report.cat_marketplace')}</option>
                <option value="finance">{t('report.cat_finance')}</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {t('report.redacted_preview')}
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
                  {showRaw ? t('report.show_masked') : t('report.show_original')}
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
                {t('report.verified_filters')}
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
                {t('report.consent')}
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                type="button" 
                onClick={onClose} 
                className="btn-secondary" 
                style={{ flex: 1 }}
              >
                {t('report.cancel')}
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
                {t('report.submit_btn')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
