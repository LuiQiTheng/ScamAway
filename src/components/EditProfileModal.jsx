import React, { useState, useEffect } from "react";
import { User, ShieldAlert, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function EditProfileModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  inline = false,
  isAdmin = false,
}) {
  const { t, lang } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    username: "",
    password: "",
    officerId: "",
    email: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name || "",
        age: initialData.age || "",
        phone: initialData.phone || "",
        username: initialData.username || "",
        password: initialData.password || "",
        officerId: initialData.officerId || "",
        email: initialData.email || "",
      });
      setErrorMsg("");
      setCurrentPassword("");
      setPasswordChanged(false);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'password') {
      setPasswordChanged(e.target.value.trim().length > 0);
    }
  };

  const handleSave = async () => {
    try {
      setErrorMsg("");
      
      const isChangingPassword = formData.password.trim().length > 0;
      if (isChangingPassword) {
        if (!currentPassword) {
          throw new Error(lang === 'ms' ? 'Sila masukkan kata laluan semasa untuk menukar kata laluan' : 'Please enter your current password to change password');
        }
        if (formData.password.length < 8) {
          throw new Error(lang === 'ms' ? 'Kata laluan baru mestilah sekurang-kurangnya 8 aksara' : 'New password must be at least 8 characters long');
        }
      }

      if (isAdmin) {
        if (!formData.name || !formData.officerId || !formData.email) {
          throw new Error(lang === 'ms' ? 'Sila isikan semua ruang' : 'Please fill all fields');
        }
        setIsLoading(true);
        const payload = {
          name: formData.name,
          officerId: formData.officerId,
          email: formData.email
        };
        if (isChangingPassword) {
          payload.password = formData.password.trim();
          payload.currentPassword = currentPassword;
        }
        await onSave(payload);
      } else {
        if (!formData.name || !formData.age || !formData.phone || !formData.username) {
          throw new Error(lang === 'ms' ? 'Sila isikan semua ruang' : 'Please fill all fields');
        }

        const phoneDigits = formData.phone.replace(/[-\s]/g, '');
        const phoneRegex = /^(\+?60|0)1\d{8,9}$/;
        if (!phoneRegex.test(phoneDigits)) {
          throw new Error(lang === 'ms' ? 'Format nombor telefon tidak sah (cth: 0123456789)' : 'Invalid phone number format (e.g. 0123456789)');
        }

        const ageInt = parseInt(formData.age);
        if (isNaN(ageInt) || ageInt < 1 || ageInt > 120) {
          throw new Error(lang === 'ms' ? 'Umur tidak sah' : 'Invalid age');
        }

        setIsLoading(true);
        const payload = {
          name: formData.name,
          username: formData.username,
          phone: formData.phone,
          age: ageInt
        };
        if (isChangingPassword) {
          payload.password = formData.password.trim();
          payload.currentPassword = currentPassword;
        }
        await onSave(payload);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div
      className={inline ? "" : "glass-panel"}
      style={inline ? { width: "100%", position: "relative", marginTop: "1rem" } : {
        width: "100%",
        maxWidth: "420px",
        padding: "24px",
        borderRadius: "16px",
        position: "relative",
      }}
    >
      {!inline && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "rgba(96, 165, 250, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#60a5fa",
          }}
        >
          <User size={24} />
        </div>
        <div>
          <h2 style={{ color: "#fff", fontSize: "1.25rem", margin: 0 }}>
            {lang === 'ms' ? 'Kemaskini Profil' : 'Edit Profile'}
          </h2>
          <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0", fontSize: "0.85rem" }}>
            {lang === 'ms' ? 'Kemaskini butiran peribadi anda.' : 'Update your personal details.'}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ShieldAlert size={16} />
          {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label className="form-label">{lang === 'ms' ? 'Nama Penuh' : 'Full Name'}</label>
          <input
            type="text"
            name="name"
            className="input-field"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">{isAdmin ? 'Officer ID' : 'Username'}</label>
            <input
              type="text"
              name={isAdmin ? "officerId" : "username"}
              className="input-field"
              value={isAdmin ? formData.officerId : formData.username}
              onChange={handleChange}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">{lang === 'ms' ? 'Kata Laluan Baru (Pilihan)' : 'New Password (Optional)'}</label>
            <input
              type="password"
              name="password"
              className="input-field"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>
        </div>
        
        {formData.password.trim().length > 0 && (
          <div>
            <label className="form-label">{lang === 'ms' ? 'Kata Laluan Semasa' : 'Current Password'}</label>
            <input
              type="password"
              className="input-field"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={lang === 'ms' ? 'Masukkan kata laluan semasa anda' : 'Enter current password to confirm'}
            />
          </div>
        )}
        
        {isAdmin && (
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="input-field"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        )}

        {!isAdmin && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">{lang === 'ms' ? 'Umur' : 'Age'}</label>
              <input
                type="number"
                name="age"
                className="input-field"
                value={formData.age}
                onChange={handleChange}
                min="1"
                max="120"
              />
            </div>
            <div style={{ flex: 2 }}>
              <label className="form-label">{lang === 'ms' ? 'No. Telefon' : 'Phone No'}</label>
              <input
                type="tel"
                name="phone"
                className="input-field"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        {inline && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            {lang === 'ms' ? 'Batal' : 'Cancel'}
          </button>
        )}
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={isLoading}
          style={{ flex: inline ? 1 : 'none', width: inline ? 'auto' : '100%' }}
        >
          {isLoading ? "..." : lang === 'ms' ? 'Simpan Maklumat' : 'Save Details'}
        </button>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
      }}
    >
      {content}
    </div>
  );
}
