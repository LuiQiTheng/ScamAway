import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, getDocs } from "firebase/firestore";
import { db } from '../config/firebase';

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
  }
];

const INITIAL_REPUTATIONS = [
  { profileId: 'rep_101', userName: 'Ahmad Rafiq (Kuala Lumpur)', role: 'Citizen', identityLevel: 2, agreementRate: 94, verifiedReports: 5, abuseFlags: 0 },
  { profileId: 'rep_102', userName: 'Lim Wei Han (Selangor)', role: 'Citizen', identityLevel: 3, agreementRate: 100, verifiedReports: 12, abuseFlags: 0 }
];

const INITIAL_BLACKLIST = {
  id: 'global',
  phoneNumbers: ['+6011-8762512', '+6017-9921102'],
  urls: ['pos-laju.info', 'maybank-secure-login.xyz'],
  bankAccounts: ['164228910239']
};

export const AppProvider = ({ children }) => {
  const [reportsList, setReportsList] = useState([]);
  const [reputationProfiles, setReputationProfiles] = useState([]);
  const [blacklist, setBlacklist] = useState({ phoneNumbers: [], urls: [], bankAccounts: [] });
  const [activeAlert, setActiveAlert] = useState(null);

  // Initialize and Sync Firebase Data
  useEffect(() => {
    if (!db) return;

    // Listen to Reports
    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
      if (reports.length === 0) {
        INITIAL_REPORTS.forEach(r => addDoc(collection(db, "reports"), r).catch(e => console.warn("Firestore seed err:", e)));
        setReportsList(INITIAL_REPORTS);
      } else {
        reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setReportsList(reports);
      }
    }, (error) => {
      console.warn("⚠️ [Firestore] Could not connect to Cloud Database. (Check if Firestore Database is created in Test Mode in Firebase Console). Using local fallback.", error?.message);
      setReportsList(prev => prev.length === 0 ? INITIAL_REPORTS : prev);
    });

    // Listen to Reputations
    const unsubReputations = onSnapshot(collection(db, "reputations"), (snapshot) => {
      const reps = snapshot.docs.map(doc => doc.data());
      if (reps.length === 0) {
        INITIAL_REPUTATIONS.forEach(r => setDoc(doc(db, "reputations", r.profileId), r).catch(e => console.warn(e)));
        setReputationProfiles(INITIAL_REPUTATIONS);
      } else {
        setReputationProfiles(reps);
      }
    }, (error) => console.warn("⚠️ [Firestore Reputations Listener]", error?.message));

    // Listen to Blacklist
    const unsubBlacklist = onSnapshot(doc(db, "system", "blacklist"), (docSnap) => {
      if (!docSnap.exists()) {
        setDoc(doc(db, "system", "blacklist"), INITIAL_BLACKLIST).catch(e => console.warn(e));
        setBlacklist(INITIAL_BLACKLIST);
      } else {
        setBlacklist(docSnap.data());
      }
    }, (error) => console.warn("⚠️ [Firestore Blacklist Listener]", error?.message));

    // Listen to Active Alert
    const unsubAlert = onSnapshot(doc(db, "system", "activeAlert"), (docSnap) => {
      if (docSnap.exists()) {
        setActiveAlert(docSnap.data());
      }
    }, (error) => console.warn("⚠️ [Firestore Alert Listener]", error?.message));

    return () => {
      unsubReports();
      unsubReputations();
      unsubBlacklist();
      unsubAlert();
    };
  }, []);

  const addReport = useCallback(async (newReport) => {
    const reportData = { ...newReport, id: Date.now(), reporterId: 'rep_103' };
    // Optimistic local update
    setReportsList(prev => [reportData, ...prev]);
    try {
      await addDoc(collection(db, "reports"), reportData);
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to write report to cloud:", e?.message);
    }
  }, []);

  const updateReportStatus = useCallback(async (id, newStatus, rationale) => {
    // Optimistic local update
    setReportsList(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, rationale } : r));
    try {
      const report = reportsList.find(r => r.id === id);
      if (report && report.firebaseId) {
        await updateDoc(doc(db, "reports", report.firebaseId), { status: newStatus, rationale });
      }
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to update status in cloud:", e?.message);
    }
  }, [reportsList]);

  const updateReputation = useCallback(async (profileId, wasCorrect) => {
    setReputationProfiles(prev => prev.map(p => {
      if (p.profileId === profileId) {
        const newVerified = wasCorrect ? p.verifiedReports + 1 : p.verifiedReports;
        const newRate = Math.min(100, Math.round((newVerified / (newVerified + (wasCorrect ? 0 : 1))) * 100));
        return { ...p, verifiedReports: newVerified, agreementRate: isNaN(newRate) ? p.agreementRate : newRate };
      }
      return p;
    }));
    try {
      const profile = reputationProfiles.find(p => p.profileId === profileId);
      if (profile) {
        const newVerified = wasCorrect ? profile.verifiedReports + 1 : profile.verifiedReports;
        const newRate = Math.min(100, Math.round((newVerified / (newVerified + (wasCorrect ? 0 : 1))) * 100));
        await updateDoc(doc(db, "reputations", profileId), { 
          verifiedReports: newVerified, 
          agreementRate: isNaN(newRate) ? profile.agreementRate : newRate 
        });
      }
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to update reputation in cloud:", e?.message);
    }
  }, [reputationProfiles]);

  const addAlert = useCallback(async (alert) => {
    setActiveAlert(alert);
    try {
      await setDoc(doc(db, "system", "activeAlert"), alert);
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to update active alert in cloud:", e?.message);
    }
  }, []);

  const addBlacklistItem = useCallback(async (type, value) => {
    if (!['phoneNumbers', 'urls', 'bankAccounts'].includes(type)) return;
    setBlacklist(prev => ({
      ...prev,
      [type]: Array.from(new Set([...prev[type], value]))
    }));
    try {
      const updatedList = Array.from(new Set([...blacklist[type], value]));
      await updateDoc(doc(db, "system", "blacklist"), {
        [type]: updatedList
      });
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to update blacklist in cloud:", e?.message);
    }
  }, [blacklist]);


  const contextValue = useMemo(() => ({
    reportsList, addReport, updateReportStatus,
    reputationProfiles, updateReputation,
    blacklist, addBlacklistItem,
    activeAlert, addAlert
  }), [reportsList, reputationProfiles, blacklist, activeAlert, addReport, updateReportStatus, updateReputation, addBlacklistItem, addAlert]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
