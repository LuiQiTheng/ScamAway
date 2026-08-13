import React, { useState } from 'react';
import { ShieldAlert, User, ShieldAlert as AdminIcon, ArrowRight, X, Loader } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAppContext } from '../context/AppContext';
import { Eye, EyeOff } from "lucide-react";

export default function LoginScreen({ onLogin }) {
  const { t, lang, toggleLanguage } = useLanguage();
  const { registerUser, loginUser, registerAdmin, loginAdmin } = useAppContext();
  
  // 'selection', 'user-signup', 'user-login', 'admin-signup', 'admin-login'
  const [formType, setFormType] = useState('selection');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [officerId, setOfficerId] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setName('');
    setAge('');
    setPhone('');
    setOfficerId('');
    setAdminEmail('');
    setErrorMsg('');
    setShowPassword(false);
    setConfirmPassword('');
    setShowConfirmPassword(false);
  };

  const handleUserSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      if (!username || !password || !confirmPassword || !name || !age || !phone) {
        throw new Error(lang === 'ms' ? 'Sila isikan semua ruang' : 'Please fill all fields');
      }
      if (password !== confirmPassword) {
        throw new Error(lang === 'ms' ? 'Kata laluan tidak sepadan' : 'Passwords do not match');
      }
      
      const phoneDigits = phone.replace(/[-\s]/g, '');
      const phoneRegex = /^(\+?60|0)1\d{8,9}$/;
      if (!phoneRegex.test(phoneDigits)) {
        throw new Error(lang === 'ms' ? 'Format nombor telefon tidak sah (cth: 0123456789)' : 'Invalid phone number format (e.g. 0123456789)');
      }

      await registerUser({ username, password, name, age: parseInt(age), phone });
      onLogin('user');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      if (!username || !password) {
        throw new Error(lang === 'ms' ? 'Sila isikan username dan kata laluan' : 'Please provide username and password');
      }
      await loginUser(username, password);
      onLogin('user');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      if (!officerId || !password || !confirmPassword || !name || !adminEmail) {
        throw new Error(lang === 'ms' ? 'Sila isikan semua ruang' : 'Please fill all fields');
      }
      if (password !== confirmPassword) {
        throw new Error(lang === 'ms' ? 'Kata laluan tidak sepadan' : 'Passwords do not match');
      }
      await registerAdmin({ officerId, password, name, email: adminEmail });
      onLogin('admin');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      if (!officerId || !password) {
        throw new Error(lang === 'ms' ? 'Sila isikan ID Pegawai dan kata laluan' : 'Please provide Officer ID and password');
      }
      await loginAdmin(officerId, password);
      onLogin('admin');
    } catch (err) {
      setErrorMsg(err.message);
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
      fontFamily: "'Inter', sans-serif"
    }}>

      <div style={{ width: '100%', maxWidth: '440px' }}>
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
              fontSize: 'clamp(1.18rem, 5.5vw, 1.6rem)', 
              fontWeight: 700, 
              color: '#fff', 
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap'
            }}>
              {t("login.welcome")}
            </h1>
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
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          {/* Render Forms */}
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
                    <AdminIcon size={24} color="#f87171" />
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
            </div>
          )}

          {/* USER SIGNUP */}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {lang === 'ms' ? 'Kata Laluan' : 'Password'}
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{ paddingRight: "45px" }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {lang === 'ms' ? 'Sahkan Kata Laluan' : 'Confirm Password'}
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="input-field"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{ paddingRight: "45px" }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
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

          {/* USER LOGIN */}
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
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {lang === 'ms' ? 'Kata Laluan' : 'Password'}
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{ paddingRight: "45px" }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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

          {/* ADMIN SIGNUP */}
          {formType === 'admin-signup' && (
            <form onSubmit={handleAdminSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AdminIcon size={20} color="#f87171" /> {lang === 'ms' ? 'Daftar Admin' : 'Admin Sign Up'}</h3>
                <button type="button" onClick={() => setFormType('selection')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'ID Pegawai' : 'Officer ID'}</label>
                <input type="text" className="input-field" value={officerId} onChange={(e) => setOfficerId(e.target.value)} required placeholder="e.g. PDRM-KL-001" />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'Nama Penuh' : 'Full Name'}</label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Inspector Lim" />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'Emel Rasmi' : 'Official Email'}</label>
                <input type="email" className="input-field" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required placeholder="admin@scamshield.gov.my" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {lang === 'ms' ? 'Kata Laluan' : 'Password'}
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{ paddingRight: "45px" }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {lang === 'ms' ? 'Sahkan Kata Laluan' : 'Confirm Password'}
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="input-field"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{ paddingRight: "45px" }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? <Loader size={18} className="spin" /> : (lang === 'ms' ? 'Daftar' : 'Sign Up')}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {lang === 'ms' ? 'Sudah mempunyai akaun? ' : 'Already have an account? '}
                <span onClick={() => { setFormType('admin-login'); resetForm(); }} style={{ color: '#f87171', cursor: 'pointer', fontWeight: 600 }}>
                  {lang === 'ms' ? 'Log masuk sekarang' : 'Login now'}
                </span>
              </div>
            </form>
          )}

          {/* ADMIN LOGIN */}
          {formType === 'admin-login' && (
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AdminIcon size={20} color="#f87171" /> {lang === 'ms' ? 'Log Masuk Admin' : 'Admin Log In'}</h3>
                <button type="button" onClick={() => setFormType('selection')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'ID Pegawai' : 'Officer ID'}</label>
                <input type="text" className="input-field" value={officerId} onChange={(e) => setOfficerId(e.target.value)} required placeholder="e.g. PDRM-KL-001" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {lang === 'ms' ? 'Kata Laluan' : 'Password'}
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{ paddingRight: "45px" }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? <Loader size={18} className="spin" /> : (lang === 'ms' ? 'Log Masuk' : 'Log In')}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {lang === 'ms' ? 'Belum mempunyai akaun? ' : "Don't have an account? "}
                <span onClick={() => { setFormType('admin-signup'); resetForm(); }} style={{ color: '#f87171', cursor: 'pointer', fontWeight: 600 }}>
                  {lang === 'ms' ? 'Daftar sekarang' : 'Sign up now'}
                </span>
              </div>
            </form>
          )}

        </div>
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
            {t("login.footer")}
          </p>
        </div>

      </div>
    </div>
  );
}
