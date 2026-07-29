import React, { useState } from "react";
import { ShieldCheck, UserRound, Phone, Users } from "lucide-react";

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

export default function GuardianSetupModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Guardian name is required.";
    }

    if (!relationship) {
      nextErrors.relationship = "Please select a relationship.";
    }

    if (!phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    } else if (!PHONE_REGEX.test(phone.trim())) {
      nextErrors.phone = "Please enter a valid phone number.";
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
        padding: "24px",
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
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "32px",
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
            marginBottom: "28px",
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
            Guardian Protection
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
            Kid Mode and Elderly Mode require a trusted guardian on file. This
            allows ScamShield AI to alert someone the user trusts if a scam
            attempt is detected. Registration is mandatory and takes less
            than a minute — you can continue once it's saved.
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
              Guardian Full Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter guardian's full name"
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
              Relationship
            </label>
            <select
              className="input-field"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="">Select relationship</option>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
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
              Phone Number
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="e.g. +60 12-345 6789"
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
            Save Guardian
          </button>
        </div>
      </div>
    </div>
  );
}