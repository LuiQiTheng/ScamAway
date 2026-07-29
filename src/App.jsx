import React, { useState } from 'react';
import { ShieldAlert, HelpCircle, User, ShieldAlert as AdminIcon, Sparkles, Globe, Bell } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import UserChecker from './components/UserChecker';
import ModeratorDashboard from './components/ModeratorDashboard';
import KnowledgeCentre from './components/KnowledgeCentre';
import UserProfile from './components/UserProfile';
import TrendsDashboard from './components/TrendsDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('check'); // check, knowledge, moderator, profile
  const [userRole, setUserRole] = useState('user'); // 'user' or 'admin'
  const [isElderlyMode, setIsElderlyMode] = useState(false);
  const { lang, toggleLanguage, t } = useLanguage();

  const handleRoleChange = (role) => {
    setUserRole(role);
    if (role === 'admin') {
      setActiveTab('moderator');
    } else {
      setActiveTab('check');
    }
  };
  
  const handleToggleElderlyMode = () => {
    setIsElderlyMode(!isElderlyMode);
  };

  return (
    <div className={`app-container ${isElderlyMode ? 'elderly-mode' : ''}`}>
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
                style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
              >
                🛡️ {t('nav.scanner')}
              </button>
              <button 
                onClick={() => setActiveTab('knowledge')} 
                className={`nav-link ${activeTab === 'knowledge' ? 'active' : ''}`}
                style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
              >
                🧠 {t('nav.knowledge')}
              </button>
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
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
              style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
            >
              👮 {t('nav.moderator')}
            </button>
          )}
        </nav>

        <div className="flex-row items-center gap-sm">
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

          {/* Role Switcher Badge for Demo */}
          <div className="flex-row items-center" style={{ background: 'rgba(255,255,255,0.03)', padding: '0.25rem 0.5rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => handleRoleChange('user')}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '16px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: userRole === 'user' ? 'var(--primary)' : 'transparent',
                color: userRole === 'user' ? '#fff' : 'var(--text-muted)'
              }}
            >
              {t('app.role_user')}
            </button>
            <button 
              onClick={() => handleRoleChange('admin')}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '16px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: userRole === 'admin' ? '#ef4444' : 'transparent',
                color: userRole === 'admin' ? '#fff' : 'var(--text-muted)'
              }}
            >
              {t('app.role_admin')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="w-full" style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        {activeTab === 'check' && (
          <UserChecker 
            isElderlyMode={isElderlyMode}
            onToggleElderlyMode={handleToggleElderlyMode}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeCentre 
            isElderlyMode={isElderlyMode}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfile />
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
