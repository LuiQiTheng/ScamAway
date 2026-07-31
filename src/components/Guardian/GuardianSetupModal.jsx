import React, { useState, useEffect } from "react";
import { ShieldCheck, UserRound, Phone, Users } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const RELATIONSHIP_OPTIONS = [
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Sibling",
  "Relative",
  "Caregiver",
  "Other",
];

const PHONE_REGEX = /^[+]?[\d\s()-]{7,15}$/;

export default function GuardianSetupModal({
  isOpen,
  onClose,
  onSave,
  guardian = null,
  mode = "create",
}) {
  const { t } = useLanguage();
  const [name, setName] = useState(guardian?.name || "");
  const [relationship, setRelationship] = useState(
    guardian?.relationship || ""
  );
  const [phone, setPhone] = useState(guardian?.phone || "");
  const [errors, setErrors] = useState({});
  useEffect(() => {
    setName(guardian?.name || "");
    setRelationship(guardian?.relationship || "");
    setPhone(guardian?.phone || "");
    setErrors({});
  }, [guardian, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = t("guardian.errors.name_required");
    }

    if (!relationship) {
      nextErrors.relationship = t("guardian.errors.relationship_required");
    }

    if (!phone.trim()) {
      nextErrors.phone = t("guardian.errors.phone_required");
    } 
    
    else if (!PHONE_REGEX.test(phone.trim())) {
      nextErrors.phone = t("guardian.errors.phone_invalid");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      name: name.trim(),
      relationship,
      phone: phone.trim(),
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px 24px",
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
          padding: "24px",
          position: "relative",
          borderRadius: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              color: "var(--primary)",
            }}
          >
            <ShieldCheck size={28} />
          </div>

          <h2
            style={{
              color: "var(--text-primary)",
              fontSize: "22px",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {mode === "create"
              ? t("guardian.create")
              : t("guardian.edit")}
          </h2>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "14px",
              lineHeight: 1.5,
              margin: 0,
              maxWidth: "380px",
            }}
          >
            {mode === "create"
              ? t("guardian.create_desc")
              : t("guardian.edit_desc")}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "8px",
              }}
            >
              <UserRound size={16} style={{ color: "var(--primary)" }} />
              {t("guardian.name")}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={t("guardian.name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%" }}
            />
            {errors.name && (
              <p
                style={{
                  color: "#f87171",
                  fontSize: "12px",
                  marginTop: "6px",
                }}
              >
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "8px",
              }}
            >
              <Users size={16} style={{ color: "var(--primary)" }} />
              {t("guardian.relationship")}
            </label>
            <select
              className="input-field"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value=""> {t("guardian.select_relationship")} </option>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`guardian.relationships.${option}`)}
                </option>
              ))}
            </select>
            {errors.relationship && (
              <p
                style={{
                  color: "#f87171",
                  fontSize: "12px",
                  marginTop: "6px",
                }}
              >
                {errors.relationship}
              </p>
            )}
          </div>

          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "8px",
              }}
            >
              <Phone size={16} style={{ color: "var(--primary)" }} />
              {t("guardian.phone")}
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder={t("guardian.phone_placeholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: "100%" }}
            />
            {errors.phone && (
              <p
                style={{
                  color: "#f87171",
                  fontSize: "12px",
                  marginTop: "6px",
                }}
              >
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "28px",
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            style={{ width: "100%" }}
          >
            {mode === "create" ? t("guardian.add") : t("guardian.update")}
          </button>
        </div>
      </div>
    </div>
  );
}