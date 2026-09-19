import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, getDocs, getDoc, query, where, deleteDoc, runTransaction, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from '../config/firebase';
import { translateText } from '../utils/translateText';
import { hashPassword, sanitizeUserSession, isPasswordHashed } from '../utils/cryptoAuth';
import { normalizePhone, normalizeHostname, normalizeBankAccount } from '../utils/rulesEngine';
import { evaluateReportGrouping, getGroupedCases, unmergeReport, reassignReport, mergeCases, findSimilarReportsForConfirmation } from '../utils/caseGrouping';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

// Seed data
const INITIAL_REPORTS = [];

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

  // Sync Current User Session (Session Sanitization)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('scam_shield_user_session', JSON.stringify({ user: sanitizeUserSession(currentUser), timestamp: new Date().getTime() }));
    } else {
      localStorage.removeItem('scam_shield_user_session');
    }
  }, [currentUser]);

  // Sync Admin Profile Session (Session Sanitization)
  useEffect(() => {
    if (adminProfile) {
      localStorage.setItem('scam_shield_admin_session', JSON.stringify({ user: sanitizeUserSession(adminProfile), timestamp: new Date().getTime() }));
    } else {
      localStorage.removeItem('scam_shield_admin_session');
    }
  }, [adminProfile]);

  // Check if an email already exists in users or admins collection
  const checkEmailExists = async (email) => {
    if (!email) return false;
    const lowerEmail = email.trim().toLowerCase();

    // Check in users
    const qUsers = query(collection(db, "users"), where("email", "==", lowerEmail));
    const snapUsers = await getDocs(qUsers);
    if (!snapUsers.empty) return true;

    // Check in admins
    const qAdmins = query(collection(db, "admins"), where("email", "==", lowerEmail));
    const snapAdmins = await getDocs(qAdmins);
    if (!snapAdmins.empty) return true;

    return false;
  };

  // Auth Helpers
  const registerUser = useCallback(async (userData) => {
    const q = query(collection(db, "users"), where("username", "==", userData.username));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) throw new Error("Username already exists");

    if (userData.email) {
      const emailExists = await checkEmailExists(userData.email);
      if (emailExists) throw new Error("This email address is already registered.");
    }
    
    const hashedPassword = await hashPassword(userData.password);
    const userToSave = { ...userData, email: userData.email ? userData.email.toLowerCase() : '', password: hashedPassword };
    const docRef = await addDoc(collection(db, "users"), userToSave);
    const createdUser = sanitizeUserSession({ id: docRef.id, ...userToSave });
    setCurrentUser(createdUser);
    return createdUser;
  }, []);

  // Combined reset password function (Supports both Users and Admins)
  const resetPassword = useCallback(async (identifier, newPassword) => {
    if (!identifier || !newPassword) {
      throw new Error("Please fill in all fields");
    }

    const trimmedIdentifier = identifier.trim();
    const lowerIdentifier = trimmedIdentifier.toLowerCase();
    const hashedPassword = await hashPassword(newPassword);

    // 1. Search in 'users' collection (by username or email)
    const qUserByName = query(collection(db, "users"), where("username", "==", trimmedIdentifier));
    let snapshot = await getDocs(qUserByName);

    if (snapshot.empty) {
      const qUserByEmail = query(collection(db, "users"), where("email", "==", lowerIdentifier));
      snapshot = await getDocs(qUserByEmail);
    }

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      await updateDoc(doc(db, "users", userDoc.id), { password: hashedPassword });
      return true;
    }

    // 2. Search in 'admins' collection (by officerId or email)
    const qAdminById = query(collection(db, "admins"), where("officerId", "==", trimmedIdentifier));
    snapshot = await getDocs(qAdminById);

    if (snapshot.empty) {
      const qAdminByEmail = query(collection(db, "admins"), where("email", "==", lowerIdentifier));
      snapshot = await getDocs(qAdminByEmail);
    }

    if (!snapshot.empty) {
      const adminDoc = snapshot.docs[0];
      await updateDoc(doc(db, "admins", adminDoc.id), { password: hashedPassword });
      return true;
    }

    throw new Error("No user or admin account found with this ID/Username/Email");
  }, []);

  // Keep resetUserPassword as an alias for backward compatibility
  const resetUserPassword = resetPassword;
  const resetAdminPassword = resetPassword;

  const loginUser = useCallback(async (username, password) => {
    const cleanUsername = String(username || '').trim();
    let snapshot = await getDocs(query(collection(db, "users"), where("username", "==", cleanUsername)));
    if (snapshot.empty && cleanUsername.includes('@')) {
      snapshot = await getDocs(query(collection(db, "users"), where("email", "==", cleanUsername.toLowerCase())));
    }
    if (snapshot.empty) throw new Error("Invalid username or password");
    const userDoc = snapshot.docs[0];
    const data = userDoc.data();
    const storedPassword = data.password;
    const hashedInput = await hashPassword(password);

    let passwordValid = false;
    if (storedPassword === hashedInput) {
      passwordValid = true;
    } else if (storedPassword === password) {
      // Backward-compatibility: auto-upgrade legacy plaintext password to cryptographic hash
      passwordValid = true;
      await updateDoc(doc(db, "users", userDoc.id), { password: hashedInput });
    }

    if (!passwordValid) throw new Error("Invalid username or password");

    const user = sanitizeUserSession({ id: userDoc.id, ...data });
    setCurrentUser(user);
    return user;
  }, []);

  const registerAdmin = useCallback(async (adminData) => {
    const q = query(collection(db, "admins"), where("officerId", "==", adminData.officerId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) throw new Error("Officer ID already exists");

    if (adminData.email) {
      const emailExists = await checkEmailExists(adminData.email);
      if (emailExists) throw new Error("This email address is already registered.");
    }
    
    const hashedPassword = await hashPassword(adminData.password);
    const adminToSave = { ...adminData, email: adminData.email ? adminData.email.toLowerCase() : '', password: hashedPassword };
    const docRef = await addDoc(collection(db, "admins"), adminToSave);
    const createdAdmin = sanitizeUserSession({ id: docRef.id, ...adminToSave });
    setAdminProfile(createdAdmin);
    return createdAdmin;
  }, []);

  const loginAdmin = useCallback(async (officerId, password) => {
    const cleanOfficerId = String(officerId || '').trim();
    let snapshot = await getDocs(query(collection(db, "admins"), where("officerId", "==", cleanOfficerId)));
    if (snapshot.empty && cleanOfficerId.includes('@')) {
      snapshot = await getDocs(query(collection(db, "admins"), where("email", "==", cleanOfficerId.toLowerCase())));
    }
    if (snapshot.empty) throw new Error("Invalid Officer ID or password");
    const adminDoc = snapshot.docs[0];
    const data = adminDoc.data();
    const storedPassword = data.password;
    const hashedInput = await hashPassword(password);

    let passwordValid = false;
    if (storedPassword === hashedInput) {
      passwordValid = true;
    } else if (storedPassword === password) {
      // Backward-compatibility: auto-upgrade legacy plaintext password to cryptographic hash
      passwordValid = true;
      await updateDoc(doc(db, "admins", adminDoc.id), { password: hashedInput });
    }

    if (!passwordValid) throw new Error("Invalid Officer ID or password");

    const admin = sanitizeUserSession({ id: adminDoc.id, ...data });
    setAdminProfile(admin);
    return admin;
  }, []);

  const updateAdminProfile = useCallback(async (adminData) => {
    if (!adminProfile?.id) return;
    
    if (adminData.officerId && adminData.officerId !== adminProfile.officerId) {
      const q = query(collection(db, "admins"), where("officerId", "==", adminData.officerId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) throw new Error("Officer ID already exists");
    }

    const dataToUpdate = { ...adminData };
    if (dataToUpdate.password) {
      // Verify current password against stored hash in Firestore
      const adminDocSnap = await getDoc(doc(db, "admins", adminProfile.id));
      if (!adminDocSnap.exists()) throw new Error("Admin record not found");
      const storedPassword = adminDocSnap.data()?.password;
      const hashedCurrent = await hashPassword(adminData.currentPassword || '');
      if (storedPassword !== hashedCurrent && storedPassword !== adminData.currentPassword) {
        throw new Error("Current password is incorrect");
      }
      dataToUpdate.password = await hashPassword(dataToUpdate.password);
    }
    delete dataToUpdate.currentPassword;
    const updatedAdmin = sanitizeUserSession({ ...adminProfile, ...dataToUpdate });
    setAdminProfile(updatedAdmin);
    await updateDoc(doc(db, "admins", adminProfile.id), dataToUpdate);
  }, [adminProfile]);

  const updateGuardian = useCallback(async (guardianData) => {
    if (!currentUser?.id) return;
    const updatedUser = { ...currentUser, guardian: guardianData };
    setCurrentUser(updatedUser);
    await updateDoc(doc(db, "users", currentUser.id), { guardian: guardianData });
  }, [currentUser]);

  const updateCurrentUser = useCallback(async (userData) => {
    if (!currentUser?.id) return;
    
    // Check if new username is unique if it changed
    if (userData.username && userData.username !== currentUser.username) {
      const q = query(collection(db, "users"), where("username", "==", userData.username));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) throw new Error("Username already taken");
    }

    const dataToUpdate = { ...userData };
    if (dataToUpdate.password) {
      // Verify current password against stored hash in Firestore
      const userDocSnap = await getDoc(doc(db, "users", currentUser.id));
      if (!userDocSnap.exists()) throw new Error("User record not found");
      const storedPassword = userDocSnap.data()?.password;
      const hashedCurrent = await hashPassword(userData.currentPassword || '');
      if (storedPassword !== hashedCurrent && storedPassword !== userData.currentPassword) {
        throw new Error("Current password is incorrect");
      }
      dataToUpdate.password = await hashPassword(dataToUpdate.password);
    }
    delete dataToUpdate.currentPassword;
    const updatedUser = sanitizeUserSession({ ...currentUser, ...dataToUpdate });
    setCurrentUser(updatedUser);
    await updateDoc(doc(db, "users", currentUser.id), dataToUpdate);
  }, [currentUser]);

  const deleteCurrentUser = useCallback(async (password) => {
    const activeUser = currentUser || adminProfile;
    if (!activeUser?.id) throw new Error("No user logged in");
    
    const collectionName = (adminProfile && activeUser.officerId) ? "admins" : "users";
    const userDocSnap = await getDoc(doc(db, collectionName, activeUser.id));
    if (!userDocSnap.exists()) {
      throw new Error("User record not found");
    }
    
    const storedPassword = userDocSnap.data().password;
    const hashedInput = await hashPassword(password);
    if (storedPassword !== hashedInput && storedPassword !== password) {
      throw new Error("Incorrect password");
    }

    try {
      if (adminProfile && activeUser.officerId) {
        // Admin
        await deleteDoc(doc(db, "admins", activeUser.id));
        setAdminProfile(null);
      } else {
        // User
        await deleteDoc(doc(db, "users", activeUser.id));
        
        // Update reports
        const q = query(collection(db, "reports"), where("reporterId", "==", activeUser.id));
        const snapshot = await getDocs(q);
        const updatePromises = snapshot.docs.map(reportDoc => 
          updateDoc(doc(db, "reports", reportDoc.id), { reporterId: 'deleted-user' })

        );
        await Promise.all(updatePromises);
        
        setCurrentUser(null);
      }
      localStorage.removeItem('scam_shield_user_session');
      localStorage.removeItem('scam_shield_admin_session');
    } catch (e) {
      throw new Error("Failed to delete account: " + e.message);
    }
  }, [currentUser, adminProfile]);

  // Persistent Audit Logs State (excluding August audit logs)
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('scam_shield_audit_logs');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter(l => !l.timestamp || (!String(l.timestamp).startsWith('2026-08') && !String(l.timestamp).includes('-08-')))
        : [];
    } catch {
      return [];
    }
  });

  const dismissNotification = useCallback((id) => {
    setUserNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Fetch initial audit logs from Firestore (excluding August logs)
  useEffect(() => {
    const unsubAudit = onSnapshot(collection(db, "auditLogs"), (snapshot) => {
      const logs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(l => !l.timestamp || (!String(l.timestamp).startsWith('2026-08') && !String(l.timestamp).includes('-08-')));
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAuditLogs(logs);
    }, (error) => {
      console.warn("⚠️ [Firestore Audit Listener]", error?.message);
    });

    return () => unsubAudit();
  }, []);

  // [SEC-01] Auto-migrate legacy plaintext passwords in Firestore (admins and users) to SHA-256
  useEffect(() => {
    const migrateLegacyPlaintextPasswords = async () => {
      try {
        // 1. Check & upgrade users
        const usersSnap = await getDocs(collection(db, "users"));
        usersSnap.docs.forEach(async (uDoc) => {
          const uData = uDoc.data();
          if (uData.password && !isPasswordHashed(uData.password)) {
            const hashed = await hashPassword(uData.password);
            await updateDoc(doc(db, "users", uDoc.id), { password: hashed });
          }
        });

        // 2. Check & upgrade admins
        const adminsSnap = await getDocs(collection(db, "admins"));
        adminsSnap.docs.forEach(async (aDoc) => {
          const aData = aDoc.data();
          if (aData.password && !isPasswordHashed(aData.password)) {
            const hashed = await hashPassword(aData.password);
            await updateDoc(doc(db, "admins", aDoc.id), { password: hashed });
          }
        });
      } catch (e) {
        // Silently skip if offline or running in mock test environment
      }
    };

    migrateLegacyPlaintextPasswords();
  }, []);

  // Helper to add audit log entries with actor identity tracking
  const addAuditLog = useCallback((action, reportId = null, rationale = '', details = '', performedBy = 'System Admin') => {
    const actor = adminProfile?.officerId || performedBy;
    const entry = {
      reportId,
      action,
      rationale,
      details,
      performedBy: actor,
      officerId: adminProfile?.officerId || actor,
      officerName: adminProfile?.name || adminProfile?.fullName || '',
      department: adminProfile?.department || '',
      timestamp: new Date().toISOString()
    };
    
    // Write to Firestore (listener will update local state automatically)
    addDoc(collection(db, "auditLogs"), entry).catch(e => {
      console.warn("Failed to write audit log to Firestore:", e?.message);
      // Fallback: write to local state
      setAuditLogs(prev => [{ ...entry, id: Date.now() + Math.random() }, ...prev]);
    });
  }, [adminProfile]);

  // Keep localStorage in sync for tests and offline state
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
              if (oldReport && oldReport.status !== newReport.status && newReport.reporterId === currentUser?.id && !newReport.skipStatusNotification) {
                setUserNotifications(prev => {
                  if (prev.some(n => n.reportId === newReport.id && n.newStatus === newReport.status)) return prev;
                  return [{
                    id: Date.now() + Math.random(),
                    reportId: newReport.id,
                    reportCode: newReport.reportCode,
                    category: newReport.category,
                    oldStatus: oldReport.status,
                    newStatus: newReport.status,
                    rationale: newReport.rationale,
                    rationaleEn: newReport.rationaleEn,
                    rationaleMs: newReport.rationaleMs,
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

      unsubBlacklist();
      unsubAlert();
    };
  }, []);

  const addReport = useCallback(async (newReport) => {
    // SEC-02: Omit originalText to halt global PII leakage across Firestore and client state
    const { originalText: _unneededOriginalText, ...safeReport } = newReport;

    let nextNum = 1;
    try {
      const counterRef = doc(db, "system", "reportCounter");
      // DB-01: Atomic runTransaction concurrency lock for report counter
      await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        if (counterSnap.exists()) {
          nextNum = (counterSnap.data().count || 0) + 1;
        } else {
          nextNum = 1;
        }
        transaction.set(counterRef, { count: nextNum }, { merge: true });
      });
    } catch (e) {
      console.warn("⚠️ [Firestore] Transaction counter fallback:", e?.message);
      nextNum = Date.now() % 10000;
    }
    
    const reportCode = `#${String(nextNum).padStart(6, '0')}`;
    const reportId = Date.now();

    // AI & Rules-based Case Grouping Evaluation
    const groupingEval = evaluateReportGrouping(safeReport, reportsList);

    let caseId;
    let caseCode;
    let reportType = groupingEval.reportType;
    let aiClassification = groupingEval.aiClassification;
    let aiConfidence = groupingEval.aiConfidence;
    let matchingFactors = groupingEval.matchingFactors;
    let status = safeReport.status || 'unverified';
    let rationale = safeReport.rationale || '';

    if (groupingEval.shouldGroup && groupingEval.targetCaseId) {
      caseId = groupingEval.targetCaseId;
      caseCode = groupingEval.targetCase?.caseCode || `CASE-${caseId}`;
      status = groupingEval.inheritedStatus;
      if (groupingEval.targetCase?.rationale) {
        rationale = groupingEval.targetCase.rationale;
      }
    } else {
      caseId = `case_${reportId}`;
      caseCode = `CASE-${String(nextNum).padStart(6, '0')}`;
      reportType = 'ORIGINAL';
      aiClassification = 'ORIGINAL';
      aiConfidence = 100;
    }

    const reportData = {
      ...safeReport,
      id: reportId,
      reportCode,
      caseId,
      caseCode,
      reportType,
      aiClassification,
      aiConfidence,
      matchingFactors,
      status,
      rationale,
      isCaseRoot: reportType === 'ORIGINAL',
      reporterId: currentUser?.id || 'guest',
      timestamp: safeReport.timestamp || new Date().toISOString()
    };
    
    setReportsList(prev => [reportData, ...prev]);
    try {
      await addDoc(collection(db, "reports"), reportData);
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to write report to cloud:", e?.message);
    }
    return reportCode;
  }, [currentUser, reportsList]);

  const updateReportStatus = useCallback(async (id, newStatus, rationale) => {
    let rationaleEn = rationale;
    let rationaleMs = rationale;
    
    if (rationale) {
      try {
        rationaleMs = await translateText(rationale, 'en', 'ms');
        rationaleEn = await translateText(rationale, 'ms', 'en');
      } catch (_e) {}
    }

    const targetReport = reportsList.find(r => r.id === id || String(r.id) === String(id) || r.firebaseId === id);
    const targetCaseId = targetReport ? String(targetReport.caseId || targetReport.id) : null;
    const targetCaseCode = targetReport?.caseCode || (targetReport?.reportCode ? `CASE-${targetReport.reportCode.replace('#', '')}` : `CASE-${targetCaseId}`);

    // Reports directly belonging to this target case
    const directlyTargetedReports = reportsList.filter(r =>
      (r.id === id || String(r.id) === String(id) || r.firebaseId === id) ||
      (targetCaseId && String(r.caseId || r.id) === targetCaseId)
    );

    // If an admin confirms a case, find and auto-confirm all similar/duplicate pending reports
    const autoConfirmedCandidates = new Map();
    if (newStatus === 'confirmed' && directlyTargetedReports.length > 0) {
      const similarMatches = findSimilarReportsForConfirmation(directlyTargetedReports, reportsList);
      similarMatches.forEach(({ report: cand, matchType, matchReason }) => {
        const candId = String(cand.id || cand.firebaseId);
        autoConfirmedCandidates.set(candId, {
          candidate: cand,
          matchType,
          matchReason
        });
      });
    }

    setReportsList(prev => prev.map(r => {
      const rId = String(r.id || r.firebaseId);
      const isDirectMatch = (r.id === id || String(r.id) === String(id) || r.firebaseId === id) ||
                            (targetCaseId && String(r.caseId || r.id) === targetCaseId);
      if (isDirectMatch) {
        return { ...r, status: newStatus, rationale, rationaleEn, rationaleMs };
      }

      if (autoConfirmedCandidates.has(rId)) {
        const { matchType } = autoConfirmedCandidates.get(rId);
        return {
          ...r,
          status: 'confirmed',
          caseId: targetCaseId,
          caseCode: targetCaseCode,
          reportType: matchType,
          aiClassification: matchType,
          rationale,
          rationaleEn,
          rationaleMs
        };
      }

      return r;
    }));

    addAuditLog(`Case Status Updated to ${newStatus}`, id, rationale);

    // Audit log for auto-confirmed similar/duplicate cases
    autoConfirmedCandidates.forEach(({ candidate: cand, matchType, matchReason }) => {
      addAuditLog(
        `Auto-Confirmed ${matchType === 'DUPLICATE' ? 'Duplicate' : 'Similar'} Report #${cand.reportCode || cand.id}`,
        cand.id,
        `Auto-grouped into Case ${targetCaseCode} (${matchReason})`
      );
    });

    try {
      // Sync direct reports to Firestore
      for (const r of directlyTargetedReports) {
        if (r.firebaseId) {
          await updateDoc(doc(db, "reports", r.firebaseId), {
            status: newStatus,
            rationale,
            rationaleEn,
            rationaleMs
          });
        }
      }

      // Sync auto-confirmed reports to Firestore
      for (const { candidate: cand, matchType } of autoConfirmedCandidates.values()) {
        if (cand.firebaseId) {
          await updateDoc(doc(db, "reports", cand.firebaseId), {
            status: 'confirmed',
            caseId: targetCaseId,
            caseCode: targetCaseCode,
            reportType: matchType,
            aiClassification: matchType,
            rationale,
            rationaleEn,
            rationaleMs
          });
        }
      }
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to update status in cloud:", e?.message);
    }
  }, [reportsList, addAuditLog]);

  // Admin Case Correction: Unmerge Report
  const unmergeReportAction = useCallback(async (reportId) => {
    const result = unmergeReport(reportId, reportsList);
    if (!result.detachedReport) return;
    setReportsList(result.updatedReportsList);

    addAuditLog(
      `Admin Unmerged Report #${result.detachedReport.reportCode || reportId}`,
      reportId,
      `Detached from Case ${result.oldCaseId} into new Pending Case ${result.newCaseId}`
    );

    try {
      const target = result.detachedReport;
      if (target.firebaseId) {
        await updateDoc(doc(db, "reports", target.firebaseId), {
          caseId: result.newCaseId,
          caseCode: `CASE-${(target.reportCode || '').replace('#', '')}`,
          reportType: 'ORIGINAL',
          aiClassification: 'ORIGINAL',
          isCaseRoot: true,
          status: 'unverified',
          rationale: '',
          rationaleEn: '',
          rationaleMs: '',
          unmergedFromCaseId: result.oldCaseId,
          unmergedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to unmerge report in cloud:", e?.message);
    }
  }, [reportsList, addAuditLog]);

  // Admin Case Correction: Reassign Report
  const reassignReportAction = useCallback(async (reportId, targetCaseId) => {
    const result = reassignReport(reportId, targetCaseId, reportsList);
    if (!result.reassignedReport) return;
    setReportsList(result.updatedReportsList);

    addAuditLog(
      `Admin Reassigned Report #${result.reassignedReport.reportCode || reportId}`,
      reportId,
      `Moved from Case ${result.oldCaseId} to Case ${result.targetCaseId}`
    );

    try {
      const target = result.reassignedReport;
      if (target.firebaseId) {
        const destCase = getGroupedCases(reportsList).find(c => c.caseId === String(targetCaseId));
        await updateDoc(doc(db, "reports", target.firebaseId), {
          caseId: targetCaseId,
          caseCode: destCase?.caseCode || `CASE-${targetCaseId}`,
          status: destCase?.status || 'unverified',
          rationale: destCase?.rationale || '',
          rationaleEn: destCase?.rationaleEn || '',
          rationaleMs: destCase?.rationaleMs || '',
          reassignedFromCaseId: result.oldCaseId,
          reassignedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to reassign report in cloud:", e?.message);
    }
  }, [reportsList, addAuditLog]);

  // Admin Case Correction: Merge Cases
  const mergeCasesAction = useCallback(async (sourceCaseId, targetCaseId) => {
    const result = mergeCases(sourceCaseId, targetCaseId, reportsList);
    if (result.mergedCount === 0) return;
    setReportsList(result.updatedReportsList);

    addAuditLog(
      `Admin Merged Cases`,
      null,
      `Merged Case ${sourceCaseId} (${result.mergedCount} reports) into Case ${targetCaseId}`
    );

    try {
      const destCase = getGroupedCases(reportsList).find(c => c.caseId === String(targetCaseId));
      const reportsToUpdate = reportsList.filter(r => String(r.caseId || r.id) === String(sourceCaseId));
      for (const r of reportsToUpdate) {
        if (r.firebaseId) {
          await updateDoc(doc(db, "reports", r.firebaseId), {
            caseId: targetCaseId,
            caseCode: destCase?.caseCode || `CASE-${targetCaseId}`,
            status: destCase?.status || 'unverified',
            rationale: destCase?.rationale || '',
            rationaleEn: destCase?.rationaleEn || '',
            rationaleMs: destCase?.rationaleMs || '',
            mergedFromCaseId: sourceCaseId,
            mergedAt: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to merge cases in cloud:", e?.message);
    }
  }, [reportsList, addAuditLog]);

  // Option B: Hide from user's personal tracking list without canceling police investigation
  const cancelUserReport = useCallback(async (id) => {
    setReportsList(prev => prev.map(r => (r.id === id || String(r.id) === String(id) || r.firebaseId === id) ? { ...r, hiddenByReporter: true } : r));
    try {
      const report = reportsList.find(r => r.id === id || String(r.id) === String(id) || r.firebaseId === id);
      if (report && report.firebaseId) {
        await updateDoc(doc(db, "reports", report.firebaseId), { hiddenByReporter: true });
      }
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to hide report in cloud:", e?.message);
    }
  }, [reportsList]);

  const restoreUserReport = useCallback(async (id) => {
    setReportsList(prev => prev.map(r => {
      if (r.id === id || String(r.id) === String(id) || r.firebaseId === id) {
        return {
          ...r,
          hiddenByReporter: false,
          status: r.status === 'cancelled' ? 'unverified' : r.status
        };
      }
      return r;
    }));
    try {
      const report = reportsList.find(r => r.id === id || String(r.id) === String(id) || r.firebaseId === id);
      if (report && report.firebaseId) {
        const updateData = { hiddenByReporter: false };
        if (report.status === 'cancelled') {
          updateData.status = 'unverified';
        }
        await updateDoc(doc(db, "reports", report.firebaseId), updateData);
      }
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to restore report in cloud:", e?.message);
    }
  }, [reportsList]);

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
    if (!['phoneNumbers', 'urls', 'bankAccounts'].includes(type)) return { success: false };
    
    const normalizers = {
      phoneNumbers: normalizePhone,
      bankAccounts: normalizeBankAccount,
      urls: normalizeHostname,
    };
    const normFn = normalizers[type] || ((v) => v);
    const normValue = normFn(value);

    // Check if duplicate exists (treating formats like 011-8762512 and 0118762512 as identical)
    const existingMatch = blacklist[type]?.find(item => normFn(item) === normValue);
    if (existingMatch) {
      return { success: false, duplicate: true, existingMatch, normalized: normValue };
    }

    setBlacklist(prev => ({
      ...prev,
      [type]: Array.from(new Set([...prev[type], normValue]))
    }));
    addAuditLog(`Added to Blacklist (${type})`, null, `Value: ${normValue}`);
    try {
      // DB-02: Use Firestore arrayUnion for atomic mutation
      await updateDoc(doc(db, "system", "blacklist"), {
        [type]: arrayUnion(normValue)
      });
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to update blacklist in cloud:", e?.message);
    }
    return { success: true, value: normValue };
  }, [blacklist, addAuditLog]);

  const removeBlacklistItem = useCallback(async (type, value) => {
    if (!['phoneNumbers', 'urls', 'bankAccounts'].includes(type)) return;
    const normalizers = {
      phoneNumbers: normalizePhone,
      bankAccounts: normalizeBankAccount,
      urls: normalizeHostname,
    };
    const normFn = normalizers[type] || ((v) => v);
    const normValue = normFn(value);

    setBlacklist(prev => ({
      ...prev,
      [type]: prev[type].filter(item => normFn(item) !== normValue && item !== value)
    }));
    addAuditLog(`Removed from Blacklist (${type})`, null, `Value: ${value}`);
    try {
      // DB-02: Use Firestore arrayRemove for atomic mutation
      await updateDoc(doc(db, "system", "blacklist"), {
        [type]: arrayRemove(value)
      });
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to remove blacklist item in cloud:", e?.message);
    }
  }, [addAuditLog]);


  const updateBlacklistItem = useCallback(async (type, oldValue, newValue) => {
    if (!['phoneNumbers', 'urls', 'bankAccounts'].includes(type)) return;
    const normalizers = {
      phoneNumbers: normalizePhone,
      bankAccounts: normalizeBankAccount,
      urls: normalizeHostname,
    };
    const normFn = normalizers[type] || ((v) => v);
    const normNewValue = normFn(newValue);
    if (!normNewValue) return;

    setBlacklist(prev => ({
      ...prev,
      [type]: prev[type].map(item => (item === oldValue || normFn(item) === normFn(oldValue)) ? normNewValue : item)
    }));
    addAuditLog(`Updated Blacklist Item (${type})`, null, `From: ${oldValue} -> To: ${normNewValue}`);
    try {
      const updatedList = blacklist[type].map(item => (item === oldValue || normFn(item) === normFn(oldValue)) ? normNewValue : item);
      await updateDoc(doc(db, "system", "blacklist"), {
        [type]: updatedList
      });
    } catch (e) {
      console.warn("⚠️ [Firestore] Failed to update blacklist item in cloud:", e?.message);
    }
  }, [blacklist, addAuditLog]);

  const contextValue = useMemo(() => ({
    reportsList, addReport, updateReportStatus, cancelUserReport, restoreUserReport, addAlert, activeAlert,
    unmergeReportAction, reassignReportAction, mergeCasesAction,
    blacklist, addBlacklistItem, removeBlacklistItem, updateBlacklistItem,
    adminProfile, setAdminProfile,
    currentUser, setCurrentUser,
    registerUser, loginUser, registerAdmin, loginAdmin, updateAdminProfile, updateGuardian, updateCurrentUser, deleteCurrentUser,
    resetPassword, resetUserPassword, resetAdminPassword, // Export resetAdminPassword
    auditLogs, addAuditLog,
    userNotifications, dismissNotification
  }), [
    // State values that actually change
    reportsList, activeAlert, auditLogs, userNotifications,
    blacklist, adminProfile, currentUser,
    // Stable useCallback function references (only change when their own deps change)
    addReport, updateReportStatus, cancelUserReport, restoreUserReport, addAlert,
    unmergeReportAction, reassignReportAction, mergeCasesAction,
    addBlacklistItem, removeBlacklistItem, updateBlacklistItem,
    registerUser, loginUser, registerAdmin, loginAdmin,
    updateAdminProfile, updateGuardian, updateCurrentUser, deleteCurrentUser,
    resetPassword, resetUserPassword, resetAdminPassword,
    addAuditLog, dismissNotification
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};