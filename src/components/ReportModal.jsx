import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Eye, EyeOff, Shield, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAppContext } from '../context/AppContext';
import { redactSensitiveInformation } from '../utils/redaction';
import { SCAM_CATEGORIES } from '../config/categories';

const cleanDigits = (v) => String(v || '').replace(/\D/g, '');
const cleanPhone = (v) => {
  if (!v) return '';
  const cleaned = String(v).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+60')) return cleaned;
  if (cleaned.startsWith('60')) return '+' + cleaned;
  if (cleaned.startsWith('0')) return '+60' + cleaned.slice(1);
  return cleaned;
};

/* =========================================================================
   FEATURE: DUPLICATE REPORT PREVENTION & THANK-YOU POP-UP (PENDING DELETION)
   Status: TEMPORARILY TERMINATED / DISABLED
   Note: All code for preventing duplicate report submissions and showing the
         "Indicator Already Flagged / Thank you" modal is grouped in this section.
         This can be deleted cleanly in the future upon request without affecting
         any other system functions.
   ========================================================================= */

// FEATURE TOGGLE: Set to false to temporarily terminate this feature
export const ENABLE_DUPLICATE_REPORT_BLOCK = false;

/**
 * Checks if the current message / text is already flagged in reportsList.
 */
export const checkIsAlreadyFlagged = (message, originalText, reportsList) => {
  if (!ENABLE_DUPLICATE_REPORT_BLOCK) return false;
  if (!message && !originalText) return false;
  const targetText = (message || originalText).trim().toLowerCase();
  if (!targetText) return false;

  return (reportsList || []).some((report) => {
    const existingText = (
      report.text ||
      report.evidence ||
      report.scamText ||
      ''
    )
      .trim()
      .toLowerCase();
    return (
      existingText &&
      (existingText.includes(targetText) || targetText.includes(existingText))
    );
  });
};

/**
 * Render duplicate report block view ("Indicator Already Flagged / Thank You")
 */
export const renderDuplicateReportBlockScreen = ({ lang, closeModal }) => {
  if (!ENABLE_DUPLICATE_REPORT_BLOCK) return null;
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444',
          marginBottom: '1.25rem',
        }}
      >
        <ShieldAlert size={36} />
      </div>

      <h2
        id="report-modal-title"
        style={{
          fontSize: '1.35rem',
          fontWeight: '700',
          color: '#f8fafc',
          marginBottom: '0.75rem',
        }}
      >
        {lang === 'ms'
          ? 'Petunjuk Telah Dilaporkan'
          : 'Indicator Already Flagged'}
      </h2>

      <p
        style={{
          fontSize: '0.92rem',
          color: '#94a3b8',
          lineHeight: '1.6',
          marginBottom: '1.75rem',
        }}
      >
        {lang === 'ms'
          ? 'Petunjuk ini telah pun dilaporkan oleh komuniti kami. Terima kasih kerana membantu menjaga keselamatan rangkaian!'
          : 'This indicator has already been flagged by our community. Thank you for helping keep the network safe!'}
      </p>

      <button
        type="button"
        onClick={closeModal}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '10px',
          fontWeight: '600',
        }}
      >
        {lang === 'ms' ? 'Kembali ke Pemintas' : 'Back to Scanner'}
      </button>
    </div>
  );
};
/* =========================================================================
   END OF DUPLICATE REPORT PREVENTION FEATURE BLOCK
   ========================================================================= */

