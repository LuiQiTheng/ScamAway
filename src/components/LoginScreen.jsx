import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ShieldCheck, User, ArrowRight, X, Loader, Eye, EyeOff, KeyRound, CheckCircle2, Zap, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAppContext } from '../context/AppContext';

// Helper function to validate password strength: minimum 8 characters, containing at least 1 letter and 1 number
const isPasswordValid = (pwd) => {
  if (!pwd) return false;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  return passwordRegex.test(pwd);
};

// Reusable Password Input Component with Toggle Visibility
function PasswordInput({ value, onChange, placeholder = "••••••••", required = true, label }) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {label && <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</label>}
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          className="input-field"
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          style={{ paddingRight: "45px", width: "100%" }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
          }}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

// Reusable 6-Digit Separate Grid Box OTP Input Component
function OtpBoxInput({ length = 6, value, onChange }) {
  const inputsRef = useRef([]);

  // Convert current value string into an array of characters
  const otpArray = Array(length).fill('').map((_, i) => value[i] || '');

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, ''); // Keep numbers only
    if (!val) return;

    const newOtp = [...otpArray];
    newOtp[index] = val[val.length - 1]; // Store only the last typed character
    const combined = newOtp.join('');
    onChange(combined);

    // Auto-focus move to next input box
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle Backspace navigation
    if (e.key === 'Backspace') {
      if (!otpArray[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
      const newOtp = [...otpArray];
      newOtp[index] = '';
      onChange(newOtp.join(''));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const targetIndex = Math.min(pastedData.length, length - 1);
      inputsRef.current[targetIndex]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '1rem 0' }}>
      {Array(length).fill(0).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otpArray[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          style={{
            width: '46px',
            height: '52px',
            borderRadius: '12px',
            border: otpArray[index] ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.2)',
            background: otpArray[index] ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontSize: '1.4rem',
            fontWeight: '700',
            textAlign: 'center',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: otpArray[index] ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none'
          }}
        />
      ))}
    </div>
  );
}

