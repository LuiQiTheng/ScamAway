import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert, ShieldCheck, Shield, Clipboard,
  Upload, QrCode, Link, AlertTriangle,
  Volume2, VolumeX, Phone, CheckSquare,
  Square, RefreshCw, Send, AlertCircle, Sparkles
} from 'lucide-react';
import {
  analyzeScamRisk,
  DEMO_SCREENSHOTS,
  findMatchingVerifiedReports,
} from '../utils/rulesEngine';
import { checkUrlWithVirusTotal, checkDomainExists } from '../utils/virusTotal';
import { QUICK_TEST_PRESETS } from '../content/member2Content';
import ReportModal from './ReportModal';
import GuardianAlertModal from "../components/Guardian/GuardianAlertModal";
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export default function UserChecker({ userMode = 'normal', isElderlyMode = false, isKidMode = false, onSetUserMode }) {
  const { reportsList, activeAlert, addReport, blacklist, currentUser } = useAppContext();
  const { t, lang } = useLanguage();
  const lastScanRef = useRef(null);
  const [activeTab, setActiveTab] = useState('text'); // text, url
  const [inputText, setInputText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isUrlInvalid, setIsUrlInvalid] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [qrScannerEnabled, setQrScannerEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSteps, setScanSteps] = useState([]);
  const [scanResult, setScanResult] = useState(null);

  // Text to Speech
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const speechRef = useRef(null);

  // Report Modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [textToReport, setTextToReport] = useState('');

  // Checklist state
  const [checkedActions, setCheckedActions] = useState({});

  // Guardian Alert Modal
  const [showGuardianAlert, setShowGuardianAlert] = useState(false);

  // VirusTotal scan state
  const [vtResult, setVtResult] = useState(null);
  const [vtLoading, setVtLoading] = useState(false);

  // Reset checked actions on new scan
  useEffect(() => {
    setCheckedActions({});
    stopSpeech();
    // Reset VT result when a new scan starts
    if (!scanResult) {
      setVtResult(null);
      setVtLoading(false);
    }
  }, [scanResult]);

  useEffect(() => {
  if (!scanResult || !lastScanRef.current) return;

  const rerun = async () => {
    const res = await analyzeScamRisk(
      lastScanRef.current.text,
      {
        ...lastScanRef.current.metadata,
        verifiedReportsCount: reportsList.filter(
          r => r.status === "confirmed"
        ).length,
        blacklist,
        lang
      }
    );

    setScanResult(res);
  };

  rerun();
}, [lang, blacklist, reportsList]);

  // Clean speech synthesis and scanner on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const triggerScanAnimation = (finalText, metadata = {}) => {
    lastScanRef.current = {
      text: finalText,
      metadata
    };

    setIsScanning(true);
    setScanResult(null);
    setScanSteps([]);

    const steps = [
      t('scanner.step_ocr'),
      t('scanner.step_parse'),
      t('scanner.step_match'),
      t('scanner.step_db'),
      t('scanner.step_score')
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setScanSteps(prev => [...prev, step]);
      }, (idx + 1) * 150);
    });

    setTimeout(async () => {
      const matchedVerifiedReports = findMatchingVerifiedReports(
        finalText,
        reportsList,
        metadata,
      );

      const res = await analyzeScamRisk(finalText, {
        ...metadata,
        matchedVerifiedReports,
        blacklist: blacklist,
        lang: lang
      });

      // Check for URLs to scan with VT synchronously
      const urlsToCheck = res.analysis?.urls || [];
      const rawUrlMatch = finalText.match(/https?:\/\/[^\s]+/i);
      if (rawUrlMatch && !urlsToCheck.includes(rawUrlMatch[0])) {
        urlsToCheck.push(rawUrlMatch[0]);
      }

      if (urlsToCheck.length > 0) {
        setScanSteps(prev => [...prev, t('vt.scanning') || "Checking global threat databases..."]);
        setVtLoading(true);
        setVtResult(null);

        const urlToScan = urlsToCheck[0].startsWith('http') ? urlsToCheck[0] : `https://${urlsToCheck[0]}`;
        try {
          const vtRes = await checkUrlWithVirusTotal(urlToScan);
          setVtResult(vtRes);
          
          if (vtRes.isMalicious) {
            res.score = 95;
            res.riskBand = t('result.high_risk') || "Critical";
            res.bandColor = "critical";
            res.explanations.push({
              category: "technical",
              label: t('vt.malicious') || "Threats detected!",
              text: t('vt.malicious_evidence') || "VirusTotal Threat Intelligence: Multiple global security vendors have flagged this URL as malicious.",
              weight: 83
            });
          } else if (vtRes.status === 'success' && !vtRes.isMalicious) {
            const extRuleIndex = res.explanations.findIndex(e => e.weight === 12);
            if (extRuleIndex !== -1) {
              res.explanations[extRuleIndex].text += " " + (t('vt.safe_evidence') || "VirusTotal scanned this URL and found no known malware, but you should still verify the source.");
            }
          }
        } catch (e) {
          // Fallback if VT fails completely
        }
        setVtLoading(false);
      }

      setScanResult(res);

      if (
        (res.bandColor === "high" || res.bandColor === "critical") && 
        (isKidMode || isElderlyMode)
      ) {
        setShowGuardianAlert(true);
      }

      setIsScanning(false);
    }, steps.length * 150 + 200);
  };

  const handleScanText = () => {
    if (!inputText.trim()) return;
    triggerScanAnimation(inputText);
  };

  const handleQuickTest = (preset) => {
    setActiveTab('text');
    setInputText(preset.text);
    setScanResult(null);
    setScanSteps([]);
  };

  const handleScanUrl = async () => {
    const rawUrl = urlInput.trim();
    const rawPhone = phoneInput.trim();

    if (!rawUrl && !rawPhone) {
        setUrlError(t("scanner.empty_url_error"));
        setIsUrlInvalid(true);
        setScanResult(null);
        return;
    }

    if (!rawUrl && rawPhone) {
        triggerScanAnimation(`Phone check request: ${rawPhone}`);
        return;
    }

    let formatted = rawUrl;

    if (!/^https?:\/\//i.test(formatted)) {
        formatted = "https://" + formatted;
    }

    let isValid = false;
    let host = "";

    try {
        const parsed = new URL(formatted);
        host = parsed.hostname;

        const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/i;

        isValid = domainRegex.test(host);
    } catch {
        isValid = false;
    }

    if (!isValid) {
        setUrlError(t("scanner.invalid_url_format") || t("scanner.invalid_url_detailed_error"));
        setIsUrlInvalid(true);
        setScanResult(null);
        return;
    }

    // New DNS verification check
    setIsScanning(true);
    setScanSteps([t('scanner.step_db') || "Validating domain..."]);
    
    // Promise.all ensures the animation plays for at least 800ms for better UX
    const [dnsResult] = await Promise.all([
        checkDomainExists(formatted),
        new Promise(resolve => setTimeout(resolve, 800))
    ]);
    
    // BYPASS for local offline demo blacklisted URLs (since they don't actually exist on the internet)
    const isBlacklisted = blacklist?.urls?.some(u => host.includes(u));

    if (!dnsResult.exists && !isBlacklisted) {
        if (dnsResult.error === 'network_blocked') {
            setUrlError("Your browser or adblocker is blocking the DNS security check. Please disable it to scan URLs.");
        } else if (dnsResult.error === 'api_failed') {
            setUrlError("DNS service is temporarily unavailable. Please try again.");
        } else {
            setUrlError(t("scanner.non_existent_url"));
        }
        setIsUrlInvalid(true);
        setScanResult(null);
        setIsScanning(false);
        setScanSteps([]);
        return;
    }

    setUrlInput(formatted);

    setUrlError("");
    setIsUrlInvalid(false);

    const combinedText = `Url check request: ${formatted}.${rawPhone ? ` Phone info: ${rawPhone}` : ""}`;
    triggerScanAnimation(combinedText);
  };



  const toggleCheckAction = (idx) => {
    setCheckedActions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Text to speech function
  const speakResult = () => {
    if (!scanResult) return;

    if (isPlayingAudio) {
      stopSpeech();
      return;
    }

    const intro = t('engine.speech_done').replace('{band}', scanResult.riskBand).replace('{score}', scanResult.score);
    const low = scanResult.bandColor === 'low' ? t('engine.speech_low') : '';
    const caution = scanResult.bandColor === 'caution' ? t('engine.speech_caution') : '';
    const high = (scanResult.bandColor === 'high' || scanResult.bandColor === 'critical') ? t('engine.speech_high') : '';
    const recommended = t('engine.speech_intro');

    const textToSpeak = `
      ${intro}
      ${low}
      ${caution}
      ${high}
      ${recommended}
      ${scanResult.recommendedActions.join('. ')}
    `;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any existing speech
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = lang === 'ms' ? 'ms-MY' : 'en-US';
      utterance.rate = isElderlyMode ? 0.85 : 1.0; // Slower for elderly
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      speechRef.current = utterance;
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const openReportFlow = () => {
    setTextToReport(inputText || urlInput || "Suspicious Scam Content");
    setIsReportOpen(true);
  };

  return (
    <div className={`page-shell scanner-page ${isElderlyMode ? 'elderly-mode' : ''}`}>

      {/* Broadcast Campus Alert Banner */}
      {activeAlert && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          padding: '1.25rem 1.75rem',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)',
          marginBottom: '0',
          animation: 'pulse-glow 3s infinite'
        }}>
          {activeAlert.category ? (
            /* New Rich Format */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldAlert size={28} color="var(--color-high)" />
                    <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', margin: 0, lineHeight: 1.2 }}>
                      {t('trends.title')}
                    </h1>
                  </div>
                </div>

                {activeAlert.timestamp && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                    {t('trends.last_updated')} {activeAlert.timestamp}
                  </span>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fca5a5', marginTop: 0, marginBottom: 0, lineHeight: 1.3 }}>
                  {lang === 'ms' ? (activeAlert.category_ms || activeAlert.category) : activeAlert.category}
                </h2>
                <p style={{ fontSize: '0.9rem', fontWeight: '500', color: '#cbd5e1', marginTop: '0.5rem', marginBottom: 0, lineHeight: 1.5 }}>
                  {lang === 'ms' ? (activeAlert.details_ms || activeAlert.details) : activeAlert.details}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#f1f5f9', marginTop: '1rem', marginBottom: 0, lineHeight: '1.4', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  💡 {lang === 'ms' ? (activeAlert.solution_ms || activeAlert.solution) : activeAlert.solution}
                </p>
              </div>
            </div>
          ) : (
            /* Fallback for old alert format */
            <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
              <AlertCircle size={28} color="var(--color-high)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-high" style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>{t('scanner.alert_badge')}</span>
                  <strong style={{ color: '#fff', fontSize: isElderlyMode ? '1.2rem' : '0.95rem' }}>{t('scanner.alert_title')}</strong>
                </div>
                <p style={{ color: '#fca5a5', marginTop: '0.25rem', fontSize: isElderlyMode ? '1.15rem' : '0.85rem' }}>
                  {lang === 'ms'
                    ? (activeAlert.message_ms || (activeAlert.message?.includes("Urgent: A wave of parcel")
                      ? "Segera: Gelombang SMS bayaran semasa penghantaran (COD) bungkusan yang menyamar sebagai pautan Pos Laju (pos-laju.info) telah menyasarkan wilayah Selangor dan Lembah Klang. Jangan bayar atau buka pautan tersebut."
                      : activeAlert.message))
                    : activeAlert.message}
                </p>
              </div>
            </div>
          )}
        </div>
      )}



      <div className="scanner-content-grid" style={{ gap: '2rem' }}>

        {/* Input Console */}
        <div className="glass-panel scanner-input-panel" style={{ padding: '1.5rem 1.75rem' }}>
          <h2 style={{ fontSize: isElderlyMode ? '1.8rem' : '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={28} color="var(--primary)" />
            {t('scanner.title')}
          </h2>

          {/* Form Tabs */}
          <div className="scanner-tabs" role="tablist" aria-label="Scam evidence type" style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={() => { setActiveTab('text'); setScanResult(null); }}
              className={`nav-link scanner-method-tab ${activeTab === 'text' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'text'}
              style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
            >
              <Clipboard size={16} /> {t('scanner.text_paste')}
            </button>

            <button
              onClick={() => { setActiveTab('url'); setScanResult(null); }}
              className={`nav-link scanner-method-tab ${activeTab === 'url' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'url'}
              style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
            >
              <Link size={16} /> {t('scanner.url_btn')}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'text' && (
            <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="quick-test-panel">
                <div className="quick-test-heading">
                  <Sparkles size={17} aria-hidden="true" />
                  <div>
                    <strong>{lang === 'ms' ? 'Ujian Pantas Demo' : 'Demo Quick Tests'}</strong>
                    <span>
                      {lang === 'ms'
                        ? 'Pilih contoh untuk mengisi pengimbas secara automatik.'
                        : 'Choose an example to fill the scanner automatically.'}
                    </span>
                  </div>
                </div>
                <div className="quick-test-grid">
                  {QUICK_TEST_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`quick-test-button ${preset.tone}`}
                      onClick={() => handleQuickTest(preset)}
                    >
                      {preset.label[lang] || preset.label.en}
                    </button>
                  ))}
                </div>
              </div>

              <label className="form-label" htmlFor="scam-message-input">
                {lang === 'ms' ? 'Mesej atau konteks untuk diperiksa' : 'Message or context to check'}
              </label>
              <textarea
                id="scam-message-input"
                className="input-field"
                rows={isElderlyMode ? 5 : 4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('scanner.placeholder')}
                aria-describedby="scam-message-hint"
                style={{ resize: 'vertical' }}
              />
              <span id="scam-message-hint" className="form-hint">
                {lang === 'ms'
                  ? 'Jangan masukkan kata laluan, OTP, atau maklumat bank sebenar.'
                  : 'Do not enter real passwords, OTPs, or banking details.'}
              </span>
              <button
                onClick={handleScanText}
                className="btn-primary scan-primary-action"
                disabled={!inputText.trim() || isScanning}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isScanning ? <RefreshCw className="spinning" size={18} /> : <ShieldAlert size={18} />}
                {isScanning ? t('common.loading') : t('scanner.button')}
              </button>
            </div>
          )}

          {activeTab === 'url' && (
            <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="url-check-input" className="form-label">{t('scanner.url_label')}</label>
                <input
                  id="url-check-input"
                  type="text"
                  value={urlInput}
                  onChange={(e) => {
                      setUrlInput(e.target.value);
                      if (urlError || isUrlInvalid) {
                          setUrlError("");
                          setIsUrlInvalid(false);
                      }
                  }}
                  className="input-field"
                  style={
                      isUrlInvalid
                          ? { borderColor: "#ff4d4d", boxShadow: "0 0 0 2px rgba(255,77,77,.25)" }
                          : {}
                  }
                  placeholder={t("scanner.url_placeholder")}
                />

                {urlError && (
                    <div
                      role="alert"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "#ff4d4d",
                        fontSize: "0.85rem",
                        background: "rgba(255,77,77,0.1)",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,77,77,0.3)",
                        marginTop: "0.5rem"
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{urlError}</span>
                    </div>
                  )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="phone-check-input" className="form-label">{t('scanner.phone_label')?.replace(' (Optional)', '') || "Sender Phone Number"}</label>
                <input
                  id="phone-check-input"
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="input-field"
                  placeholder={t("scanner.phone_placeholder")}
                />
              </div>

              <button
                onClick={handleScanUrl}
                className="btn-primary"
                disabled={(!urlInput.trim() && !phoneInput.trim()) || isScanning}
                style={{ width: '100%' }}
              >
                {isScanning ? <RefreshCw className="spinning" size={18} /> : <Link size={18} />}
                &nbsp;{isScanning
                    ? t('scanner.searching')
                    : (lang === 'ms' ? 'Imbas & Analisis' : 'Scan & Analyze')}
              </button>
            </div>
          )}

        </div>

        {/* Scanning progress log */}
        {isScanning && (
          <div className="glass-panel fade-in" style={{ padding: '1.5rem 2rem', background: 'rgba(7,10,19,0.9)' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw className="spinning" size={16} color="var(--primary)" />
              {t('scanner.security_check')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {scanSteps.map((step, idx) => (
                <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="fade-in">
                  <span style={{ color: 'var(--primary)' }}>●</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Screen */}
        {scanResult && (
          <div className="glass-panel fade-in" style={{ padding: '2rem', border: `1px solid var(--color-${scanResult.bandColor})` }}>

            {/* Header: Score, Risk level */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className={`badge badge-${scanResult.bandColor}`} style={{ fontSize: isElderlyMode ? '1.15rem' : '0.8rem', padding: '0.4rem 1rem' }}>
                  {scanResult.riskBand}
                </span>
                <h3 style={{ fontSize: isElderlyMode ? '2rem' : '1.75rem', marginTop: '0.5rem', color: '#fff' }}>
                  {t('result.risk_score')}: {scanResult.score}/100
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={speakResult}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isElderlyMode ? '1.1rem' : '0.85rem' }}
                  title={t("scanner.read_aloud")}
                >
                  {isPlayingAudio ? <VolumeX size={18} color="var(--primary)" /> : <Volume2 size={18} color="var(--primary)" />}
                  {isPlayingAudio ? t('scanner.stop_readout') : t('scanner.read_aloud')}
                </button>
              </div>
            </div>

            {/* Explainable evidence indicators (8.3 Explainability) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: isElderlyMode ? '1.3rem' : '1.05rem', color: '#fff', marginBottom: '0.75rem' }}>
                {t('result.evidence_breakdown')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scanResult.explanations.length > 0 ? (
                  scanResult.explanations.map((exp, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255,255,255,0.01)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#fff', fontSize: '0.9rem' }}>⚠️ {exp.label}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('result.weight')}: +{exp.weight}%</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{exp.text}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                    {t('result.no_critical_evidence')}
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Safety Action Guidance */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: isElderlyMode ? '1.3rem' : '1.05rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--primary)" />
                {t('result.safety_guidance')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scanResult.recommendedActions.map((action, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'start',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px'
                    }}
                  >
                    <span style={{ marginTop: '2px', color: 'var(--primary)' }}>
                      •
                    </span>
                    <span style={{
                      fontSize: isElderlyMode ? '1.25rem' : '0.9rem',
                      color: 'var(--text-primary)',
                      lineHeight: '1.4'
                    }}>
                      {action}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* VirusTotal External Scan Results */}
            {(vtLoading || vtResult) && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: isElderlyMode ? '1.3rem' : '1.05rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🔬 {t('vt.title')}
                </h4>

                {vtLoading && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem', background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '10px'
                  }}>
                    <RefreshCw className="spinning" size={16} color="var(--primary)" />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('vt.scanning')}</span>
                  </div>
                )}

                {vtResult && vtResult.status === 'success' && (
                  <div style={{
                    padding: '1.25rem', borderRadius: '10px',
                    background: vtResult.isMalicious ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.08)',
                    border: `1px solid ${vtResult.isMalicious ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.3)'}`,
                    display: 'flex', flexDirection: 'column', gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {vtResult.isMalicious
                          ? <AlertTriangle size={20} color="#ef4444" />
                          : <ShieldCheck size={20} color="#22c55e" />
                        }
                        <strong style={{ color: vtResult.isMalicious ? '#ef4444' : '#22c55e', fontSize: '1rem' }}>
                          {vtResult.isMalicious ? t('vt.malicious') : t('vt.safe')}
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                        {t('vt.powered_by')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>{vtResult.detections}</strong> {t('vt.of')} <strong>{vtResult.total}</strong> {t('vt.detections')}
                    </div>

                    {vtResult.scanDate && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {t('vt.scan_date')}: {new Date(vtResult.scanDate).toLocaleDateString()}
                      </div>
                    )}

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                      URL: {vtResult.url}
                    </div>
                  </div>
                )}

                {vtResult && vtResult.status === 'error' && (
                  <div style={{
                    padding: '1rem', borderRadius: '10px',
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    display: 'flex', alignItems: 'start', gap: '0.75rem'
                  }}>
                    <AlertCircle size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: '#fbbf24', fontSize: '0.9rem' }}>{t('vt.error')}</strong>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{vtResult.reason}</p>
                    </div>
                  </div>
                )}

                {vtResult && vtResult.status === 'rate_limited' && (
                  <div style={{
                    padding: '1rem', borderRadius: '10px',
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    display: 'flex', alignItems: 'start', gap: '0.75rem'
                  }}>
                    <AlertCircle size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: '#fbbf24', fontSize: '0.9rem' }}>{t('vt.rate_limited')}</strong>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{vtResult.reason}</p>
                    </div>
                  </div>
                )}

                {vtResult && vtResult.status === 'skipped' && (
                  <div style={{
                    padding: '1rem', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem', color: 'var(--text-muted)'
                  }}>
                    {t('vt.skipped')} — {vtResult.reason}
                  </div>
                )}

                {vtResult && vtResult.status === 'timeout' && (
                  <div style={{
                    padding: '1rem', borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    fontSize: '0.85rem', color: 'var(--text-secondary)'
                  }}>
                    ⏳ {t('vt.timeout')} — {vtResult.reason}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons (Report scam, check another) */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={openReportFlow}
                className="btn-primary"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, var(--color-high), #b91c1c)',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertTriangle size={18} />
                {t('result.report_scam_btn')}
              </button>
              <button
                onClick={() => { setScanResult(null); setInputText(''); setUrlInput(''); setPhoneInput(''); setQrInput(''); setShowGuardianAlert(false); setVtResult(null); setVtLoading(false);}}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                {t('result.scan_another_btn')}
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Report Redaction Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        scanResult={scanResult}
        originalText={textToReport}
        onSubmitReport={addReport}
      />

      <GuardianAlertModal
        isOpen={showGuardianAlert}
        guardianName={currentUser?.guardian?.name || "Guardian"}
        onClose={() => setShowGuardianAlert(false)}
      />

    </div>
  );
}