export default function ReportModal({
  isOpen,
  onClose,
  scanResult,
  originalText = '',
  onSubmitReport,
  isGuest = false,
  onRegister,
}) {
  const { t, lang } = useLanguage();
  const { reportsList = [], blacklist = {}, currentUser } = useAppContext();
  const [category, setCategory] = useState('phishing');
  const [message, setMessage] = useState(originalText);
  const [consent, setConsent] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [assignedCode, setAssignedCode] = useState(null);
  const [messageError, setMessageError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const modalRef = useRef(null);
  const messageRef = useRef(null);
  const closeTimerRef = useRef(null);

  const redactedText = useMemo(
    () => redactSensitiveInformation(message),
    [message],
  );

  // Check if the current indicator/text is already confirmed by admin (in blacklist or confirmed reports)
  const isKnownConfirmed = useMemo(() => {
    if (!message && !originalText) return false;
    const targetText = (message || originalText).trim().toLowerCase();
    if (!targetText) return false;

    // Check if in verified blacklist
    const inPhoneBlacklist = (blacklist?.phoneNumbers || []).some((p) => {
      const norm = cleanPhone(p);
      const digits = cleanDigits(p);
      return (norm && targetText.includes(norm.toLowerCase())) || (digits && targetText.includes(digits));
    });
    const inBankBlacklist = (blacklist?.bankAccounts || []).some((b) => {
      const norm = cleanDigits(b);
      return norm && targetText.includes(norm);
    });
    const inUrlBlacklist = (blacklist?.urls || []).some((u) => {
      return u && targetText.includes(u.toLowerCase());
    });

    // Check if already in reportsList with status confirmed
    const inConfirmedReports = (reportsList || []).some((report) => {
      if (report.status !== 'confirmed') return false;
      const existingText = (
        report.text ||
        report.evidence ||
        report.scamText ||
        ''
      )
        .trim()
        .toLowerCase();
      return (
        existingText &&
        (existingText.includes(targetText) || targetText.includes(existingText))
      );
    });

    return inPhoneBlacklist || inBankBlacklist || inUrlBlacklist || inConfirmedReports;
  }, [message, originalText, blacklist, reportsList]);

  // Duplicate report check (grouped feature toggle: disabled)
  const isAlreadyFlagged = useMemo(
    () => checkIsAlreadyFlagged(message, originalText, reportsList),
    [message, originalText, reportsList]
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

  if (isGuest) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-report-modal-title"
        aria-describedby="guest-report-modal-desc"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div
          className="glass-panel fade-in"
          style={{
            width: '100%',
            maxWidth: '440px',
            padding: '2rem 1.5rem',
            borderRadius: '20px',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            background: 'rgba(15, 23, 42, 0.95)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={30} color="#3b82f6" />
          </div>

          <h2
            id="guest-report-modal-title"
            style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0 }}
          >
            {lang === 'ms' ? 'Pendaftaran Akaun Diperlukan' : 'Account Registration Required'}
          </h2>

          <p
            id="guest-report-modal-desc"
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {lang === 'ms'
              ? 'Untuk mengelakkan laporan palsu dan menjaga integriti data komuniti, anda perlu mendaftar akaun sebelum menghantar laporan scam.'
              : 'To prevent spam and maintain community data integrity, you must register an account before submitting scam reports.'}
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              width: '100%',
              marginTop: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onRegister) onRegister();
              }}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                cursor: 'pointer',
              }}
            >
              <Shield size={18} />
              {lang === 'ms' ? 'Daftar Akaun Sekarang' : 'Register Account Now'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '12px',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {lang === 'ms' ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    setSubmitError('');

    if (isGuest) {
      setSubmitError(
        lang === 'ms'
          ? 'Pendaftaran akaun diperlukan untuk menghantar laporan.'
          : 'Account registration is required to submit a report.'
      );
      return;
    }

    // Duplicate report submission block (terminated via ENABLE_DUPLICATE_REPORT_BLOCK = false)
    if (ENABLE_DUPLICATE_REPORT_BLOCK && isAlreadyFlagged) return;

    if (!message.trim()) {
      setMessageError(t('report.message_required'));
      messageRef.current?.focus();
      return;
    }

    if (!consent) return;

    try {
      const code = await onSubmitReport?.({
        category,
        text: redactedText,
        score: scanResult?.score || (isKnownConfirmed ? 90 : 0),
        riskBand: scanResult?.riskBand || (isKnownConfirmed ? 'High risk' : 'Low evidence'),
        timestamp: new Date().toISOString(),
        status: isKnownConfirmed ? 'confirmed' : 'unverified',
        isKnownScam: !!isKnownConfirmed,
        skipStatusNotification: !!isKnownConfirmed,
        isGuest,
        rationale: isKnownConfirmed
          ? (lang === 'ms' ? 'Disahkan secara automatik melalui rekod senarai hitam pihak berkuasa.' : 'Automatically verified against verified authorities blacklist database.')
          : '',
      });

      if (code) {
        setAssignedCode(code);
      }

      setSubmitted(true);
    } catch (e) {
      setSubmitError(
        lang === 'ms'
          ? 'Gagal menghantar laporan. Sila cuba lagi.'
          : 'Failed to submit report. Please try again.',
      );
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

        {/* Duplicate Report Screen (Terminated via ENABLE_DUPLICATE_REPORT_BLOCK = false) */}
        {ENABLE_DUPLICATE_REPORT_BLOCK && isAlreadyFlagged ? (
          renderDuplicateReportBlockScreen({ lang, closeModal })
        ) : submitted ? (
          /* CONDITION: Report Successfully Submitted */
          <div className="report-success" role="status" aria-live="polite">
            <CheckCircle size={58} aria-hidden="true" />
            <h2 id="report-modal-title">{t('report.submitted')}</h2>
            {assignedCode && (
              <p
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  margin: '0.25rem 0',
                }}
              >
                {assignedCode}
              </p>
            )}
            <p>{t('report.thank_you')}</p>
            <button
              type="button"
              onClick={closeModal}
              className="btn-primary"
              style={{ marginTop: '1.25rem', width: '100%' }}
            >
              {lang === 'ms' ? 'Selesai' : 'Done'}
            </button>
          </div>
        ) : (
          /* Standard Submission Form */
          <form onSubmit={handleSubmit} className="report-form">
            <div className="report-heading">
              <Shield size={29} aria-hidden="true" />
              <div>
                <p className="section-eyebrow">
                  {t('report.community_eyebrow')}
                </p>
                <h2 id="report-modal-title">{t('report.title')}</h2>
              </div>
            </div>

            <p className="report-description">{t('report.desc')}</p>

            {isKnownConfirmed && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                color: '#93c5fd',
                fontSize: '0.88rem'
              }}>
                <ShieldAlert size={20} color="#60a5fa" style={{ flexShrink: 0 }} />
                <span>
                  {lang === 'ms'
                    ? 'Makluman Kes Disahkan: Petunjuk ini telah disahkan sebagai penipuan dalam pangkalan data senarai hitam rasmi. Laporan anda akan direkodkan sebagai Disahkan serta-merta tanpa perlu semakan semula.'
                    : 'Verified Case Notice: This indicator is already confirmed fraudulent in official threat databases. Your report will be automatically recorded as Confirmed without redundant review delays.'}
                </span>
              </div>
            )}

            {submitError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  marginBottom: '0.5rem',
                  textAlign: 'center',
                }}
              >
                {submitError}
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
                  setSubmitError('');
                }}
                placeholder={t('report.message_placeholder')}
                aria-describedby={
                  messageError
                    ? 'report-message-error'
                    : 'report-message-help'
                }
                aria-invalid={Boolean(messageError)}
              />
              {messageError ? (
                <small id="report-message-error" className="report-error">
                  {messageError}
                </small>
              ) : (
                <small id="report-message-help">
                  {t('report.message_help')}
                </small>
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
                <button
                  type="button"
                  onClick={() => setShowRaw((value) => !value)}
                >
                  {showRaw ? <EyeOff size={15} /> : <Eye size={15} />}
                  {showRaw
                    ? t('report.show_masked')
                    : t('report.show_original')}
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
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary"
              >
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