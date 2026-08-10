import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Eye, EyeOff, Shield, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAppContext } from '../context/AppContext';
import { redactSensitiveInformation } from '../utils/redaction';
import { SCAM_CATEGORIES } from '../config/categories';

export default function ReportModal({
  isOpen,
  onClose,
  scanResult,
  originalText = '',
  onSubmitReport,
}) {
  const { t, lang } = useLanguage();
  const { reportsList, currentUser } = useAppContext();
  const [category, setCategory] = useState('phishing');
  const [message, setMessage] = useState(originalText);
  const [consent, setConsent] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [assignedCode, setAssignedCode] = useState(null);
  const [messageError, setMessageError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const modalRef = useRef(null);
  const messageRef = useRef(null);
  const closeTimerRef = useRef(null);

  const redactedText = useMemo(
    () => redactSensitiveInformation(message),
    [message],
  );

  useEffect(() => {
    if (!isOpen) return;

    setMessage(originalText || '');
    setCategory('phishing');
    setConsent(false);
    setShowRaw(false);
    setSubmitted(false);
    setMessageError('');
    setSubmitError('');
    setShowDuplicateWarning(false);

    const focusTimer = window.setTimeout(() => messageRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen, originalText]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (event, bypassDuplicateCheck = false) => {
    if (event) event.preventDefault();
    setSubmitError('');

    if (!message.trim()) {
      setMessageError(t('report.message_required'));
      messageRef.current?.focus();
      return;
    }

    if (!consent) return;

    if (!bypassDuplicateCheck) {
      const isDuplicate = reportsList.some(r => 
        r.reporterId === currentUser?.id &&
        (r.originalText?.substring(0, 50) === message.substring(0, 50) || 
         r.text?.substring(0, 50) === message.substring(0, 50))
      );
      if (isDuplicate) {
        setShowDuplicateWarning(true);
        return;
      }
    }

    try {
      const code = await onSubmitReport?.({
        category,
        text: redactedText,
        originalText: message,
        score: scanResult?.score || 0,
        riskBand: scanResult?.riskBand || 'Low evidence',
        timestamp: new Date().toISOString(),
        status: 'unverified',
      });
      
      if (code) {
        setAssignedCode(code);
      }

      setSubmitted(true);
      closeTimerRef.current = window.setTimeout(onClose, 1800);
    } catch (e) {
      setSubmitError(lang === 'ms' ? 'Gagal menghantar laporan. Sila cuba lagi.' : 'Failed to submit report. Please try again.');
    }
  };

  const closeModal = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    setSubmitted(false);
    setAssignedCode(null);
    onClose();
  };

  return (
    <div
      className="report-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div
        className="report-modal glass-panel"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        <button
          type="button"
          onClick={closeModal}
          className="report-modal-close"
          aria-label={t('report.close')}
        >
          <X size={21} />
        </button>

        {submitted ? (
          <div className="report-success" role="status" aria-live="polite">
            <CheckCircle size={58} aria-hidden="true" />
            <h2 id="report-modal-title">{t('report.submitted')}</h2>
            {assignedCode && (
              <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)', margin: '0.25rem 0' }}>{assignedCode}</p>
            )}
            <p>{t('report.thank_you')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-form">
            <div className="report-heading">
              <Shield size={29} aria-hidden="true" />
              <div>
                <p className="section-eyebrow">{t('report.community_eyebrow')}</p>
                <h2 id="report-modal-title">{t('report.title')}</h2>
              </div>
            </div>

            <p className="report-description">{t('report.desc')}</p>

            {submitError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                {submitError}
              </div>
            )}
            
            {showDuplicateWarning && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.75rem', borderRadius: '8px', color: '#fbbf24', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={16} />
                  <strong>{lang === 'ms' ? '⚠️ Anda telah menghantar laporan serupa. Hantar juga?' : '⚠️ You have already submitted a similar report. Submit anyway?'}</strong>
                </div>
                <button type="button" onClick={(e) => handleSubmit(e, true)} className="btn-secondary" style={{ borderColor: 'rgba(245, 158, 11, 0.5)', color: '#fbbf24', alignSelf: 'center', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                  {lang === 'ms' ? 'Hantar Juga' : 'Submit Anyway'}
                </button>
              </div>
            )}

            <label className="report-field">
              <span>{t('report.message_label')}</span>
              <textarea
                ref={messageRef}
                className="input-field"
                rows="6"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  if (event.target.value.trim()) setMessageError('');
                  setShowDuplicateWarning(false);
                  setSubmitError('');
                }}
                placeholder={t('report.message_placeholder')}
                aria-describedby={messageError ? 'report-message-error' : 'report-message-help'}
                aria-invalid={Boolean(messageError)}
              />
              {messageError ? (
                <small id="report-message-error" className="report-error">
                  {messageError}
                </small>
              ) : (
                <small id="report-message-help">{t('report.message_help')}</small>
              )}
            </label>

            <label className="report-field">
              <span>{t('report.category')}</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="input-field"
              >
                {SCAM_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {t(cat.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            <div className="report-preview">
              <div className="report-preview-heading">
                <span>{t('report.redacted_preview')}</span>
                <button type="button" onClick={() => setShowRaw((value) => !value)}>
                  {showRaw ? <EyeOff size={15} /> : <Eye size={15} />}
                  {showRaw ? t('report.show_masked') : t('report.show_original')}
                </button>
              </div>
              <pre className={showRaw ? 'showing-raw' : ''}>
                {showRaw ? message : redactedText}
              </pre>
              <small>{t('report.verified_filters')}</small>
            </div>

            <label className="report-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
              />
              <span>{t('report.consent')}</span>
            </label>

            <div className="report-actions">
              <button type="button" onClick={closeModal} className="btn-secondary">
                {t('report.cancel')}
              </button>
              <button
                type="submit"
                disabled={!consent || !message.trim()}
                className="btn-primary"
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
