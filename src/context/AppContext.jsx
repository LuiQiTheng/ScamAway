import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

// Seed data
const INITIAL_REPORTS = [
  {
    id: 1001,
    category: 'parcel',
    text: "Your parcel is being held. Pay RM2.50 within 30 minutes using the QR code below or the parcel will be returned. pos-laju.info/claim-fee/2.50",
    score: 76,
    riskBand: "High risk",
    timestamp: new Date("2026-07-26T14:32:00.000Z").toISOString(),
    status: 'unverified',
    reporterId: 'rep_101'
  },
  {
    id: 1002,
    category: 'job',
    text: "CONGRATULATIONS! Online marketing role. Earn RM300-800 daily. Pay RM50 registration deposit to start task processing. Call +6011-8762512.",
    score: 82,
    riskBand: "Critical",
    timestamp: new Date("2026-07-25T11:15:00.000Z").toISOString(),
    status: 'confirmed',
    reporterId: 'rep_102'
  },
  {
    id: 1003,
    category: 'emergency',
    text: "Mum, I damaged my phone speaker. Need you to transfer RM1,000 to my friend's account 164228910239 urgently for my medical bill. Don't call me.",
    score: 90,
    riskBand: "Critical",
    timestamp: new Date("2026-07-26T09:04:00.000Z").toISOString(),
    status: 'confirmed',
    reporterId: 'rep_103'
  },
  {
    id: 1004,
    category: 'marketplace',
    text: "Seller asks to proceed with payment via bank transfer outside Shopee guarantee page to get 10% discount.",
    score: 55,
    riskBand: "Caution",
    timestamp: new Date("2026-07-26T15:10:00.000Z").toISOString(),
    status: 'under_review',
    reporterId: 'rep_101'
  }
];

const INITIAL_REPUTATIONS = [
  { profileId: 'rep_101', userName: 'Ahmad Rafiq (Kuala Lumpur)', role: 'Citizen', identityLevel: 2, agreementRate: 94, verifiedReports: 5, abuseFlags: 0 },
  { profileId: 'rep_102', userName: 'Lim Wei Han (Selangor)', role: 'Citizen', identityLevel: 3, agreementRate: 100, verifiedReports: 12, abuseFlags: 0 },
  { profileId: 'rep_103', userName: 'Guest_User_912', role: 'Guest', identityLevel: 1, agreementRate: 75, verifiedReports: 2, abuseFlags: 0 }
];

const INITIAL_BLACKLIST = {
  phoneNumbers: ['+6011-8762512', '+6017-9921102', '+6012-3345591', '+6019-2238475'],
  urls: ['pos-laju.info', 'maybank-secure-login.xyz', 'shopee-rewards-claim.net', 'tnb-bill-payment.club', 'lhdn-refund.org'],
  bankAccounts: ['164228910239', '564210923049']
};

export const AppProvider = ({ children }) => {
  const [reportsList, setReportsList] = useState(() => {
    const saved = localStorage.getItem('scamshield_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [reputationProfiles, setReputationProfiles] = useState(() => {
    const saved = localStorage.getItem('scamshield_reputations');
    return saved ? JSON.parse(saved) : INITIAL_REPUTATIONS;
  });

  const [blacklist, setBlacklist] = useState(() => {
    const saved = localStorage.getItem('scamshield_blacklist');
    return saved ? JSON.parse(saved) : INITIAL_BLACKLIST;
  });

  const [activeAlert, setActiveAlert] = useState(() => {
    const saved = localStorage.getItem('scamshield_alert');
    return saved ? JSON.parse(saved) : {
      id: 1,
      message: "Urgent: A wave of parcel cash-on-delivery (COD) SMS impersonating Pos Laju links (pos-laju.info) has been targeting Selangor and Klang Valley regions. Do not pay or open the links.",
      timestamp: new Date().toISOString()
    };
  });

  // Sync to localStorage
  useEffect(() => localStorage.setItem('scamshield_reports', JSON.stringify(reportsList)), [reportsList]);
  useEffect(() => localStorage.setItem('scamshield_reputations', JSON.stringify(reputationProfiles)), [reputationProfiles]);
  useEffect(() => localStorage.setItem('scamshield_blacklist', JSON.stringify(blacklist)), [blacklist]);
  useEffect(() => localStorage.setItem('scamshield_alert', JSON.stringify(activeAlert)), [activeAlert]);

  const addReport = (newReport) => {
    setReportsList(prev => [{ ...newReport, id: Date.now(), reporterId: 'rep_103' }, ...prev]);
  };

  const updateReportStatus = (id, newStatus, rationale) => {
    setReportsList(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, rationale } : r));
  };

  const updateReputation = (profileId, wasCorrect) => {
    setReputationProfiles(prev => prev.map(p => {
      if (p.profileId === profileId) {
        const newVerified = wasCorrect ? p.verifiedReports + 1 : p.verifiedReports;
        const newRate = Math.min(100, Math.round((newVerified / (newVerified + (wasCorrect ? 0 : 1))) * 100));
        return { ...p, verifiedReports: newVerified, agreementRate: isNaN(newRate) ? p.agreementRate : newRate };
      }
      return p;
    }));
  };

  const addAlert = (alert) => setActiveAlert(alert);

  const addBlacklistItem = (type, value) => {
    setBlacklist(prev => ({
      ...prev,
      [type]: Array.from(new Set([...prev[type], value]))
    }));
  };

  return (
    <AppContext.Provider value={{
      reportsList, addReport, updateReportStatus,
      reputationProfiles, updateReputation,
      blacklist, addBlacklistItem,
      activeAlert, addAlert
    }}>
      {children}
    </AppContext.Provider>
  );
};
