import React from 'react';
import { ShieldAlert, User, ShieldAlert as AdminIcon, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LoginScreen({ onLogin }) {
  const { t, lang, toggleLanguage } = useLanguage();

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)',
      fontFamily: "'Inter', sans-serif"
    }}>

      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1.25rem",
            fontSize: "0.9rem",
            fontWeight: 500,
            gap: "0.35rem",
          }}
        >
          <span
            onClick={() => lang !== "en" && toggleLanguage()}
            style={{
              cursor: "pointer",
              color: lang === "en" ? "#3b82f6" : "var(--text-secondary)",
              fontWeight: lang === "en" ? 700 : 400,
            }}
          >
            English
          </span>

          <span style={{ color: "var(--text-muted)" }}>|</span>

          <span
            onClick={() => lang !== "ms" && toggleLanguage()}
            style={{
              cursor: "pointer",
              color: lang === "ms" ? "#3b82f6" : "var(--text-secondary)",
              fontWeight: lang === "ms" ? 700 : 400,
            }}
          >
            Bahasa Melayu
          </span>
        </div>

        <div className="fade-in login-card" style={{
          width: '100%',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '3rem 2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>

          {/* Header / Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.05) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: '1.25rem',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)'
          }}>
            <ShieldAlert size={32} color="#3b82f6" />
          </div>
          <h1 style={{ 
            fontSize: '1.8rem', 
            fontWeight: 700, 
            color: '#fff', 
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            {t("login.welcome")}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {t("login.subtitle")}
          </p>
        </div>

        {/* Role Selection Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* User Role Button */}
          <button
            onClick={() => onLogin('user')}
            className="login-role-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              textAlign: 'left',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '0.75rem',
                borderRadius: '12px'
              }}>
                <User size={24} color="#60a5fa" />
              </div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                  {t("login.user")}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  {t("login.user_desc")}
                </p>
              </div>
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
          </button>

          {/* Admin Role Button */}
          <button
            onClick={() => onLogin('admin')}
            className="login-role-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              textAlign: 'left',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '0.75rem',
                borderRadius: '12px'
              }}>
                <AdminIcon size={24} color="#f87171" />
              </div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                  {t("login.admin")}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  {t("login.admin_desc")}
                </p>
              </div>
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
          </button>
        </div>
      </div>
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
            UCRIX Demo Version • Extensible Auth Ready
          </p>
        </div>

      </div>
    </div>
  );
}
