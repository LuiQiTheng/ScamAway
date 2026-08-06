import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { db } from '../config/firebase';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

// Seed data
const INITIAL_REPORTS = [];

const INITIAL_REPUTATIONS = [
  { profileId: 'rep_101', userName: 'Ahmad Rafiq (Kuala Lumpur)', role: 'Citizen', identityLevel: 2, agreementRate: 94, verifiedReports: 5, abuseFlags: 0 },
  { profileId: 'rep_102', userName: 'Lim Wei Han (Selangor)', role: 'Citizen', identityLevel: 3, agreementRate: 100, verifiedReports: 12, abuseFlags: 0 },
  { profileId: 'rep_103', userName: 'Guest_User_912', role: 'Guest', identityLevel: 1, agreementRate: 75, verifiedReports: 2, abuseFlags: 0 }
];

const INITIAL_BLACKLIST = {
  id: 'global',
  phoneNumbers: ['+6011-8762512', '+6017-9921102'],
  urls: ['pos-laju.info', 'maybank-secure-login.xyz'],
  bankAccounts: ['164228910239']
};

export const AppProvider = ({ children }) => {
  const [reportsList, setReportsList] = useState(() => {
    try {
      const saved = localStorage.getItem('scam_away_reports');
      return saved ? JSON.parse(saved) : INITIAL_REPORTS;
    } catch {
      return INITIAL_REPORTS;
    }
  });

  const [reputationProfiles, setReputationProfiles] = useState(INITIAL_REPUTATIONS);
  const [blacklist, setBlacklist] = useState(INITIAL_BLACKLIST);
  const [activeAlert, setActiveAlert] = useState(() => {
    try {
      const saved = localStorage.getItem('scam_shield_active_alert');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync active alert to localStorage for offline/fallback mode
  useEffect(() => {
    try {
      if (activeAlert) {
        localStorage.setItem('scam_shield_active_alert', JSON.stringify(activeAlert));
      } else {
        localStorage.removeItem('scam_shield_active_alert');
      }
    } catch (e) {
      console.warn("Could not save active alert to localStorage", e);
    }
  }, [activeAlert]);
  const [userNotifications, setUserNotifications] = useState([]);
  
  // -- AUTHENTICATION STATE & SESSION --
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('scam_shield_user_session');
      if (saved) {
        const session = JSON.parse(saved);
        // Check 12 hours expiry
        if (new Date().getTime() - session.timestamp < 12 * 60 * 60 * 1000) {
          return session.user;
        }
      }
    } catch { }
    return null;
  });

  const [adminProfile, setAdminProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('scam_shield_admin_session');
      if (saved) {
        const session = JSON.parse(saved);
        if (new Date().getTime() - session.timestamp < 12 * 60 * 60 * 1000) {
          return session.user;
        }
      }
    } catch { }
    return null;
  });

  // Sync Current User Session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('scam_shield_user_session', JSON.stringify({ user: currentUser, timestamp: new Date().getTime() }));
    } else {
      localStorage.removeItem('scam_shield_user_session');
    }
  }, [currentUser]);

  // Sync Admin Profile Session
  useEffect(() => {
    if (adminProfile) {
      localStorage.setItem('scam_shield_admin_session', JSON.stringify({ user: adminProfile, timestamp: new Date().getTime() }));
    } else {
      localStorage.removeItem('scam_shield_admin_session');
    }
  }, [adminProfile]);

  // Auth Helpers
  const registerUser = async (userData) => {
    const q = query(collection(db, "users"), where("username", "==", userData.username));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) throw new Error("Username already exists");
    const docRef = await addDoc(collection(db, "users"), userData);
    const createdUser = { id: docRef.id, ...userData };
    setCurrentUser(createdUser);
    return createdUser;
  };

  const loginUser = async (username, password) => {
    const q = query(collection(db, "users"), where("username", "==", username), where("password", "==", password));
    const snapshot = await getDocs(q);
    if (snapshot.empty) throw new Error("Invalid username or password");
    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };
    setCurrentUser(user);
    return user;
  };

  const registerAdmin = async (adminData) => {
    const q = query(collection(db, "admins"), where("officerId", "==", adminData.officerId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) throw new Error("Officer ID already exists");
    const docRef = await addDoc(collection(db, "admins"), adminData);
    const createdAdmin = { id: docRef.id, ...adminData };
    setAdminProfile(createdAdmin);
    return createdAdmin;
  };

  const loginAdmin = async (officerId, password) => {
    const q = query(collection(db, "admins"), where("officerId", "==", officerId), where("password", "==", password));
    const snapshot = await getDocs(q);
    if (snapshot.empty) throw new Error("Invalid Officer ID or password");
    const adminDoc = snapshot.docs[0];
    const admin = { id: adminDoc.id, ...adminDoc.data() };
    setAdminProfile(admin);
    return admin;
  };

  const updateAdminProfile = async (adminData) => {
    if (!adminProfile?.id) return;
    
    if (adminData.officerId && adminData.officerId !== adminProfile.officerId) {
      const q = query(collection(db, "admins"), where("officerId", "==", adminData.officerId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) throw new Error("Officer ID already exists");
    }

    const updatedAdmin = { ...adminProfile, ...adminData };
    setAdminProfile(updatedAdmin);
    await updateDoc(doc(db, "admins", adminProfile.id), adminData);
  };

  const updateGuardian = async (guardianData) => {
    if (!currentUser?.id) return;
    const updatedUser = { ...currentUser, guardian: guardianData };
    setCurrentUser(updatedUser);
    await updateDoc(doc(db, "users", currentUser.id), { guardian: guardianData });
  };

  const updateCurrentUser = async (userData) => {
    if (!currentUser?.id) return;
    
    // Check if new username is unique if it changed
    if (userData.username && userData.username !== currentUser.username) {
      const q = query(collection(db, "users"), where("username", "==", userData.username));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) throw new Error("Username already taken");
    }

    const updatedUser = { ...currentUser, ...userData };
    setCurrentUser(updatedUser);
    await updateDoc(doc(db, "users", currentUser.id), userData);
  };


  
  // Persistent Audit Logs State
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('scam_shield_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dismissNotification = (id) => {
    setUserNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Helper to add audit log entries with actor identity tracking
  const addAuditLog = useCallback((action, reportId = null, rationale = '', details = '', performedBy = 'System Admin') => {
    const actor = adminProfile?.officerId || performedBy;
    const entry = {
      id: Date.now() + Math.random(),
      reportId,
      action,
      rationale,
      details,
      performedBy: actor,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [entry, ...prev]);
  }, [adminProfile]);

  // Sync audit logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('scam_shield_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn("Could not save audit logs to localStorage", e);
    }
  }, [auditLogs]);

  // Keep localStorage in sync for tests and offline state
  useEffect(() => {
    try {
      localStorage.setItem('scam_away_reports', JSON.stringify(reportsList));
    } catch (e) {
      console.warn("Could not save reports to localStorage", e);
    }
  }, [reportsList]);

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
        
        // NOTIFICATION LOGIC: Check for status changes on user's reports
        setReportsList(prevList => {
          if (prevList.length > 0) {
            reports.forEach(newReport => {
              const oldReport = prevList.find(r => r.id === newReport.id);
              if (oldReport && oldReport.status !== newReport.status && newReport.reporterId === 'rep_103') {
                setUserNotifications(prev => {
                  if (prev.some(n => n.reportId === newReport.id && n.newStatus === newReport.status)) return prev;
                  return [{
                    id: Date.now() + Math.random(),
                    reportId: newReport.id,
                    oldStatus: oldReport.status,
                    newStatus: newReport.status,
                    timestamp: new Date().toISOString()
                  }, ...prev];
                });
              }
            });
          }
          return reports;
        });
      }
    }, (error) => {
      console.warn("⚠️ [Firestore] Could not connect to Cloud Database. Using local fallback.", error?.message);
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
    const reportData = { ...newReport, id: Date.now(), reporterId: currentUser?.id || 'guest' };
    setReportsList(prev => [reportData, ...prev]);
    try {
      await addDoc(collection(db, "reports"), reportData);
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to write report to cloud:", e?.message);
    }
  }, [currentUser]);

  const updateReportStatus = useCallback(async (id, newStatus, rationale) => {
    setReportsList(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, rationale } : r));
    addAuditLog(`Case Status Updated to ${newStatus}`, id, rationale);
    try {
      const report = reportsList.find(r => r.id === id);
      if (report && report.firebaseId) {
        await updateDoc(doc(db, "reports", report.firebaseId), { status: newStatus, rationale });
      }
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to update status in cloud:", e?.message);
    }
  }, [reportsList, addAuditLog]);

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
    addAuditLog('Broadcast Threat Alert Published', null, alert.category || alert.message, alert.solution || '');
    try {
      await setDoc(doc(db, "system", "activeAlert"), alert);
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to update active alert in cloud:", e?.message);
    }
  }, [addAuditLog]);

  const addBlacklistItem = useCallback(async (type, value) => {
    if (!['phoneNumbers', 'urls', 'bankAccounts'].includes(type)) return;
    setBlacklist(prev => ({
      ...prev,
      [type]: Array.from(new Set([...prev[type], value]))
    }));
    addAuditLog(`Added to Blacklist (${type})`, null, `Value: ${value}`);
    try {
      const updatedList = Array.from(new Set([...blacklist[type], value]));
      await updateDoc(doc(db, "system", "blacklist"), {
        [type]: updatedList
      });
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to update blacklist in cloud:", e?.message);
    }
  }, [blacklist, addAuditLog]);

  const removeBlacklistItem = useCallback(async (type, value) => {
    if (!['phoneNumbers', 'urls', 'bankAccounts'].includes(type)) return;
    setBlacklist(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item !== value)
    }));
    addAuditLog(`Removed from Blacklist (${type})`, null, `Value: ${value}`);
    try {
      const updatedList = blacklist[type].filter(item => item !== value);
      await updateDoc(doc(db, "system", "blacklist"), {
        [type]: updatedList
      });
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to remove blacklist item in cloud:", e?.message);
    }
  }, [blacklist, addAuditLog]);

  const updateBlacklistItem = useCallback(async (type, oldValue, newValue) => {
    if (!['phoneNumbers', 'urls', 'bankAccounts'].includes(type)) return;
    setBlacklist(prev => ({
      ...prev,
      [type]: prev[type].map(item => item === oldValue ? newValue : item)
    }));
    addAuditLog(`Updated Blacklist Item (${type})`, null, `From: ${oldValue} -> To: ${newValue}`);
    try {
      const updatedList = blacklist[type].map(item => item === oldValue ? newValue : item);
      await updateDoc(doc(db, "system", "blacklist"), {
        [type]: updatedList
      });
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to update blacklist item in cloud:", e?.message);
    }
  }, [blacklist, addAuditLog]);


  const contextValue = useMemo(() => ({
    reportsList, addReport,    updateReportStatus, addAlert, activeAlert,
    reputationProfiles, updateReputation,
    blacklist, addBlacklistItem, removeBlacklistItem, updateBlacklistItem,
    adminProfile, setAdminProfile,
    currentUser, setCurrentUser,
    registerUser, loginUser, registerAdmin, loginAdmin, updateAdminProfile, updateGuardian, updateCurrentUser,
    auditLogs, addAuditLog
  }), [
    reportsList, addReport, activeAlert, auditLogs, userNotifications, dismissNotification,
    updateReportStatus, addAlert,
    reputationProfiles, updateReputation,
    blacklist, addBlacklistItem, removeBlacklistItem, updateBlacklistItem,
    adminProfile, currentUser, registerUser, loginUser, registerAdmin, loginAdmin, updateGuardian, updateCurrentUser
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