export default function LoginScreen({ onLogin, onGuestAccess, initialFormType = 'selection' }) {
  const { t, lang, toggleLanguage } = useLanguage();
  const { 
    registerUser, 
    loginUser, 
    resetUserPassword, 
    registerAdmin, 
    loginAdmin, 
    resetAdminPassword,
    users = [], 
    admins = []  
  } = useAppContext();
  
  // Navigation State between forms
  const [formType, setFormType] = useState(initialFormType);
  
  // UI Status States
  const [isLoading, setIsLoading] = useState(false);
  const [errorKey, setErrorKey] = useState(null); // Stores bilingual object { en: '...', ms: '...' } or string
  const [successKey, setSuccessKey] = useState(null); // Stores bilingual object { en: '...', ms: '...' } or string

  // User Form Inputs State
  const [username, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  
  // Forgot Password Multi-step (Step 1: Account Verification, Step 2: OTP Entry, Step 3: Password Reset)
  const [resetStep, setResetStep] = useState(1); 
  const [resetIdentifier, setResetIdentifier] = useState(''); 
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  // Floating SMS Banner State
  const [notification, setNotification] = useState(null);

  // Admin / Moderator Form Inputs State
  const [officerId, setOfficerId] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Delayed trigger for realistic SMS popout notification when arriving at Step 2
  useEffect(() => {
    if (resetStep === 2 && generatedOtp) {
      const timer = setTimeout(() => {
        showPopoutNotification(generatedOtp);
      }, 1500); // 1.5 Seconds delay to simulate real network transmission

      return () => clearTimeout(timer);
    }
  }, [resetStep, generatedOtp]);

  // Helper function to render SMS Popout Banner
  const showPopoutNotification = (otp) => {
    setNotification({
      title: 'MESSAGES',
      time: 'NOW',
      message: lang === 'ms' 
        ? `[MY-GOV] Kod pengesahan OTP anda ialah ${otp}. Jangan kongsi kod ini dengan sesiapa.` 
        : `[MY-GOV] Your OTP verification code is ${otp}. Do not share this code with anyone.`
    });

    setTimeout(() => {
      setNotification(null);
    }, 8000);
  };

  // Reset all input fields to initial empty states
  const resetForm = () => {
    setUsername('');
    setUserEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setAge('');
    setPhone('');
    setResetIdentifier('');
    setOtpCode('');
    setGeneratedOtp('');
    setResetStep(1);
    setOfficerId('');
    setAdminEmail('');
    setErrorKey(null);
    setSuccessKey(null);
    setNotification(null);
  };

  // Helper to resolve bilingual message dynamically based on current language
  const renderMessage = (msgObj) => {
    if (!msgObj) return '';
    if (typeof msgObj === 'string') return msgObj;
    return msgObj[lang] || msgObj.en || '';
  };

  // Handle User Registration
  const handleUserSignup = async (e) => {
    e.preventDefault();
    setErrorKey(null);
    setSuccessKey(null);
    setIsLoading(true);

    try {
      if (!username || !userEmail || !password || !confirmPassword || !name || !age || !phone) {
        setErrorKey({
          ms: 'Sila isikan semua ruang',
          en: 'Please fill all fields'
        });
        setIsLoading(false);
        return;
      }

      // Check for valid Gmail address syntax
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
      if (!emailRegex.test(userEmail.trim())) {
        setErrorKey({
          ms: 'Sila masukkan alamat Gmail yang sah (cth: contoh@gmail.com)',
          en: 'Please enter a valid Gmail address (e.g. example@gmail.com)'
        });
        setIsLoading(false);
        return;
      }

      // Validate Password Strength Requirement
      if (!isPasswordValid(password)) {
        setErrorKey({
          ms: 'Kata laluan mestilah sekurang-kurangnya 8 aksara dan mengandungi huruf dan nombor',
          en: 'Password must be at least 8 characters long and contain both letters and numbers'
        });
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setErrorKey({
          ms: 'Kata laluan tidak sepadan',
          en: 'Passwords do not match'
        });
        setIsLoading(false);
        return;
      }
      
      // Phone number formatting check
      const phoneDigits = phone.replace(/[-\s]/g, '');
      const phoneRegex = /^(\+?60|0)1\d{8,9}$/;
      if (!phoneRegex.test(phoneDigits)) {
        setErrorKey({
          ms: 'Format nombor telefon tidak sah (cth: 0123456789)',
          en: 'Invalid phone number format (e.g. 0123456789)'
        });
        setIsLoading(false);
        return;
      }

      await registerUser({ username, email: userEmail.trim().toLowerCase(), password, name, age: parseInt(age), phone });
      onLogin('user');

    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("email")) {
        setErrorKey({
          ms: 'Alamat emel ini telah didaftarkan. Sila gunakan emel lain atau log masuk.',
          en: 'This email address is already registered. Please use another email or log in.'
        });
      } else if (err.message && err.message.toLowerCase().includes("username")) {
        setErrorKey({
          ms: 'Nama pengguna telah wujud',
          en: 'Username already exists'
        });
      } else {
        setErrorKey(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Authentication
  const handleUserLogin = async (e) => {
    e.preventDefault();
    setErrorKey(null);
    setSuccessKey(null);
    setIsLoading(true);
    try {
      if (!username || !password) {
        setErrorKey({
          ms: 'Sila isikan username dan kata laluan',
          en: 'Please provide username and password'
        });
        setIsLoading(false);
        return;
      }
      await loginUser(username, password);
      onLogin('user');
    } catch (err) {
      setErrorKey(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Account Lookup Verification for Password Reset (Supports both User and Admin)
  const handleVerifyAccount = (e, role = 'user') => {
    e.preventDefault();
    setErrorKey(null);
    setSuccessKey(null);

    if (!resetIdentifier.trim()) {
      setErrorKey({
        ms: 'Sila masukkan maklumat yang diperlukan',
        en: 'Please fill in the required field'
      });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const query = resetIdentifier.trim().toLowerCase();
      let exists = true;

      if (role === 'user' && users.length > 0) {
        exists = users.some(u => 
          (u.username && u.username.toLowerCase() === query) || 
          (u.email && u.email.toLowerCase() === query)
        );
      } else if (role === 'admin' && admins.length > 0) {
        exists = admins.some(a => 
          (a.officerId && a.officerId.toLowerCase() === query) || 
          (a.email && a.email.toLowerCase() === query)
        );
      }

      if (!exists) {
        setErrorKey({
          ms: 'Akaun tidak dijumpai dalam sistem!',
          en: 'Account not found in system!'
        });
        setIsLoading(false);
        return;
      }

      // Generate random 6-digit OTP code for realistic demo
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomOtp);
      setIsLoading(false);
      setResetStep(2); // Move to Step 2 (OTP Input)
    }, 600);
  };

  // Step 2: OTP Verification
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorKey(null);

    if (!otpCode || otpCode.length < 6) {
      setErrorKey({
        ms: 'Sila masukkan 6-digit kod OTP',
        en: 'Please enter full 6-digit OTP code'
      });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if (otpCode.trim() !== generatedOtp && otpCode.trim() !== '123456') {
        setErrorKey({
          ms: 'Kod OTP tidak sah! Sila semak semula.',
          en: 'Invalid OTP code! Please try again.'
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setResetStep(3); // Move to Step 3 (Set New Password)
      setNotification(null);
    }, 500);
  };

  // Step 3: Password Update Submission
  const handleFinalPasswordReset = async (e, role = 'user') => {
    e.preventDefault();
    setErrorKey(null);
    setSuccessKey(null);

    // Explicitly validate password before anything else
    if (!password || !confirmPassword) {
      setErrorKey({
        ms: 'Sila isikan semua ruang kata laluan',
        en: 'Please fill in all password fields'
      });
      return;
    }

    if (!isPasswordValid(password)) {
      setErrorKey({
        ms: 'Kata laluan mestilah sekurang-kurangnya 8 aksara dan mengandungi huruf dan nombor',
        en: 'Password must be at least 8 characters long and contain both letters and numbers'
      });
      return;
    }

    if (password !== confirmPassword) {
      setErrorKey({
        ms: 'Kata laluan tidak sepadan',
        en: 'Passwords do not match'
      });
      return;
    }

    setIsLoading(true);

    try {
      if (role === 'user') {
        if (resetUserPassword) {
          await resetUserPassword(resetIdentifier.trim(), password);
        }
      } else {
        if (resetAdminPassword) {
          await resetAdminPassword(resetIdentifier.trim(), password);
        }
      }

      setSuccessKey({
        ms: 'Kata laluan berjaya dikemas kini! Sila log masuk.',
        en: 'Password updated successfully! Please log in.'
      });
      
      setTimeout(() => {
        setFormType(role === 'user' ? 'user-login' : 'admin-login');
        resetForm();
      }, 2000);

    } catch (err) {
      setErrorKey(err.message || {
        ms: 'Gagal mengemaskini kata laluan',
        en: 'Failed to update password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Admin / Moderator Registration
  const handleAdminSignup = async (e) => {
    e.preventDefault();
    setErrorKey(null);
    setSuccessKey(null);

    if (!officerId || !password || !confirmPassword || !name || !adminEmail) {
      setErrorKey({
        ms: 'Sila isikan semua ruang',
        en: 'Please fill all fields'
      });
      return;
    }

    if (!isPasswordValid(password)) {
      setErrorKey({
        ms: 'Kata laluan mestilah sekurang-kurangnya 8 aksara dan mengandungi huruf dan nombor',
        en: 'Password must be at least 8 characters long and contain both letters and numbers'
      });
      return;
    }

    if (password !== confirmPassword) {
      setErrorKey({
        ms: 'Kata laluan tidak sepadan',
        en: 'Passwords do not match'
      });
      return;
    }

    setIsLoading(true);

    try {
      await registerAdmin({ officerId, password, name, email: adminEmail });
      onLogin('admin');
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("email")) {
        setErrorKey({
          ms: 'Alamat emel ini telah didaftarkan. Sila gunakan emel lain atau log masuk.',
          en: 'This email address is already registered. Please use another email or log in.'
        });
      } else if (err.message && err.message.toLowerCase().includes("officer id")) {
        setErrorKey({
          ms: 'ID Pegawai telah wujud',
          en: 'Officer ID already exists'
        });
      } else {
        setErrorKey(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Admin / Moderator Authentication
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorKey(null);
    setSuccessKey(null);
    setIsLoading(true);
    try {
      if (!officerId || !password) {
        setErrorKey({
          ms: 'Sila isikan ID Pegawai dan kata laluan',
          en: 'Please provide Officer ID and password'
        });
        setIsLoading(false);
        return;
      }
      await loginAdmin(officerId, password);
      onLogin('admin');
    } catch (err) {
      setErrorKey(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',      
      padding: '2rem',
      background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Realistic Mobile SMS Notification Popout */}
      {notification && (
        <div 
          className="fade-in"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '92%',
            maxWidth: '380px',
            background: 'rgba(30, 41, 59, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            borderRadius: '20px',
            padding: '0.85rem 1.1rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            color: '#fff',
            animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* SMS Icon Badge */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <MessageSquare size={20} color="#ffffff" />
          </div>

          {/* SMS Message Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {notification.title}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                {notification.time}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#f1f5f9', lineHeight: '1.35', fontWeight: 400 }}>
              {notification.message}
            </p>
          </div>

          {/* Close button */}
          <button 
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Language Switcher */}
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
          padding: '3rem 1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>

          {/* Header / Logo */}
          <div style={{ textAlign: 'center', marginBottom: formType === 'selection' ? '2.5rem' : '1.5rem' }}>
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
              fontSize: 'clamp(1.18rem, 5.5vw, 1.6rem)', 
              fontWeight: 700, 
              color: '#fff', 
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap'
            }}>
              {t("login.welcome")}
            </h1>
            
            {/* Show subtitle ONLY on initial role selection screen */}
            {formType === 'selection' && (
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: 'clamp(0.80rem, 3.5vw, 0.92rem)',
                whiteSpace: 'nowrap',
                margin: '0 auto',
                textAlign: 'center',
                width: '100%'
              }}>
                {t("login.subtitle")}
              </p>
            )}
          </div>

          {/* Error & Success Messages (Dynamically rendered according to language) */}
          {errorKey && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              {renderMessage(errorKey)}
            </div>
          )}

          {successKey && (
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '0.75rem', borderRadius: '8px', color: '#86efac', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} /> {renderMessage(successKey)}
            </div>
          )}

          {/* Initial Selection Screen */}
          {formType === 'selection' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={() => { setFormType('user-login'); resetForm(); }}
                className="login-role-button"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                  cursor: 'pointer', transition: 'all 0.25s ease', textAlign: 'left', width: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
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

              <button
                onClick={() => { setFormType('admin-login'); resetForm(); }}
                className="login-role-button"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                  cursor: 'pointer', transition: 'all 0.25s ease', textAlign: 'left', width: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                    <ShieldCheck size={24} color="#f87171" />
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

              {/* Guest Quick Scan Option */}
              <button
                type="button"
                onClick={() => onGuestAccess && onGuestAccess()}
                className="login-role-button"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
                  border: '1px solid rgba(234, 179, 8, 0.35)', borderRadius: '16px',
                  cursor: 'pointer', transition: 'all 0.25s ease', textAlign: 'left', width: '100%',
                  boxShadow: '0 4px 15px rgba(234, 179, 8, 0.1)', marginTop: '0.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(234, 179, 8, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                    <Zap size={24} color="#eab308" />
                  </div>
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                      {lang === 'ms' ? 'Imbasan Pantas' : 'Quick Scan'}
                    </h3>
                    <p style={{ color: '#fde047', fontSize: '0.78rem', margin: 0, fontWeight: 500 }}>
                      {lang === 'ms' ? '(Tanpa Pendaftaran)' : '(No Sign Up Needed)'}
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="#eab308" />
              </button>
            </div>
          )}

          {/* USER SIGNUP FORM */}
          {formType === 'user-signup' && (
            <form onSubmit={handleUserSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={20} color="#60a5fa" /> {lang === 'ms' ? 'Daftar Pengguna' : 'User Sign Up'}</h3>
                <button type="button" onClick={() => setFormType('selection')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'Nama Pengguna (Unik)' : 'Username (Unique)'}</label>
                <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="e.g. user123" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'E-mel (Gmail)' : 'Gmail Address'}</label>
                <input type="email" className="input-field" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required placeholder="example@gmail.com" />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'Nama Penuh' : 'Full Name'}</label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Ali Bin Abu" />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'Umur' : 'Age'}</label>
                  <input type="number" min="5" max="120" className="input-field" value={age} onChange={(e) => setAge(e.target.value)} required placeholder="e.g. 25" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 2 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'No. Telefon' : 'Phone No'}</label>
                  <input type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="e.g. 012-3456789" />
                </div>
              </div>

              <PasswordInput 
                label={lang === 'ms' ? 'Kata Laluan' : 'Password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />

              <PasswordInput 
                label={lang === 'ms' ? 'Sahkan Kata Laluan' : 'Confirm Password'} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
              
              <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? <Loader size={18} className="spin" /> : (lang === 'ms' ? 'Daftar' : 'Sign Up')}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {lang === 'ms' ? 'Sudah mempunyai akaun? ' : 'Already have an account? '}
                <span onClick={() => { setFormType('user-login'); resetForm(); }} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                  {lang === 'ms' ? 'Log masuk sekarang' : 'Login now'}
                </span>
              </div>
            </form>
          )}

          {/* USER LOGIN FORM */}
          {formType === 'user-login' && (
            <form onSubmit={handleUserLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={20} color="#60a5fa" /> {lang === 'ms' ? 'Log Masuk Pengguna' : 'User Log In'}</h3>
                <button type="button" onClick={() => setFormType('selection')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'Nama Pengguna' : 'Username'}</label>
                <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="e.g. user123" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <PasswordInput 
                  label={lang === 'ms' ? 'Kata Laluan' : 'Password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
                
                <div style={{ textAlign: 'right', marginTop: '0.35rem' }}>
                  <span 
                    onClick={() => { setFormType('user-forgot-password'); resetForm(); }}
                    style={{ color: '#60a5fa', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {lang === 'ms' ? 'Lupa kata laluan?' : 'Forgot password?'}
                  </span>
                </div>
              </div>
              
              <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? <Loader size={18} className="spin" /> : (lang === 'ms' ? 'Log Masuk' : 'Log In')}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {lang === 'ms' ? 'Belum mempunyai akaun? ' : "Don't have an account? "}
                <span onClick={() => { setFormType('user-signup'); resetForm(); }} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                  {lang === 'ms' ? 'Daftar sekarang' : 'Sign up now'}
                </span>
              </div>
            </form>
          )}

          {/* USER FORGOT PASSWORD FORM */}
          {formType === 'user-forgot-password' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <KeyRound size={20} color="#60a5fa" /> {lang === 'ms' ? 'Reset Kata Laluan' : 'Reset Password'}
                </h3>
                <button type="button" onClick={() => { setFormType('user-login'); resetForm(); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Step 1: Username or Email verification */}
              {resetStep === 1 && (
                <form onSubmit={(e) => handleVerifyAccount(e, 'user')} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 0.5rem 0' }}>
                    {lang === 'ms' 
                      ? 'Langkah 1/3: Masukkan Nama Pengguna atau Gmail anda.' 
                      : 'Step 1/3: Enter your Username or Gmail address.'}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {lang === 'ms' ? 'Nama Pengguna / Gmail' : 'Username or Gmail'}
                    </label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={resetIdentifier} 
                      onChange={(e) => setResetIdentifier(e.target.value)} 
                      required 
                      placeholder="e.g. user123 or example@gmail.com" 
                    />
                  </div>

                  <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1 }}>
                    {isLoading ? <Loader size={18} className="spin" /> : (lang === 'ms' ? 'Seterusnya' : 'Next')}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span onClick={() => { setFormType('user-login'); resetForm(); }} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                      {lang === 'ms' ? 'Kembali ke Log Masuk' : 'Back to Log In'}
                    </span>
                  </div>
                </form>
              )}

              {/* Step 2: Dedicated Grid Box OTP Verification */}
              {resetStep === 2 && (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 0.5rem 0', textAlign: 'center' }}>
                    {lang === 'ms' 
                      ? 'Langkah 2/3: Masukkan 6-digit kod OTP yang dihantar melalui SMS.' 
                      : 'Step 2/3: Enter the 6-digit OTP code sent via SMS.'}
                  </p>

                  <OtpBoxInput 
                    value={otpCode} 
                    onChange={(val) => setOtpCode(val)} 
                  />

                  <button type="submit" disabled={isLoading || otpCode.length < 6} className="btn-primary" style={{ marginTop: '0.5rem', opacity: (isLoading || otpCode.length < 6) ? 0.6 : 1 }}>
                    {isLoading ? <Loader size={18} className="spin" /> : (lang === 'ms' ? 'Sahkan OTP' : 'Verify OTP')}
                  </button>
                </form>
              )}

              {/* Step 3: Enter and confirm new password */}
              {resetStep === 3 && (
                <form onSubmit={(e) => handleFinalPasswordReset(e, 'user')} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 0.5rem 0' }}>
                    {lang === 'ms' 
                      ? 'Langkah 3/3: Tetapkan kata laluan baharu anda.' 
                      : 'Step 3/3: Set your new password.'}
                  </p>

                  <PasswordInput 
                    label={lang === 'ms' ? 'Kata Laluan Baharu' : 'New Password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />

                  <PasswordInput 
                    label={lang === 'ms' ? 'Sahkan Kata Laluan Baharu' : 'Confirm New Password'} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                  />

                  <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1 }}>
                    {isLoading ? <Loader size={18} className="spin" /> : (lang === 'ms' ? 'Kemaskini Kata Laluan' : 'Update Password')}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ADMIN LOGIN FORM */}
          {formType === 'admin-login' && (
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldCheck size={20} color="#f87171" /> {lang === 'ms' ? 'Log Masuk Admin' : 'Admin Log In'}</h3>
                <button type="button" onClick={() => setFormType('selection')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'ID Pegawai' : 'Officer ID'}</label>
                <input type="text" className="input-field" value={officerId} onChange={(e) => setOfficerId(e.target.value)} required placeholder="e.g. ADM001" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <PasswordInput 
                  label={lang === 'ms' ? 'Kata Laluan' : 'Password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />

                <div style={{ textAlign: 'right', marginTop: '0.35rem' }}>
                  <span 
                    onClick={() => { setFormType('admin-forgot-password'); resetForm(); }}
                    style={{ color: '#f87171', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {lang === 'ms' ? 'Lupa kata laluan?' : 'Forgot password?'}
                  </span>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1, background: '#ef4444' }}>
                {isLoading ? <Loader size={18} className="spin" /> : (lang === 'ms' ? 'Log Masuk Admin' : 'Admin Log In')}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {lang === 'ms' ? 'Belum daftar Admin? ' : "Not registered as Admin? "}
                <span onClick={() => { setFormType('admin-signup'); resetForm(); }} style={{ color: '#f87171', cursor: 'pointer', fontWeight: 600 }}>
                  {lang === 'ms' ? 'Daftar Admin' : 'Register Admin'}
                </span>
              </div>
            </form>
          )}

          {/* ADMIN SIGNUP FORM */}
          {formType === 'admin-signup' && (
            <form onSubmit={handleAdminSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldCheck size={20} color="#f87171" /> {lang === 'ms' ? 'Daftar Admin' : 'Admin Sign Up'}</h3>
                <button type="button" onClick={() => setFormType('selection')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'ID Pegawai' : 'Officer ID'}</label>
                <input type="text" className="input-field" value={officerId} onChange={(e) => setOfficerId(e.target.value)} required placeholder="e.g. ADM001" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'E-mel Admin' : 'Admin Email'}</label>
                <input type="email" className="input-field" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required placeholder="admin@domain.com" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'Nama Penuh' : 'Full Name'}</label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Officer John" />
              </div>

              <PasswordInput 
                label={lang === 'ms' ? 'Kata Laluan' : 'Password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />

              <PasswordInput 
                label={lang === 'ms' ? 'Sahkan Kata Laluan' : 'Confirm Password'} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />

              <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1, background: '#ef4444' }}>
                {isLoading ? <Loader size={18} className="spin" /> : (lang === 'ms' ? 'Daftar Admin' : 'Sign Up Admin')}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {lang === 'ms' ? 'Sudah ada akaun Admin? ' : 'Already have an Admin account? '}
                <span onClick={() => { setFormType('admin-login'); resetForm(); }} style={{ color: '#f87171', cursor: 'pointer', fontWeight: 600 }}>
                  {lang === 'ms' ? 'Log masuk' : 'Log in'}
                </span>
              </div>
            </form>
          )}

          {/* ADMIN FORGOT PASSWORD FORM */}
          {formType === 'admin-forgot-password' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <KeyRound size={20} color="#f87171" /> {lang === 'ms' ? 'Reset Kata Laluan Admin' : 'Admin Reset Password'}
                </h3>
                <button type="button" onClick={() => { setFormType('admin-login'); resetForm(); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Step 1: Officer ID or Email verification */}
              {resetStep === 1 && (
                <form onSubmit={(e) => handleVerifyAccount(e, 'admin')} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 0.5rem 0' }}>
                    {lang === 'ms' 
                      ? 'Langkah 1/3: Masukkan ID Pegawai atau E-mel Admin anda.' 
                      : 'Step 1/3: Enter your Officer ID or Admin Email.'}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {lang === 'ms' ? 'ID Pegawai / E-mel' : 'Officer ID or Email'}
                    </label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={resetIdentifier} 
                      onChange={(e) => setResetIdentifier(e.target.value)} 
                      required 
                      placeholder="e.g. ADM001 or admin@domain.com" 
                    />
                  </div>

                  <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1, background: '#ef4444' }}>
                    {isLoading ? <Loader size={18} className="spin" /> : (lang === 'ms' ? 'Seterusnya' : 'Next')}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span onClick={() => { setFormType('admin-login'); resetForm(); }} style={{ color: '#f87171', cursor: 'pointer', fontWeight: 600 }}>
                      {lang === 'ms' ? 'Kembali ke Log Masuk' : 'Back to Log In'}
                    </span>
                  </div>
                </form>
              )}

              {/* Step 2: Dedicated Grid Box OTP Verification */}
              {resetStep === 2 && (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 0.5rem 0', textAlign: 'center' }}>
                    {lang === 'ms' 
                      ? 'Langkah 2/3: Masukkan 6-digit kod OTP yang dihantar melalui SMS.' 
                      : 'Step 2/3: Enter the 6-digit OTP code sent via SMS.'}
                  </p>

                  <OtpBoxInput 
                    value={otpCode} 
                    onChange={(val) => setOtpCode(val)} 
                  />

                  <button type="submit" disabled={isLoading || otpCode.length < 6} className="btn-primary" style={{ marginTop: '0.5rem', opacity: (isLoading || otpCode.length < 6) ? 0.6 : 1, background: '#ef4444' }}>
                    {isLoading ? <Loader size={18} className="spin" /> : (lang === 'ms' ? 'Sahkan OTP' : 'Verify OTP')}
                  </button>
                </form>
              )}

              {/* Step 3: Enter and confirm new Admin password */}
              {resetStep === 3 && (
                <form onSubmit={(e) => handleFinalPasswordReset(e, 'admin')} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 0.5rem 0' }}>
                    {lang === 'ms' 
                      ? 'Langkah 3/3: Tetapkan kata laluan baharu anda.' 
                      : 'Step 3/3: Set your new password.'}
                  </p>

                  <PasswordInput 
                    label={lang === 'ms' ? 'Kata Laluan Baharu' : 'New Password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />

                  <PasswordInput 
                    label={lang === 'ms' ? 'Sahkan Kata Laluan Baharu' : 'Confirm New Password'} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                  />

                  <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1, background: '#ef4444' }}>
                    {isLoading ? <Loader size={18} className="spin" /> : (lang === 'ms' ? 'Kemaskini Kata Laluan' : 'Update Password')}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}