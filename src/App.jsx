import React, { useState } from 'react';
import { ShieldAlert, HelpCircle, User, ShieldAlert as AdminIcon, Sparkles, Globe, Bell, LogOut } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import UserChecker from './components/UserChecker';
import ModeratorDashboard from './components/ModeratorDashboard';
import KnowledgeCentre from './components/KnowledgeCentre';
import UserProfile from './components/UserProfile';
import TrendsDashboard from './components/TrendsDashboard';
import LoginScreen from './components/LoginScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('check'); // check, knowledge, moderator, profile
  const [userRole, setUserRole] = useState('user'); // 'user' or 'admin'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMode, setUserMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem('scamshield_user_mode');
      if (savedMode && ['normal', 'elderly', 'kid'].includes(savedMode)) {
        return savedMode;
      }
      const legacyElderly = localStorage.getItem('scamshield_elderly_mode');
      if (legacyElderly && JSON.parse(legacyElderly) === true) {
        return 'elderly';
      }
      return 'normal';
    } catch (e) {
      return 'normal';
    }
  });

  const { lang, toggleLanguage, t } = useLanguage();

  const handleRoleChange = (role) => {
    setUserRole(role);
    setIsLoggedIn(true);
    if (role === 'admin') {
      setActiveTab('moderator');
    } else {
      setActiveTab('check');
    }
  };

  const handleSetUserMode = (mode) => {
    setUserMode(mode);
    try {
      localStorage.setItem('scamshield_user_mode', mode);
      localStorage.setItem('scamshield_elderly_mode', JSON.stringify(mode === 'elderly'));
    } catch (e) {
      console.error(e);
    }
  };
  
  const activeMode = userRole === 'admin' ? 'normal' : userMode;
  const isElderlyMode = activeMode === 'elderly';
  const isKidMode = activeMode === 'kid';

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleRoleChange} />;
  }

  return (
    <div className={`app-container mode-${activeMode} ${isElderlyMode ? 'elderly-mode' : ''} ${isKidMode ? 'kid-mode' : ''}`}>
      {/* Navigation Header */}
      <header className="app-header">
        <div className="app-logo">
          <ShieldAlert size={28} color="var(--primary)" />
          <span>SCAMSHIELD</span>
        </div>

        <nav className="nav-links">
          {userRole === 'user' ? (
            <>
              <button
                onClick={() => setActiveTab('check')}
                className={`nav-link ${activeTab === 'check' ? 'active' : ''}`}
                style={{ fontSize: isElderlyMode ? '1.25rem' : '0.9rem' }}
              >
                🛡️ {t('nav.scanner')}
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`nav-link ${activeTab === 'knowledge' ? 'active' : ''}`}
                style={{ fontSize: isElderlyMode ? '1.25rem' : '0.9rem' }}
              >
                🧠 {t('nav.knowledge')}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                style={{ fontSize: isElderlyMode ? '1.25rem' : '0.9rem' }}
              >
                👤 {t('nav.profile')}
              </button>
              <button 
                onClick={() => setActiveTab('trends')} 
                className={`nav-link ${activeTab === 'trends' ? 'active' : ''}`}
                style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
              >
                📈 {t('nav.trends')}
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('moderator')}
              className={`nav-link ${activeTab === 'moderator' ? 'active' : ''}`}
              style={{ fontSize: isElderlyMode ? '1.25rem' : '0.9rem' }}
            >
              👮 {t('nav.moderator')}
            </button>
          )}
        </nav>

        <div className="flex-row items-center gap-sm" style={{ flexWrap: 'wrap' }}>
          {/* Mode Selector Segmented Pill Control */}
          {userRole !== 'admin' && (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'rgba(255,255,255,0.03)', 
                padding: '0.2rem', 
                borderRadius: '20px', 
                border: '1px solid var(--border-color)',
                gap: '0.15rem'
              }}
            >
              <button
                onClick={() => handleSetUserMode('normal')}
                title={t('mode.normal')}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeMode === 'normal' ? 'var(--primary)' : 'transparent',
                  color: activeMode === 'normal' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                {t('mode.normal')}
              </button>
              <button
                onClick={() => handleSetUserMode('elderly')}
                title={t('mode.elderly')}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeMode === 'elderly' ? '#06b6d4' : 'transparent',
                  color: activeMode === 'elderly' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                {t('mode.elderly')}
              </button>
              <button
                onClick={() => handleSetUserMode('kid')}
                title={t('mode.kid')}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeMode === 'kid' ? 'var(--primary)' : 'transparent',
                  color: activeMode === 'kid' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                {t('mode.kid')}
              </button>
            </div>
          )}

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
              padding: '0.35rem 0.75rem', borderRadius: '20px', color: '#fff', cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: 600
            }}
          >
            <Globe size={14} />
            {lang === 'en' ? 'EN / BM' : 'BM / EN'}
          </button>

          {/* Logout Button */}
          <button
            onClick={() => setIsLoggedIn(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '0.35rem 0.75rem', borderRadius: '20px', color: '#f87171', cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={14} />
            {lang === 'en' ? 'Log Out' : 'Log Keluar'}
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="w-full" style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        {activeTab === 'check' && (
          <UserChecker
            userMode={userMode}
            isElderlyMode={isElderlyMode}
            isKidMode={isKidMode}
            onSetUserMode={handleSetUserMode}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeCentre
            userMode={userMode}
            isElderlyMode={isElderlyMode}
            isKidMode={isKidMode}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfile
            userMode={userMode}
            isElderlyMode={isElderlyMode}
            isKidMode={isKidMode}
          />
        )}

        {activeTab === 'trends' && (
          <TrendsDashboard />
        )}

        {activeTab === 'moderator' && (
          <ModeratorDashboard />
        )}
      </main>

      {/* Premium Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        background: '#070a13'
      }}>
        <div className="flex-row items-center justify-center gap-sm" style={{ marginBottom: '0.5rem' }}>
          <Sparkles size={14} color="var(--primary)" />
          <strong>{t('app.footer_title')}</strong>
        </div>
        <p>{t('app.footer_desc')}</p>
      </footer>
    </div>
  );
}
