import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, ShieldCheck, Shield, Clipboard, 
  Upload, QrCode, Link, AlertTriangle, 
  Volume2, VolumeX, Phone, CheckSquare, 
  Square, RefreshCw, Send, AlertCircle, Sparkles
} from 'lucide-react';
import { analyzeScamRisk, DEMO_SCREENSHOTS } from '../utils/rulesEngine';
import ReportModal from './ReportModal';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import Tesseract from 'tesseract.js';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function UserChecker({ isElderlyMode, onToggleElderlyMode }) {
  const { reportsList, activeAlert, addReport, blacklist } = useAppContext();
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('text'); // text, screenshot, qr, url
  const [inputText, setInputText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [qrScannerEnabled, setQrScannerEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSteps, setScanSteps] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  
  // OCR Screenshot State
  const [selectedDemoScreenshot, setSelectedDemoScreenshot] = useState('');
  const [customScreenshotName, setCustomScreenshotName] = useState(null);
  
  // Text to Speech
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const speechRef = useRef(null);

  // Report Modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [textToReport, setTextToReport] = useState('');

  // Checklist state
  const [checkedActions, setCheckedActions] = useState({});

  // Reset checked actions on new scan
  useEffect(() => {
    setCheckedActions({});
    stopSpeech();
  }, [scanResult]);

  // Clean speech synthesis and scanner on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // QR Scanner Lifecycle
  useEffect(() => {
    if (activeTab !== 'qr' && qrScannerEnabled) {
      setQrScannerEnabled(false);
    }
  }, [activeTab]);

  useEffect(() => {
    let html5QrcodeScanner = null;
    if (qrScannerEnabled) {
      html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      html5QrcodeScanner.render(
        (decodedText) => {
          setQrInput(decodedText);
          setQrScannerEnabled(false);
          triggerScanAnimation(`Scanned QR Destination: ${decodedText}`, { qrCode: decodedText });
        },
        (error) => {
          // Ignored. html5qrcode throws errors continuously when no QR is found.
        }
      );
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [qrScannerEnabled]);

  const triggerScanAnimation = (finalText, metadata = {}) => {
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
      }, (idx + 1) * 600);
    });

    setTimeout(() => {
      // Find matching reports in global state for duplicate mapping
      let verifiedReportsCount = 0;
      const foundIndicators = [];
      
      // Calculate matches based on global reports list
      if (metadata.qrCode) foundIndicators.push(metadata.qrCode);
      const urlMatches = finalText.match(/(Pos Laju|pos-laju\.info|shopee|maybank|tnb|lhdn)/gi);
      if (urlMatches) {
        verifiedReportsCount = reportsList.filter(r => r.status === 'confirmed').length;
      }

      const res = analyzeScamRisk(finalText, {
        ...metadata,
        verifiedReportsCount: verifiedReportsCount,
        blacklist: blacklist,
        lang: lang
      });
      
      setScanResult(res);
      setIsScanning(false);
    }, steps.length * 650);
  };

  const handleScanText = () => {
    if (!inputText.trim()) return;
    triggerScanAnimation(inputText);
  };

  const handleScanUrl = () => {
    if (!urlInput.trim()) return;
    const combinedText = `Url check request: ${urlInput}. Phone info: ${phoneInput || 'none'}`;
    triggerScanAnimation(combinedText);
  };

  const handleSelectDemoScreenshot = (key) => {
    if (!key) return;
    setSelectedDemoScreenshot(key);
    const demo = DEMO_SCREENSHOTS[key];
    setInputText(demo.extractedText);
    
    // Simulate selection and scanner
    setCustomScreenshotName(demo.name);
    
    const meta = {};
    if (demo.detectedQr) meta.qrCode = demo.detectedQr;
    triggerScanAnimation(demo.extractedText, meta);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCustomScreenshotName(file.name);
    setIsScanning(true);
    setScanSteps([t('common.loading'), t('scanner.step_ocr')]);
    
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setScanSteps([`${t('scanner.step_ocr')} ${Math.round(m.progress * 100)}%`]);
          }
        }
      });
      const extractedText = result.data.text;
      setInputText(extractedText);
      triggerScanAnimation(extractedText);
    } catch (error) {
      console.error("OCR Error:", error);
      triggerScanAnimation("Error extracting text. Please type manually.");
    }
  };

  const handleSimulateQrScanner = () => {
    setQrScannerEnabled(true);
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
    const low = scanResult.riskBand === 'Low evidence' ? t('engine.speech_low') : '';
    const caution = scanResult.riskBand === 'Caution' ? t('engine.speech_caution') : '';
    const high = (scanResult.riskBand === 'High risk' || scanResult.riskBand === 'Critical') ? t('engine.speech_high') : '';
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '900px', margin: '0 auto', padding: '1rem' }} className={isElderlyMode ? 'elderly-mode' : ''}>
      
      {/* Broadcast Campus Alert Banner */}
      {activeAlert && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'start',
          gap: '1rem',
          animation: 'pulse-glow 3s infinite',
        }}>
          <AlertCircle size={28} color="var(--color-high)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-high" style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>{t('scanner.alert_badge')}</span>
              <strong style={{ color: '#fff', fontSize: isElderlyMode ? '1.2rem' : '0.95rem' }}>{t('scanner.alert_title')}</strong>
            </div>
            <p style={{ color: '#fca5a5', marginTop: '0.25rem', fontSize: isElderlyMode ? '1.15rem' : '0.85rem' }}>
              {activeAlert.message}
            </p>
          </div>
        </div>
      )}

      {/* Control Board: Regular vs Elderly mode */}
      <div className="glass-panel" style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles color="var(--primary)" size={22} />
          <div>
            <h3 style={{ fontSize: isElderlyMode ? '1.4rem' : '1.1rem', color: '#fff' }}>{t('scanner.assistant')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t('scanner.assistant_desc')}</p>
          </div>
        </div>
        <button 
          onClick={onToggleElderlyMode} 
          className="btn-secondary"
          style={{ 
            borderColor: isElderlyMode ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
            background: isElderlyMode ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            color: isElderlyMode ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {isElderlyMode ? t('scanner.switch_regular') : t('scanner.switch_elderly')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Input Console */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={24} color="var(--primary)" />
            {t('scanner.title')}
          </h2>

          {/* Form Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto' }}>
            <button 
              onClick={() => { setActiveTab('text'); setScanResult(null); }}
              className={`nav-link ${activeTab === 'text' ? 'active' : ''}`}
              style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
            >
              <Clipboard size={16} /> {t('scanner.text_paste')}
            </button>
            <button 
              onClick={() => { setActiveTab('screenshot'); setScanResult(null); }}
              className={`nav-link ${activeTab === 'screenshot' ? 'active' : ''}`}
              style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
            >
              <Upload size={16} /> {t('scanner.upload_btn')}
            </button>
            <button 
              onClick={() => { setActiveTab('qr'); setScanResult(null); }}
              className={`nav-link ${activeTab === 'qr' ? 'active' : ''}`}
              style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
            >
              <QrCode size={16} /> {t('scanner.qr_btn')}
            </button>
            <button 
              onClick={() => { setActiveTab('url'); setScanResult(null); }}
              className={`nav-link ${activeTab === 'url' ? 'active' : ''}`}
              style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
            >
              <Link size={16} /> {t('scanner.url_btn')}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea 
                className="input-field" 
                rows={isElderlyMode ? 5 : 4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('scanner.placeholder')}
                style={{ resize: 'vertical' }}
              />
              <button 
                onClick={handleScanText}
                className="btn-primary"
                disabled={!inputText.trim() || isScanning}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isScanning ? <RefreshCw className="spinning" size={18} /> : <ShieldAlert size={18} />}
                {isScanning ? t('common.loading') : t('scanner.button')}
              </button>
            </div>
          )}

          {activeTab === 'screenshot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Presets for Demo */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
                  {t('scanner.demo_select')}
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <button 
                    type="button"
                    onClick={() => handleSelectDemoScreenshot('pos_laju_scam')}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', textAlign: 'left' }}
                  >
                    {t('scanner.demo_courier')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSelectDemoScreenshot('shopee_job_scam')}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', textAlign: 'left' }}
                  >
                    {t('scanner.demo_job')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSelectDemoScreenshot('family_emergency')}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', textAlign: 'left' }}
                  >
                    {t('scanner.demo_emergency')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSelectDemoScreenshot('legitimate_tnb')}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', textAlign: 'left' }}
                  >
                    {t('scanner.demo_legit')}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '2rem', background: 'rgba(255,255,255,0.01)', cursor: 'pointer', position: 'relative' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={32} color="var(--primary)" />
                  <p style={{ fontWeight: 500 }}>{t('scanner.upload_title')}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('scanner.upload_desc')}</p>
                </div>
              </div>

              {customScreenshotName && (
                <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#fff' }}>📁 {t('scanner.loaded')} {customScreenshotName}</span>
                  <button onClick={() => { setCustomScreenshotName(null); setInputText(''); setScanResult(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>{t('scanner.clear')}</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'qr' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                minHeight: '180px',
                background: '#090d16',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                {qrScannerEnabled ? (
                  <div id="qr-reader" style={{ width: '100%', minHeight: '300px' }}></div>
                ) : (
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem' }}>
                    <QrCode size={40} color="var(--primary)" />
                    <button onClick={handleSimulateQrScanner} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                      {t('scanner.open_camera')}
                    </button>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('scanner.paste_qr')}</label>
                <input 
                  type="text" 
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="input-field" 
                  placeholder="e.g., https://pos-laju.info/pay-fee/2.50"
                />
                <button 
                  onClick={() => triggerScanAnimation(`Manual QR redirect code: ${qrInput}`, { qrCode: qrInput })}
                  className="btn-secondary"
                  disabled={!qrInput.trim()}
                  style={{ width: '100%' }}
                >
                  {t('scanner.verify_qr')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('scanner.url_label')}</label>
                <input 
                  type="text" 
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="input-field" 
                  placeholder="e.g. maybank-secure-login.xyz or pos-laju.info"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('scanner.phone_label')}</label>
                <input 
                  type="text" 
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="input-field" 
                  placeholder="e.g. +6011-8762512"
                />
              </div>

              <button 
                onClick={handleScanUrl}
                className="btn-primary"
                disabled={!urlInput.trim() || isScanning}
                style={{ width: '100%' }}
              >
                {isScanning ? <RefreshCw className="spinning" size={18} /> : <Link size={18} />}
                &nbsp;{isScanning ? t('scanner.searching') : t('scanner.scan_url_btn')}
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
                  title="Read result out loud"
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
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{exp.text}</p>
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
                onClick={() => { setScanResult(null); setInputText(''); setUrlInput(''); setPhoneInput(''); setQrInput(''); setSelectedDemoScreenshot(''); setCustomScreenshotName(null); }}
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
        originalText={inputText || urlInput || qrInput}
        onSubmitReport={addReport}
      />

    </div>
  );
}
