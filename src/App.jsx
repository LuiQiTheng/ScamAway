import React, { useState } from 'react';
import { ShieldAlert, HelpCircle, User, ShieldAlert as AdminIcon, Sparkles } from 'lucide-react';
import UserChecker from './components/UserChecker';
import ModeratorDashboard from './components/ModeratorDashboard';
import KnowledgeCentre from './components/KnowledgeCentre';

// Initial Mock Reports representing seed data and Appendix E test cases
const INITIAL_REPORTS = [
  {
    id: 1001,
    category: 'parcel',
    text: "Your parcel is being held. Pay RM2.50 within 30 minutes using the QR code below or the parcel will be returned. pos-laju.info/claim-fee/2.50",
    score: 76,
    riskBand: "High risk",
    timestamp: "2026-07-26T14:32:00.000Z",
    status: 'unverified',
    reporterId: 'rep_101'
  },
  {
    id: 1002,
    category: 'job',
    text: "CONGRATULATIONS! Online marketing role. Earn RM300-800 daily. Pay RM50 registration deposit to start task processing. Call +6011-8762512.",
    score: 82,
    riskBand: "Critical",
    timestamp: "2026-07-25T11:15:00.000Z",
    status: 'confirmed',
    reporterId: 'rep_102'
  },
  {
    id: 1003,
    category: 'emergency',
    text: "Mum, I damaged my phone speaker. Need you to transfer RM1,000 to my friend's account 164228910239 urgently for my medical bill. Don't call me.",
    score: 90,
    riskBand: "Critical",
    timestamp: "2026-07-26T09:04:00.000Z",
    status: 'confirmed',
    reporterId: 'rep_103'
  },
  {
    id: 1004,
    category: 'marketplace',
    text: "Seller asks to proceed with payment via bank transfer outside Shopee guarantee page to get 10% discount.",
    score: 55,
    riskBand: "Caution",
    timestamp: "2026-07-26T15:10:00.000Z",
    status: 'under_review',
    reporterId: 'rep_101'
  }
];

// Initial reputation logs for community reporter weightings (9.2 Reporter reputation)
const INITIAL_REPUTATIONS = [
  {
    profileId: 'rep_101',
    userName: 'Ahmad Rafiq (Kuala Lumpur)',
    role: 'Citizen',
    identityLevel: 2, // Verified email
    agreementRate: 94,
    verifiedReports: 5,
    abuseFlags: 0
  },
  {
    profileId: 'rep_102',
    userName: 'Lim Wei Han (Selangor)',
    role: 'Citizen',
    identityLevel: 3, // Premium reporter
    agreementRate: 100,
    verifiedReports: 12,
    abuseFlags: 0
  },
  {
    profileId: 'rep_103',
    userName: 'Guest_User_912',
    role: 'Guest',
    identityLevel: 1, // Guest
    agreementRate: 75,
    verifiedReports: 2,
    abuseFlags: 0
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('check'); // check, knowledge, moderator
  const [userRole, setUserRole] = useState('citizen'); // 'citizen' or 'admin'
  const [isElderlyMode, setIsElderlyMode] = useState(false);
  const [reportsList, setReportsList] = useState(INITIAL_REPORTS);
  const [reputationProfiles, setReputationProfiles] = useState(INITIAL_REPUTATIONS);

  const handleRoleChange = (role) => {
    setUserRole(role);
    if (role === 'admin') {
      setActiveTab('moderator');
    } else {
      setActiveTab('check');
    }
  };

  // Published active community alerts
  const [activeAlert, setActiveAlert] = useState({
    id: 1,
    message: "Urgent: A wave of parcel cash-on-delivery (COD) SMS impersonating Pos Laju links (pos-laju.info) has been targeting Selangor and Klang Valley regions. Do not pay or open the links.",
    timestamp: new Date().toISOString()
  });

  const handleAddReport = (newReport) => {
    const reportWithId = {
      ...newReport,
      id: Date.now(),
      reporterId: 'rep_103' // Default to logged-in guest user for MVP
    };
    setReportsList(prev => [reportWithId, ...prev]);
  };

  const handleUpdateReportStatus = (id, newStatus, rationale) => {
    setReportsList(prev => 
      prev.map(r => r.id === id ? { ...r, status: newStatus, rationale } : r)
    );
  };

  const handleUpdateReputation = (profileId, wasCorrect) => {
    setReputationProfiles(prev => 
      prev.map(p => {
        if (p.profileId === profileId) {
          const newVerified = wasCorrect ? p.verifiedReports + 1 : p.verifiedReports;
          // Recalculate agreement rate simple mock logic
          const newRate = Math.min(100, Math.round(((newVerified) / (newVerified + (wasCorrect ? 0 : 1))) * 100));
          return {
            ...p,
            verifiedReports: newVerified,
            agreementRate: isNaN(newRate) ? p.agreementRate : newRate
          };
        }
        return p;
      })
    );
  };

  const handleAddAlert = (alert) => {
    setActiveAlert(alert);
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
          {userRole === 'citizen' ? (
            <>
              <button 
                onClick={() => setActiveTab('check')} 
                className={`nav-link ${activeTab === 'check' ? 'active' : ''}`}
                style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
              >
                🛡️ Scam Checker
              </button>
              <button 
                onClick={() => setActiveTab('knowledge')} 
                className={`nav-link ${activeTab === 'knowledge' ? 'active' : ''}`}
                style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
              >
                🧠 Spot the Scam
              </button>
            </>
          ) : (
            <button 
              onClick={() => setActiveTab('moderator')} 
              className={`nav-link ${activeTab === 'moderator' ? 'active' : ''}`}
              style={{ fontSize: isElderlyMode ? '1.15rem' : '0.9rem' }}
            >
              👮 Admin Moderation
            </button>
          )}
        </nav>

        {/* Role Switcher Badge for Demo */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.25rem 0.5rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => handleRoleChange('citizen')}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '16px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: userRole === 'citizen' ? 'var(--primary)' : 'transparent',
              color: userRole === 'citizen' ? '#fff' : 'var(--text-muted)'
            }}
          >
            👤 Citizen
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
            👮 Admin
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main style={{ flex: 1, padding: '2rem 1.5rem', width: '100%', maxWidth: '1280px', margin: '0 auto' }}>
        {activeTab === 'check' && (
          <UserChecker 
            isElderlyMode={isElderlyMode}
            onToggleElderlyMode={handleToggleElderlyMode}
            reportsList={reportsList}
            onAddReport={handleAddReport}
            activeAlert={activeAlert}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeCentre 
            isElderlyMode={isElderlyMode}
          />
        )}

        {activeTab === 'moderator' && (
          <ModeratorDashboard 
            reportsList={reportsList}
            onUpdateReportStatus={handleUpdateReportStatus}
            onAddAlert={handleAddAlert}
            reputationProfiles={reputationProfiles}
            onUpdateReputation={handleUpdateReputation}
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Sparkles size={14} color="var(--primary)" />
          <strong>ScamShield — Explainable Digital Safety Platform</strong>
        </div>
        <p>Prepared for UCRIX Innovation 2026 Competition. Aligning with UN Sustainable Development Goals (SDG 16, 9, 10, 4).</p>
      </footer>
    </div>
  );
}
