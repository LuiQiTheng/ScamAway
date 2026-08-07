import React, { useState, useContext } from 'react';
import { ShieldAlert, HelpCircle, User, ShieldAlert as AdminIcon, Sparkles, Globe, Bell, LogOut, X } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { useAppContext } from './context/AppContext';
import UserChecker from './components/UserChecker';
import ModeratorDashboard from './components/ModeratorDashboard';
import KnowledgeCentre from './components/KnowledgeCentre';
import UserProfile from './components/UserProfile';
import TrendsDashboard from './components/TrendsDashboard';
import LoginScreen from './components/LoginScreen';
import EmergencyHelp from './components/EmergencyHelp';
import GuardianSetupModal from './components/Guardian/GuardianSetupModal';
import AdminProfile from './components/AdminProfile';
import { useScrollToTop } from './utils/useScrollToTop';

export default function App() {
  const { userNotifications, dismissNotification, adminProfile, setAdminProfile, currentUser, setCurrentUser, updateGuardian } = useAppContext();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('scam_shield_active_tab') || 'check');
  
  useScrollToTop(activeTab);
  
  const { lang, toggleLanguage, t } = useLanguage();

  const userRole = adminProfile ? 'admin' : (currentUser ? 'user' : null);
  const isLoggedIn = !!userRole;

  const handleRoleChange = (role) => {
    const newTab = role === 'admin' ? 'moderator' : 'check';
    setActiveTab(newTab);
    localStorage.setItem('scam_shield_active_tab', newTab);
  };

  const handleLogout = () => {
    setAdminProfile(null);
    setCurrentUser(null);
    localStorage.removeItem('scam_shield_active_tab');
  };

  let activeMode = 'normal';
  if (currentUser) {
    if (currentUser.age >= 55) activeMode = 'elderly';
    else if (currentUser.age <= 16) activeMode = 'kid';
  }
  
  const isElderlyMode = activeMode === 'elderly';
  const isKidMode = activeMode === 'kid';

  // Enforce Guardian Setup
  const [showGuardianPrompt, setShowGuardianPrompt] = useState(false);
  React.useEffect(() => {
    if (currentUser && (isElderlyMode || isKidMode)) {
      if (!currentUser.guardian) {
        setShowGuardianPrompt(true);
      }
    } else {
      setShowGuardianPrompt(false);
    }
  }, [currentUser, isElderlyMode, isKidMode]);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleRoleChange} />;
  }

  return (
    <div className={`app-container mode-${activeMode} ${isElderlyMode ? 'elderly-mode' : ''} ${isKidMode ? 'kid-mode' : ''}`}>
      {/* Floating Notifications */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {userNotifications?.map(notif => (
          <div key={notif.id} className="glass-panel" style={{ padding: '1rem', borderLeft: notif.newStatus === 'confirmed' ? '4px solid var(--color-low)' : '4px solid var(--color-high)', display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <Bell size={20} color={notif.newStatus === 'confirmed' ? 'var(--color-low)' : 'var(--color-high)'} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#fff', fontWeight: 500, lineHeight: '1.4' }}>
                {lang === 'ms' 
                  ? <>Laporan anda mengenai scam <strong style={{color: 'var(--primary)', textTransform: 'capitalize'}}>{notif.category || 'tiada kategori'}</strong> ({notif.reportCode || `#${notif.reportId?.toString().slice(-4)}`}) telah disemak oleh moderator.</>
                  : <>Your report regarding a <strong style={{color: 'var(--primary)', textTransform: 'capitalize'}}>{notif.category || 'uncategorized'}</strong> scam ({notif.reportCode || `#${notif.reportId?.toString().slice(-4)}`}) was reviewed by a moderator.</>
                }
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                {lang === 'ms' ? 'Status ditukar kepada ' : 'Status changed to '}
                <strong style={{ textTransform: 'capitalize' }}>
                  {notif.newStatus === 'confirmed' ? (lang === 'ms' ? 'Disahkan' : 'Confirmed') : 
                   notif.newStatus === 'rejected' ? (lang === 'ms' ? 'Ditolak' : 'Rejected') : 
                   notif.newStatus}
                </strong>
              </p>
              {notif.rationale && (
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                  💬 {lang === 'ms' ? (notif.rationaleMs || notif.rationale) : (notif.rationaleEn || notif.rationale)}
                </p>
              )}
            </div>
            <button onClick={() => dismissNotification(notif.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Navigation Header */}
      <header className="app-header">
        <div className="header-main-section">
          {/* Left Column: Logo on top, Controls (EN/BM & Logout) on bottom */}
          <div className="header-left-col">
            <div className="app-logo">
              <ShieldAlert size={28} color="var(--primary)" />
              <span>SCAM AWAY</span>
            </div>

            <div className="app-control-group">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                aria-label={lang === 'en' ? 'Switch language to Bahasa Malaysia' : 'Tukar bahasa kepada English'}
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
                onClick={handleLogout}
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
          </div>

          {/* Right Column: Emergency Help Button */}
          <div className="header-right-col">
            {userRole !== 'admin' && <EmergencyHelp />}
          </div>
        </div>

        <nav className="nav-links">
          {userRole === 'user' ? (
            <>
              <button
                onClick={() => setActiveTab('check')}
                className={`nav-link ${activeTab === 'check' ? 'active' : ''}`}
                aria-current={activeTab === 'check' ? 'page' : undefined}
                style={{ fontSize: isElderlyMode ? '1.25rem' : '0.9rem' }}
              >
                🛡️ {t('nav.scanner')}
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`nav-link ${activeTab === 'knowledge' ? 'active' : ''}`}
                aria-current={activeTab === 'knowledge' ? 'page' : undefined}
                style={{ fontSize: isElderlyMode ? '1.25rem' : '0.9rem' }}
              >
                🧠 {t('nav.knowledge')}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                aria-current={activeTab === 'profile' ? 'page' : undefined}
                style={{ fontSize: isElderlyMode ? '1.25rem' : '0.9rem' }}
              >
                👤 {t('nav.profile')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('moderator')}
                className={`nav-link ${activeTab === 'moderator' ? 'active' : ''}`}
                aria-current={activeTab === 'moderator' ? 'page' : undefined}
                style={{ fontSize: isElderlyMode ? '1.25rem' : '0.9rem' }}
              >
                👮 {t('nav.moderator')}
              </button>
              <button
                onClick={() => setActiveTab('admin_profile')}
                className={`nav-link ${activeTab === 'admin_profile' ? 'active' : ''}`}
                aria-current={activeTab === 'admin_profile' ? 'page' : undefined}
                style={{ fontSize: isElderlyMode ? '1.25rem' : '0.9rem' }}
              >
                👤 {lang === 'ms' ? 'Profil' : 'Profile'}
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'check' && (
          <UserChecker
            userMode={activeMode}
            isElderlyMode={isElderlyMode}
            isKidMode={isKidMode}
          />
        )}
        {activeTab === 'knowledge' && (
          <KnowledgeCentre
            isElderlyMode={isElderlyMode}
            isKidMode={isKidMode}
          />
        )}
        {activeTab === 'profile' && (
          <UserProfile
            userMode={activeMode}
            isElderlyMode={isElderlyMode}
            isKidMode={isKidMode}
          />
        )}
        {activeTab === 'moderator' && <ModeratorDashboard />}
        {activeTab === 'admin_profile' && <AdminProfile />}
        
        {/* Force Guardian Setup Modal for Vulnerable Ages */}
        {showGuardianPrompt && (
          <GuardianSetupModal
            isOpen={true}
            onClose={() => {}} // Cannot close until saved
            guardian={null}
            mode="create"
            onSave={async (newGuardian) => {
              await updateGuardian(newGuardian);
              setShowGuardianPrompt(false);
            }}
          />
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
