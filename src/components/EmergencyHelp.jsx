import React, { useState, useRef } from 'react';
import { 
  AlertTriangle, Phone, ExternalLink, ArrowLeft, X, 
  ShieldAlert, Building2, FileText, CheckCircle2, ChevronRight, PhoneCall
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { emergencyAgencies, officialBankEmergencyPages } from '../data/emergencyContacts';
import { useScrollToTop } from '../utils/useScrollToTop';

export default function EmergencyHelp() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState('options'); // 'options' | 'guide_money' | 'guide_otp' | 'guide_link' | 'guide_apk' | 'guide_call' | 'guide_msg' | 'banks' | 'contacts'
  const modalContentRef = useRef(null);
  useScrollToTop(activeView, modalContentRef);

  const handleOpen = () => {
    setIsOpen(true);
    setActiveView('options');
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveView('options');
  };

  return (
    <>
      {/* 🔴 FIXED FLOATING ACTION BUTTON */}
      <button
        onClick={handleOpen}
        aria-label={t('emergency.btn_label')}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.4rem',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '50px',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4), 0 0 0 4px rgba(239, 68, 68, 0.15)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.95rem',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), boxShadow 0.2s ease',
        }}
        className="emergency-float-btn"
      >
        <ShieldAlert size={22} className="animate-pulse" />
        <span>{t('emergency.btn_label')}</span>
      </button>

      {/* MODAL BACKDROP & BOTTOM SHEET */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0'
          }}
          onClick={handleClose}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              background: 'rgba(15, 23, 42, 0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderBottom: 'none',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -16px 48px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* MODAL HEADER */}
            <div style={{ padding: '1.00rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {t('emergency.modal_title')}
                </h3>
              </div>
              <button 
                onClick={handleClose}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY CONTENT */}
            <div ref={modalContentRef} style={{ padding: '1.00rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* BACK BUTTON (IF IN DETAILED VIEW) */}
              {activeView !== 'options' && (
                <button
                  onClick={() => setActiveView('options')}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--primary)',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <ArrowLeft size={16} />
                  {t('emergency.back')}
                </button>
              )}

              {/* VIEW 1: OPTIONS MENU */}
              {activeView === 'options' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.80rem' }}>
                  <p style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                    {t('emergency.modal_subtitle')}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.60rem' }}>
                    
                    {/* Scenario 1: Money */}
                    <button 
                      onClick={() => setActiveView('guide_money')}
                      style={optionStyle}
                    >
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{t('emergency.opt_money')}</span>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </button>

                    {/* Scenario 2: OTP */}
                    <button 
                      onClick={() => setActiveView('guide_otp')}
                      style={optionStyle}
                    >
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{t('emergency.opt_otp')}</span>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </button>

                    {/* Scenario 3: Link */}
                    <button 
                      onClick={() => setActiveView('guide_link')}
                      style={optionStyle}
                    >
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{t('emergency.opt_link')}</span>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </button>

                    {/* Scenario 4: APK (NEW) */}
                    <button 
                      onClick={() => setActiveView('guide_apk')}
                      style={optionStyle}
                    >
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{t('emergency.opt_apk')}</span>
                      <ChevronRight size={18} color="var(--primary)" />
                    </button>

                    {/* Scenario 5: Call */}
                    <button 
                      onClick={() => setActiveView('guide_call')}
                      style={optionStyle}
                    >
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{t('emergency.opt_call')}</span>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </button>

                    {/* Scenario 6: Message */}
                    <button 
                      onClick={() => setActiveView('guide_msg')}
                      style={optionStyle}
                    >
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{t('emergency.opt_msg')}</span>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </button>

                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />

                    <div style={{ marginTop: '0.10rem', marginBottom: '0.25rem' }}>
                      <p
                        style={{
                          fontSize: "0.95rem",
                          color: "#cbd5e1",
                          margin: 0,
                          fontWeight: 500,
                          lineHeight: 1.4,
                        }}
                      >
                        📞 <strong>{t("emergency.need_help")}</strong>
                        <br />
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {t("emergency.need_help_desc")}
                        </span>
                      </p>
                    </div>

                    {/* Directory 1: Banks */}
                    <button 
                      onClick={() => setActiveView('banks')}
                      style={{ ...optionStyle, borderLeft: '4px solid var(--primary)', background: 'rgba(6, 182, 212, 0.08)' }}
                    >
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#e0f2fe' }}>{t('emergency.opt_banks')}</span>
                      <ChevronRight size={18} color="var(--primary)" />
                    </button>

                    {/* Directory 2: Emergency Contacts */}
                    <button 
                      onClick={() => setActiveView('contacts')}
                      style={{ ...optionStyle, borderLeft: '4px solid var(--color-high)', background: 'rgba(239, 68, 68, 0.08)' }}
                    >
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fca5a5' }}>{t('emergency.opt_contacts')}</span>
                      <ChevronRight size={18} color="var(--color-high)" />
                    </button>

                  </div>
                </div>
              )}

              {/* VIEW 2: SCENARIO GUIDES */}
              {activeView.startsWith('guide_') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Guide Header */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.00rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                      {t(`emergency.${activeView}_title`)}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', margin: 0 }}>
                      {t(`emergency.${activeView}_desc`)}
                    </p>
                  </div>

                  {/* Immediate Steps */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', lineHeight: 1.5, fontSize: '0.9rem', color: '#f1f5f9' }}>
                      {t(`emergency.${activeView}_step1`)}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', lineHeight: 1.5, fontSize: '0.9rem', color: '#f1f5f9' }}>
                      {t(`emergency.${activeView}_step2`)}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', lineHeight: 1.5, fontSize: '0.9rem', color: '#f1f5f9' }}>
                      {t(`emergency.${activeView}_step3`)}
                    </div>
                    {activeView === 'guide_apk' && (
                      <>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', lineHeight: 1.5, fontSize: '0.9rem', color: '#f1f5f9' }}>
                          {t('emergency.guide_apk_step4')}
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', lineHeight: 1.5, fontSize: '0.9rem', color: '#f1f5f9' }}>
                          {t('emergency.guide_apk_step5')}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Shortcuts */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <a 
                      href="tel:997"
                      style={{ flex: 1, minWidth: '160px', padding: '0.75rem 1rem', background: '#ef4444', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Phone size={16} />
                      {t('emergency.action_call')} NSRC (997)
                    </a>
                    <button
                      onClick={() => setActiveView('banks')}
                      style={{ flex: 1, minWidth: '160px', padding: '0.75rem 1rem', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid var(--primary)', color: '#e0f2fe', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Building2 size={16} />
                        {t('emergency.action_bank')}
                    </button>
                    {activeView === 'guide_apk' && (
                      <a 
                        href="https://www.mycert.org.my"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ width: '100%', padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--primary)', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <ExternalLink size={16} />
                        {t("emergency.mycert_portal")}
                      </a>
                    )}
                  </div>

                  {/* PREPARE CHECKLIST */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem' }}>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fef08a', margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {t('emergency.prep_title')}
                    </h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
                      {t('emergency.prep_desc')}
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <li>{t('emergency.prep_item_tx')}</li>
                      <li>{t('emergency.prep_item_date')}</li>
                      <li>{t('emergency.prep_item_phone')}</li>
                      <li>{t('emergency.prep_item_url')}</li>
                      <li>{t('emergency.prep_item_screens')}</li>
                      <li>{t('emergency.prep_item_account')}</li>
                      {activeView === 'guide_apk' && (
                        <>
                          <li>{t('emergency.prep_item_device')}</li>
                          <li>{t('emergency.prep_item_appname')}</li>
                        </>
                      )}
                    </ul>
                  </div>

                </div>
              )}

              {/* VIEW 3: BANK DIRECTORY */}
              {activeView === 'banks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {t('emergency.bank_title')}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', margin: 0, lineHeight: 1.4 }}>
                      {t('emergency.bank_subtitle')}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {officialBankEmergencyPages.map((bank) => (
                      <div 
                        key={bank.id} 
                        style={{ 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '12px', 
                          padding: '1.15rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ background: 'rgba(6, 182, 212, 0.12)', padding: '0.5rem', borderRadius: '8px', display: 'flex', flexShrink: 0 }}>
                            <Building2 size={20} color="var(--primary)" />
                          </div>
                          <div>
                            <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                              {bank.name}
                            </h5>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {t('emergency.bank_card_desc')}
                            </span>
                          </div>
                        </div>

                        {bank.hotline && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 500 }}>
                              📞 {bank.hotline}
                            </span>
                            <a
                              href={`tel:${bank.hotline.replace(/[^0-9]/g, '')}`}
                              style={{
                                padding: '0.25rem 0.65rem',
                                background: '#ef4444',
                                color: '#fff',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <Phone size={12} />
                              {t('emergency.action_call')}
                            </a>
                          </div>
                        )}

                        <a 
                          href={bank.supportUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            padding: '0.6rem 0.85rem',
                            background: 'rgba(6, 182, 212, 0.15)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            borderRadius: '8px',
                            color: 'var(--primary)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <ExternalLink size={16} />
                          {t('emergency.bank_visit_btn')}
                        </a>
                      </div>
                    ))}
                  </div>

                  {/* INFORMATIONAL NOTICE */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      ⚠️ {t('emergency.bank_notice')}
                    </p>
                  </div>

                </div>
              )}

              {/* VIEW 4: EMERGENCY CONTACTS */}
              {activeView === 'contacts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {t('emergency.opt_contacts')}
                    </h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {emergencyAgencies.map((agency) => (
                      <div 
                        key={agency.id} 
                        style={{ 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '12px', 
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.65rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <h5 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                            {agency.name}
                          </h5>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          {t(agency.descKey)}
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                          {agency.phone && (
                            <a 
                              href={`tel:${agency.phone.replace(/[^0-9]/g, '')}`}
                              style={{ padding: '0.55rem 0.85rem', background: '#ef4444', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <Phone size={14} />
                              {t('emergency.action_call')} ({agency.phone})
                            </a>
                          )}
                          <a 
                            href={agency.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ padding: '0.55rem 0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--primary)', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <ExternalLink size={14} />
                            {t('emergency.action_visit')}
                          </a>
                        </div>

                      </div>
                    ))}
                  </div>

                  {/* INFORMATIONAL NOTICE BELOW CONTACT CARDS */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      ⚠️ {t('emergency.agency_notice')}
                    </p>
                  </div>

                </div>
              )}

            </div>

            {/* BOTTOM DISCLAIMER ON EVERY VIEW */}
            <div style={{ padding: '0.85rem 1.5rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                <strong>{t('emergency.disclaimer_title')}:</strong> {t('emergency.disclaimer_text')}
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

const optionStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1.15rem 1.25rem',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--border-color)',
  borderRadius: '14px',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  transition: 'all 0.2s ease'
};
