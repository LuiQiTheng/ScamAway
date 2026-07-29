import React from 'react';
import { ShieldAlert, User, ShieldAlert as AdminIcon, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LoginScreen({ onLogin }) {
  const { t, lang } = useLanguage();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div className="fade-in" style={{
        width: '100%',
        maxWidth: '500px',
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
            Welcome to ScamShield AI
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {lang === 'ms' 
              ? 'Sila pilih peranan anda untuk log masuk ke sistem.' 
              : 'Please select your role to log into the system.'}
          </p>
        </div>

        {/* Role Selection Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* User Role Button */}
          <button
            onClick={() => onLogin('user')}
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
                  {lang === 'ms' ? 'Pengguna Biasa' : 'Citizen / User'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  {lang === 'ms' ? 'Akses pengimbas & profil pelaporan' : 'Access scanner & reporting profile'}
                </p>
              </div>
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
          </button>

          {/* Admin Role Button */}
          <button
            onClick={() => onLogin('admin')}
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
                  {lang === 'ms' ? 'Moderator / Admin' : 'Moderator / Admin'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  {lang === 'ms' ? 'Urus laporan & pusat tinjauan' : 'Manage reports & review dashboard'}
                </p>
              </div>
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
          </button>

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
