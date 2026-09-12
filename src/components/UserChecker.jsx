import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert, ShieldCheck, Shield, Clipboard,
  Link, AlertTriangle,
  Volume2, VolumeX, Phone, CheckSquare,
  Square, RefreshCw, Send, AlertCircle, Sparkles,
  UploadCloud, X, CreditCard, User
} from 'lucide-react';
import {
  analyzeScamRisk,
  findMatchingVerifiedReports,
  analyzeScreenshotRisk,
} from '../utils/rulesEngine';
import { checkUrlWithVirusTotal, checkDomainExists } from '../utils/virusTotal';
import { QUICK_TEST_PRESETS } from '../content/educationalContent';
import ReportModal from './ReportModal';
import GuardianAlertModal from "../components/Guardian/GuardianAlertModal";
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useScrollToTop } from '../utils/useScrollToTop';

export default function UserChecker({ userMode = 'normal', isElderlyMode = false, isKidMode = false, isGuest = false, onRegister, onSetUserMode }) {
  const { reportsList, activeAlert, addReport, blacklist, currentUser } = useAppContext();
  const { t, lang } = useLanguage();
  const lastScanRef = useRef(null);
  const [activeTab, setActiveTab] = useState('text'); // text, url, screenshot
  useScrollToTop(activeTab);
  const [inputText, setInputText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isUrlInvalid, setIsUrlInvalid] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [bankInput, setBankInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanSteps, setScanSteps] = useState([]);
  const [scanResult, setScanResult] = useState(null);

  // Multimodal Screenshot & Image Paste State
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  // [N-4] Dedicated screenshot dropzone file input ref
  const screenshotDropzoneRef = useRef(null);

  // [N-4] OCR Extracted Text editor state
  const [showOcrEditor, setShowOcrEditor] = useState(false);
  const [ocrEditText, setOcrEditText] = useState('');

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

  // Emergency Assistance Popup state
  const [showEmergencyPopup, setShowEmergencyPopup] = useState(false);

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
      if (lastScanRef.current?.imageToScan) {
        const res = await analyzeScreenshotRisk(
          lastScanRef.current.imageToScan.fileBase64,
          {
            ...lastScanRef.current.metadata,
            userText: lastScanRef.current.text,
            blacklist,
            reports: reportsList,
            lang
          }
        );
        setScanResult(res);
      } else {
        const res = await analyzeScamRisk(
          lastScanRef.current.text,
          {
            ...lastScanRef.current.metadata,
            blacklist,
            reports: reportsList,
            lang
          }
        );
        setScanResult(res);
      }
    };

    rerun();
  }, [lang, blacklist, reportsList]);

  // Clean speech synthesis and scanner on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Image & Clipboard Handlers
  const processImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage({
        fileBase64: event.target.result,
        fileName: file.name || 'clipboard-screenshot.png',
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) processImageFile(file);
        return;
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const triggerScanAnimation = (finalText, metadata = {}, imageToScan = selectedImage) => {
    lastScanRef.current = {
      text: finalText,
      metadata,
      imageToScan
    };

    setIsScanning(true);
    setScanResult(null);
    setShowEmergencyPopup(false);
    setScanSteps([]);

    const steps = imageToScan
      ? [
          lang === 'ms' ? 'Memuatkan tangkapan skrin ke Analisis Penglihatan AI Gemini...' : 'Uploading screenshot to Gemini AI Vision...',
          lang === 'ms' ? 'Mengekstrak teks & tanda amaran visual...' : 'Extracting OCR text & visual anomalies...',
          t('scanner.step_ccid'),
          t('scanner.step_numverify'),
          t('scanner.step_match'),
          t('scanner.step_score')
        ]
      : (metadata?.isTargetCheck
          ? [
              lang === 'ms' ? 'Menyemak pangkalan data SemakMule PDRM...' : 'Querying PDRM SemakMule CCID database...',
              lang === 'ms' ? 'Membandingkan senarai hitam Scam Away rasmi...' : 'Cross-referencing Scam Away verified blacklist...',
              lang === 'ms' ? 'Mengesahkan reputasi & keselamatan rekod...' : 'Validating security reputation & integrity...',
              t('scanner.step_score')
            ]

          : [
              t('scanner.step_extract'),
              t('scanner.step_ccid'),
              t('scanner.step_numverify'),
              t('scanner.step_parse'),
              t('scanner.step_match'),
              t('scanner.step_db'),
              t('scanner.step_score')
            ]);


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

      let res;
      if (imageToScan) {
        res = await analyzeScreenshotRisk(imageToScan.fileBase64, {
          ...metadata,
          userText: finalText,
          matchedVerifiedReports,
          blacklist,
          lang
        });
        // Populate extracted text into input box if empty
        if (res.visionForensics?.extractedText && !inputText.trim()) {
          setInputText(res.visionForensics.extractedText);
        }
        // [N-4] Populate OCR editor with extracted text
        if (res.visionForensics?.extractedText) {
          setOcrEditText(res.visionForensics.extractedText);
          setShowOcrEditor(false); // collapsed by default, user opens it
        }
      } else {
        res = await analyzeScamRisk(finalText, {
          ...metadata,
          matchedVerifiedReports,
          blacklist,
          lang
        });
      }

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

      if (res.score >= 80) {
        setShowEmergencyPopup(true);
      }

      if (
        (res.bandColor === "high" || res.bandColor === "critical") &&
        (isKidMode || isElderlyMode)
      ) {
        setShowGuardianAlert(true);
      }

      setIsScanning(false);
    }, steps.length * 150 + 200);
  };

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    setScanResult(null);
    setShowEmergencyPopup(false);
    setScanSteps([]);
    setIsScanning(false);
    setSelectedImage(null);
    lastScanRef.current = null;
    setUrlError('');
    setIsUrlInvalid(false);
    setVtResult(null);
    setVtLoading(false);
    setBankInput('');
    // [N-4] Reset OCR editor
    setOcrEditText('');
    setShowOcrEditor(false);
    stopSpeech();
  };

  const handleScanText = () => {
    if (!inputText.trim() && !selectedImage) return;
    triggerScanAnimation(inputText || (lang === 'ms' ? 'Imbasan Tangkapan Skrin' : 'Screenshot Incident Scan'));
  };

  // [N-4] Dedicated screenshot scan handler (uses selected image with optional user text context)
  const handleScanScreenshot = () => {
    if (!selectedImage) return;
    triggerScanAnimation(inputText || (lang === 'ms' ? 'Imbasan Tangkapan Skrin' : 'Screenshot Incident Scan'));
  };

  // [N-4] Re-scan using edited OCR text
  const handleOcrRescan = () => {
    if (!ocrEditText.trim()) return;
    setInputText(ocrEditText);
    handleTabChange('text');
    setTimeout(() => {
      triggerScanAnimation(ocrEditText, {}, null);
    }, 50);
  };

  const handleQuickTest = (preset) => {
    handleTabChange('text');
    setInputText(preset.text);
  };

  const handleScanTarget = async () => {
    const rawUrl = urlInput.trim();
    const rawPhone = phoneInput.trim();
    const rawBank = bankInput.trim();

    if (!rawUrl && !rawPhone && !rawBank) {
      setUrlError(t("scanner.empty_target_error") || "Please enter at least a website address, phone number, or bank account number.");
      setIsUrlInvalid(true);
      setScanResult(null);
      return;
    }

    // If no URL is provided, scan phone and/or bank account directly without DNS check
    if (!rawUrl) {
      let targetText = "Target check request:";
      if (rawBank) targetText += ` Bank account: ${rawBank}.`;
      if (rawPhone) targetText += ` Phone info: ${rawPhone}.`;
      triggerScanAnimation(targetText, {
        isTargetCheck: true,
        targets: { bank: rawBank, phone: rawPhone, url: null }
      }, null);
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

    let combinedText = `Target check request: ${formatted}.`;
    if (rawPhone) combinedText += ` Phone info: ${rawPhone}.`;
    if (rawBank) combinedText += ` Bank account: ${rawBank}.`;
    triggerScanAnimation(combinedText, {
      isTargetCheck: true,
      targets: { bank: rawBank, phone: rawPhone, url: formatted }
    }, null);
  };


  const handleScanUrl = handleScanTarget;



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
      
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;
      if (lang === 'ms') {
        // Try to find Malay, then fallback to Indonesian which sounds similar, otherwise just set lang
        selectedVoice = voices.find(v => v.lang === 'ms-MY') || 
                        voices.find(v => v.lang.startsWith('ms')) || 
                        voices.find(v => v.lang.startsWith('id'));
        utterance.lang = selectedVoice ? selectedVoice.lang : 'ms-MY';
      } else {
        selectedVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
        utterance.lang = selectedVoice ? selectedVoice.lang : 'en-US';
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
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
                    {t('trends.last_updated')}{" "}
                    {new Date(activeAlert.timestamp).toLocaleDateString(
                      lang === "ms" ? "ms-MY" : "en-US",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
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
              onClick={() => handleTabChange('text')}
              className={`nav-link scanner-method-tab ${activeTab === 'text' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'text'}
              style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
            >
              <Clipboard size={16} /> {t('scanner.text_paste')}
            </button>

            <button
              onClick={() => handleTabChange('url')}
              className={`nav-link scanner-method-tab ${activeTab === 'url' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'url'}
              style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
            >
              <CreditCard size={16} /> {t('scanner.url_btn')}
            </button>

            {/* [N-4] Screenshot Analysis tab */}
            <button
              onClick={() => handleTabChange('screenshot')}
              className={`nav-link scanner-method-tab ${activeTab === 'screenshot' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'screenshot'}
              style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
            >
              <UploadCloud size={16} /> {t('scanner.tab_screenshot')}
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label className="form-label" htmlFor="scam-message-input" style={{ margin: 0 }}>
                  {lang === 'ms' ? 'Mesej, tangkapan skrin, atau konteks untuk diperiksa' : 'Message, screenshot, or context to check'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    title={lang === 'ms' ? 'Pilih fail gambar dari peranti anda' : 'Select image file from your device'}
                  >
                    <UploadCloud size={15} />
                    {lang === 'ms' ? 'Muat Naik Imej' : 'Upload Image'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) processImageFile(e.target.files[0]);
                      e.target.value = '';
                    }}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {selectedImage && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem'
                }}>
                  <img
                    src={selectedImage.fileBase64}
                    alt="Attached screenshot preview"
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📷 {selectedImage.fileName}
                    </div>
                    <div style={{ color: '#93c5fd', fontSize: '0.75rem' }}>
                      {lang === 'ms' ? 'Tangkapan skrin dikesan (Ctrl+V) • Sedia untuk analisis visual AI' : 'Screenshot attached (Ctrl+V) • Ready for AI vision analysis'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="btn-secondary"
                    style={{ padding: '0.3rem 0.5rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center' }}
                    title={lang === 'ms' ? 'Buang imej' : 'Remove image'}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <textarea
                id="scam-message-input"
                className="input-field"
                rows={isElderlyMode ? 5 : 4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPaste={handlePaste}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                placeholder={lang === 'ms'
                  ? 'Taip, tampal teks, atau tampal tangkapan skrin (Ctrl+V) di sini...'
                  : 'Type, paste text, or paste a screenshot (Ctrl+V) here...'}
                aria-describedby="scam-message-hint"
                maxLength={10000}
                style={{
                  resize: 'vertical',
                  borderColor: isDragOver ? 'var(--primary)' : undefined,
                  boxShadow: isDragOver ? '0 0 10px rgba(59, 130, 246, 0.4)' : undefined,
                  transition: 'all 0.2s ease'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span id="scam-message-hint" className="form-hint" style={{ flex: 1 }}>
                  {lang === 'ms'
                    ? 'Petua: Anda boleh tekan Ctrl+V untuk menampal gambar tangkapan skrin terus ke dalam kotak ini.'
                    : 'Tip: You can press Ctrl+V to paste a screenshot directly into this box.'}
                </span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: inputText.length >= 9500 ? '#ef4444' : (inputText.length >= 8000 ? '#f59e0b' : 'var(--text-muted)'),
                  textAlign: 'right',
                  marginTop: '0.25rem' 
                }}>
                  {inputText.length.toLocaleString()}/10,000
                </span>
              </div>
              <button
                onClick={handleScanText}
                className="btn-primary scan-primary-action"
                disabled={(!inputText.trim() && !selectedImage) || isScanning}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isScanning ? <RefreshCw className="spinning" size={18} /> : <ShieldAlert size={18} />}
                {isScanning ? t('common.loading') : (selectedImage ? (lang === 'ms' ? 'Imbas Imej & Analisis' : 'Scan Image & Analyze') : t('scanner.button'))}
              </button>
            </div>
          )}

          {activeTab === 'url' && (
            <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Bank Account Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="bank-check-input" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CreditCard size={15} color="var(--primary)" />
                  {t('scanner.bank_label') || "Bank Account Number (Optional)"}
                </label>
                <input
                  id="bank-check-input"
                  type="text"
                  value={bankInput}
                  onChange={(e) => {
                    setBankInput(e.target.value);
                    if (urlError || isUrlInvalid) {
                      setUrlError("");
                      setIsUrlInvalid(false);
                    }
                  }}
                  className="input-field"
                  placeholder={t("scanner.bank_placeholder") || "e.g. 1234567890 (Maybank, CIMB, etc.)"}
                />
              </div>

              {/* Phone Number Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="phone-check-input" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={15} color="var(--primary)" />
                  {t('scanner.phone_label') || "Sender Phone Number (Optional)"}
                </label>
                <input
                  id="phone-check-input"
                  type="text"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    if (urlError || isUrlInvalid) {
                      setUrlError("");
                      setIsUrlInvalid(false);
                    }
                  }}
                  className="input-field"
                  placeholder={t("scanner.phone_placeholder")}
                />
              </div>

              {/* Website URL Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="url-check-input" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Link size={15} color="var(--primary)" />
                  {t('scanner.url_label') || "URL / Web Address (Optional)"}
                </label>
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

              <button
                onClick={handleScanTarget}
                className="btn-primary"
                disabled={(!urlInput.trim() && !phoneInput.trim() && !bankInput.trim()) || isScanning}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isScanning ? <RefreshCw className="spinning" size={18} /> : <ShieldAlert size={18} />}
                {isScanning
                  ? t('scanner.searching')
                  : (t('scanner.scan_target_btn') || (lang === 'ms' ? 'Imbas & Analisis' : 'Scan & Analyze'))}
              </button>
            </div>
          )}

          {/* [N-4] Screenshot Analysis tab content — Drag & Drop dropzone */}
          {activeTab === 'screenshot' && (
            <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer?.files?.[0];
                  if (file && file.type.startsWith('image/')) processImageFile(file);
                }}
                onClick={() => screenshotDropzoneRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label={t('scanner.dropzone_title')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') screenshotDropzoneRef.current?.click(); }}
                style={{
                  border: `2px dashed ${isDragOver ? 'var(--primary)' : 'rgba(99, 102, 241, 0.4)'}`,
                  borderRadius: '14px',
                  background: isDragOver
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'rgba(255, 255, 255, 0.02)',
                  padding: '2.5rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isDragOver ? '0 0 18px rgba(59, 130, 246, 0.25)' : 'none',
                }}
              >
                <UploadCloud size={40} color={isDragOver ? 'var(--primary)' : 'rgba(99,102,241,0.7)'} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: isElderlyMode ? '1.2rem' : '1rem' }}>
                    {t('scanner.dropzone_title')}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {t('scanner.dropzone_subtitle')}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {t('scanner.dropzone_hint')}
                  </p>
                </div>
                <input
                  ref={screenshotDropzoneRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) processImageFile(e.target.files[0]);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Image preview once uploaded */}
              {selectedImage && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                }}>
                  <img
                    src={selectedImage.fileBase64}
                    alt="Screenshot preview"
                    style={{
                      width: '64px',
                      height: '64px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📷 {selectedImage.fileName}
                    </div>
                    <div style={{ color: '#93c5fd', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                      {lang === 'ms' ? 'Sedia untuk analisis AI visual Gemini' : 'Ready for Gemini AI visual analysis'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                    className="btn-secondary"
                    style={{ padding: '0.3rem 0.5rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                    title={lang === 'ms' ? 'Buang imej' : 'Remove image'}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Optional context message */}
              <div>
                <label className="form-label" htmlFor="screenshot-context-input" style={{ marginBottom: '0.4rem', display: 'block' }}>
                  {lang === 'ms' ? 'Konteks tambahan (pilihan)' : 'Additional context (optional)'}
                </label>
                <textarea
                  id="screenshot-context-input"
                  className="input-field"
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={lang === 'ms'
                    ? 'Terangkan situasi scam atau tambah maklumat konteks...'
                    : 'Describe the scam situation or add context...'}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                onClick={handleScanScreenshot}
                className="btn-primary scan-primary-action"
                disabled={!selectedImage || isScanning}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isScanning ? <RefreshCw className="spinning" size={18} /> : <ShieldAlert size={18} />}
                {isScanning
                  ? t('common.loading')
                  : (lang === 'ms' ? '🔍 Imbas Tangkapan Skrin & Analisis' : '🔍 Scan Screenshot & Analyze')}
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
                {/* [N-2] For score < 35, override the badge label with responsible zero-day framing */}
                <span className={`badge badge-${scanResult.bandColor}`} style={{ fontSize: isElderlyMode ? '1.15rem' : '0.8rem', padding: '0.4rem 1rem' }}>
                  {scanResult.score < 35 ? t('result.zero_day_safe') : scanResult.riskBand}
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

            {/* Multimodal Visual Forensic Card */}
            {scanResult.visionForensics && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.07)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: isElderlyMode ? '1.3rem' : '1.05rem', color: '#60a5fa', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🔍 {lang === 'ms' ? 'Analisis Forensik Visual (Gemini Vision)' : 'Visual Forensics Analysis (Gemini Vision)'}
                  </h4>
                  {selectedImage && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      📷 {selectedImage.fileName}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.35rem 0.65rem', borderRadius: '6px' }}>
                    <strong style={{ color: '#fff' }}>{lang === 'ms' ? 'Platform:' : 'Platform:'}</strong>{' '}
                    <span style={{ color: 'var(--primary)' }}>{scanResult.visionForensics.platform || 'Unknown'}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.35rem 0.65rem', borderRadius: '6px' }}>
                    <strong style={{ color: '#fff' }}>{lang === 'ms' ? 'Pengirim:' : 'Sender:'}</strong>{' '}
                    <span style={{ color: '#fff' }}>{scanResult.visionForensics.sender || 'Unknown'}</span>
                  </div>
                  {scanResult.visionForensics.senderIsOverseas && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#f87171', fontWeight: 600 }}>
                      ⚠️ {lang === 'ms' ? 'Pengirim Luar Negara Dikesan' : 'Overseas Sender Detected'}
                    </div>
                  )}
                </div>

                {scanResult.visionForensics.visualRedFlags?.length > 0 && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <strong style={{ color: '#fbbf24', fontSize: '0.85rem' }}>🚩 {lang === 'ms' ? 'Tanda Amaran Visual / Logo Tiruan:' : 'Visual Red Flags / Forged Seals:'}</strong>
                    <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {scanResult.visionForensics.visualRedFlags.map((flag, i) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {scanResult.visionForensics.explanation && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {scanResult.visionForensics.explanation}
                  </p>
                )}

                {/* [N-4] Enhanced Extracted Text Review with editable textarea and re-scan */}
                {scanResult.visionForensics.extractedText && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOcrEditor(prev => !prev);
                        if (!showOcrEditor) setOcrEditText(scanResult.visionForensics.extractedText);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--primary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.25rem 0',
                      }}
                      aria-expanded={showOcrEditor}
                    >
                      {showOcrEditor ? '▲' : '▼'}{' '}
                      📝 {t('scanner.extracted_text_label')}
                    </button>
                    {showOcrEditor && (
                      <div style={{
                        marginTop: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {t('scanner.extracted_text_hint')}
                        </p>
                        <textarea
                          value={ocrEditText}
                          onChange={(e) => setOcrEditText(e.target.value)}
                          className="input-field"
                          rows={5}
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            resize: 'vertical',
                            background: 'rgba(0, 0, 0, 0.3)',
                          }}
                          aria-label={t('scanner.extracted_text_label')}
                        />
                        <button
                          onClick={handleOcrRescan}
                          className="btn-secondary"
                          disabled={!ocrEditText.trim() || isScanning}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'var(--primary)',
                            borderColor: 'rgba(99, 102, 241, 0.4)',
                            alignSelf: 'flex-start',
                          }}
                        >
                          {t('scanner.edit_rescan_btn')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* [N-2] Zero-Day Safety Framing: Disclaimer card for low risk scores */}
            {scanResult.score < 35 && (
              <div
                role="region"
                aria-label="Zero-Day Safety Advisory"
                style={{
                  background: 'rgba(16, 185, 129, 0.07)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ShieldCheck size={22} color="#10b981" />
                  <strong style={{ color: '#a7f3d0', fontSize: isElderlyMode ? '1.25rem' : '1rem' }}>
                    {t('result.zero_day_safe')}
                  </strong>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: isElderlyMode ? '1.05rem' : '0.88rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                }}>
                  ⚠️ {t('result.zero_day_disclaimer')}
                </p>
                {/* 1-tap Officer Second Opinion button */}
                <button
                  onClick={() => {
                    setTextToReport(inputText || urlInput || (lang === 'ms'
                      ? `Pengguna masih ragu-ragu walaupun skor risiko adalah ${scanResult.score}/100. Mohon pandangan kedua pegawai.`
                      : `User is still suspicious despite low risk score of ${scanResult.score}/100. Requesting officer second opinion.`));
                    setIsReportOpen(true);
                  }}
                  className="btn-secondary"
                  style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: isElderlyMode ? '1.05rem' : '0.85rem',
                    fontWeight: 600,
                    color: '#34d399',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    padding: '0.5rem 1rem',
                  }}
                >
                  <ShieldAlert size={16} />
                  {t('result.second_opinion_btn')}
                </button>
              </div>
            )}



            {/* Explainable evidence indicators (8.3 Explainability) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: isElderlyMode ? '1.3rem' : '1.05rem', color: '#fff', marginBottom: '0.75rem' }}>
                {t('result.evidence_breakdown')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scanResult.explanations.length > 0 ? (
                  scanResult.explanations.map((exp, idx) => {
                    const isSafe = exp.category === 'safe' || exp.weight === 0;
                    const isAdvisory = exp.category === 'safe_advisory';
                    const isCaution = exp.category === 'caution' || exp.category === 'verification' || (exp.weight > 0 && exp.weight < 40);
                    const icon = isSafe ? '✅' : (isAdvisory ? 'ℹ️' : (isCaution ? '⚠️' : '🚨'));
                    
                    const cardBg = isSafe
                      ? 'rgba(16, 185, 129, 0.05)'
                      : (isAdvisory ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.01)');
                    const cardBorder = isSafe
                      ? '1px solid rgba(16, 185, 129, 0.25)'
                      : (isAdvisory ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid var(--border-color)');

                    return (
                      <div key={idx} style={{
                        background: cardBg,
                        padding: '1rem',
                        borderRadius: '8px',
                        border: cardBorder,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <strong style={{
                            color: isSafe ? '#a7f3d0' : (isAdvisory ? '#93c5fd' : '#fff'),
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}>
                            <span>{icon}</span> {exp.label}
                          </strong>
                          {isSafe ? (
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#10b981',
                              fontWeight: 600,
                              background: 'rgba(16, 185, 129, 0.1)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px'
                            }}>
                              {t('result.status_clean') || (lang === 'ms' ? 'Status: Bersih' : 'Status: Clean')}
                            </span>
                          ) : (isAdvisory ? (
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#60a5fa',
                              fontWeight: 600,
                              background: 'rgba(59, 130, 246, 0.1)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px'
                            }}>
                              {t('result.status_advisory') || (lang === 'ms' ? 'Notis Nasihat' : 'Advisory Notice')}
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '0.75rem',
                              color: exp.weight >= 40 ? '#ef4444' : '#f59e0b',
                              fontWeight: 500
                            }}>
                              {t('result.weight')}: +{exp.weight || 0}%
                            </span>
                          ))}
                        </div>
                        <p style={{
                          fontSize: '0.85rem',
                          color: isSafe || isAdvisory ? 'var(--text-primary)' : 'var(--text-secondary)',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.45',
                          marginTop: '0.25rem'
                        }}>
                          {exp.text}
                        </p>
                      </div>
                    );
                  })
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

            {/* CCID Results Display */}
            {scanResult.ccidMatches && (scanResult.ccidMatches.phones.length > 0 || scanResult.ccidMatches.bankAccounts.length > 0) && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: isElderlyMode ? '1.3rem' : '1.05rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🚨 {t('scanner.ccid_title')}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {scanResult.ccidMatches.phones.map((match, idx) => (
                    <div key={`ccid-phone-${idx}`} style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      padding: '1rem',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#ef4444', fontSize: '0.9rem' }}>{t('scanner.ccid_phone_match')}: {match.number}</strong>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
                        {t('scanner.ccid_report_count')}: {match.reportCount} | {t('scanner.ccid_category')}: {match.category}
                      </p>
                    </div>
                  ))}
                  {scanResult.ccidMatches.bankAccounts.map((match, idx) => (
                    <div key={`ccid-bank-${idx}`} style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      padding: '1rem',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#ef4444', fontSize: '0.9rem' }}>{t('scanner.ccid_bank_match')}: {match.account}</strong>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
                        {t('scanner.ccid_bank')}: {match.bank} | {t('scanner.ccid_report_count')}: {match.reportCount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Numverify Results Display */}
            {scanResult.numverifyResults && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: isElderlyMode ? '1.3rem' : '1.05rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📞 {t('scanner.numverify_title')}
                </h4>
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  padding: '1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('scanner.numverify_line_type')}:</span>
                    <strong style={{ fontSize: '0.85rem', color: scanResult.numverifyResults.lineType?.toLowerCase() === 'voip' ? '#fbbf24' : '#fff' }}>
                      {scanResult.numverifyResults.lineType || 'Unknown'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('scanner.numverify_carrier')}:</span>
                    <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{scanResult.numverifyResults.carrier || 'Unknown'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('scanner.numverify_valid')}:</span>
                    <strong style={{ color: scanResult.numverifyResults.valid ? '#22c55e' : '#ef4444', fontSize: '0.85rem' }}>
                      {scanResult.numverifyResults.valid ? t('scanner.numverify_yes') : t('scanner.numverify_no')}
                    </strong>
                  </div>
                </div>
              </div>
            )}

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
                onClick={() => { setScanResult(null); setInputText(''); setUrlInput(''); setPhoneInput(''); setShowGuardianAlert(false); setShowEmergencyPopup(false); setVtResult(null); setVtLoading(false); setOcrEditText(''); setShowOcrEditor(false); }}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                {t('result.scan_another_btn')}
              </button>
            </div>

            {/* Post-Scan Conversion Hook CTA for Guest Mode (Shown ONLY when threat is detected) */}
            {isGuest && (scanResult.score >= 30 || scanResult.bandColor !== 'low') && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontWeight: 700, fontSize: '1rem' }}>
                  <Sparkles size={20} />
                  <span>{lang === 'ms' ? 'Simpan Laporan Ini Sebagai Bukti Polis' : 'Save Report for Police Evidence'}</span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.4, maxWidth: '480px' }}>
                  {lang === 'ms'
                    ? 'Cipta akaun rakyat percuma untuk menyimpan laporan ini bagi bukti polis'
                    : 'Create free citizen account to save this report for police evidence'}
                </p>
                <button
                  onClick={() => onRegister && onRegister()}
                  className="btn-primary"
                  style={{
                    marginTop: '0.25rem',
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  <User size={16} />
                  {lang === 'ms' ? 'Cipta akaun rakyat percuma' : 'Create free citizen account'}
                </button>
              </div>
            )}

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

      {/* Immediate Emergency Assistance Popup */}
      {showEmergencyPopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-popup-title"
          aria-describedby="emergency-popup-desc"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div
            className="glass-panel fade-in"
            style={{
              width: "100%",
              maxWidth: "480px",
              padding: isElderlyMode ? "2rem" : "1.5rem",
              borderRadius: "20px",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              background: "rgba(18, 10, 15, 0.95)",
              boxShadow: "0 0 30px rgba(239, 68, 68, 0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={28} color="#ef4444" />
              </div>
              <h2
                id="emergency-popup-title"
                style={{
                  margin: 0,
                  fontSize: isElderlyMode ? "1.6rem" : "1.35rem",
                  fontWeight: 800,
                  color: "#ff4d4d",
                  lineHeight: 1.2,
                }}
              >
                🚨 High Risk Detected
              </h2>
            </div>

            <p
              id="emergency-popup-desc"
              style={{
                margin: 0,
                fontSize: isElderlyMode ? "1.25rem" : "0.95rem",
                color: "var(--text-primary)",
                lineHeight: 1.5,
              }}
            >
              If you have transferred money or shared banking information, contact your bank immediately or call the National Scam Response Centre (NSRC) at 997.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
              <a
                href="tel:997"
                className="btn-primary"
                aria-label="Call NSRC 997"
                style={{
                  width: "100%",
                  textAlign: "center",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                  color: "#fff",
                  fontSize: isElderlyMode ? "1.25rem" : "1rem",
                  fontWeight: 700,
                  padding: isElderlyMode ? "0.9rem 1.25rem" : "0.75rem 1rem",
                  borderRadius: "10px",
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                }}
              >
                <Phone size={20} />
                Call NSRC 997
              </a>

              <button
                type="button"
                onClick={() => setShowEmergencyPopup(false)}
                className="btn-secondary"
                aria-label="I haven't transferred money"
                style={{
                  width: "100%",
                  fontSize: isElderlyMode ? "1.15rem" : "0.9rem",
                  padding: isElderlyMode ? "0.8rem 1.25rem" : "0.65rem 1rem",
                  borderRadius: "10px",
                  color: "var(--text-secondary)",
                }}
              >
                I haven't transferred money
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
