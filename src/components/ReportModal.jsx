import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Eye, EyeOff, Shield, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { redactSensitiveInformation } from '../utils/redaction';

export default function ReportModal({
  isOpen,
  onClose,
  scanResult,
  originalText = '',
  onSubmitReport,
}) {
  const { t } = useLanguage();
  const [category, setCategory] = useState('phishing');
  const [message, setMessage] = useState(originalText);
  const [consent, setConsent] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [messageError, setMessageError] = useState('');
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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!message.trim()) {
      setMessageError(t('report.message_required'));
      messageRef.current?.focus();
      return;
    }

    if (!consent) return;

    onSubmitReport?.({
      category,
      text: redactedText,
      originalText: message,
      score: scanResult?.score || 0,
      riskBand: scanResult?.riskBand || 'Low evidence',
      timestamp: new Date().toISOString(),
      status: 'unverified',
    });

    setSubmitted(true);
    closeTimerRef.current = window.setTimeout(onClose, 1800);
  };

  const closeModal = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
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
                <option value="phishing">{t('report.cat_phishing')}</option>
                <option value="parcel">{t('report.cat_parcel')}</option>
                <option value="job">{t('report.cat_job')}</option>
                <option value="emergency">{t('report.cat_emergency')}</option>
                <option value="marketplace">{t('report.cat_marketplace')}</option>
                <option value="finance">{t('report.cat_finance')}</option>
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
