import React from "react";
import { ShieldCheck, UserPlus } from "lucide-react";

export default function GuardianEmptyState({ onAdd }) {
  return (
    <div
      className="glass-panel"
      style={{
        width: "100%",
        maxWidth: "480px",
        padding: "32px",
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
          Stay protected by registering a trusted guardian for emergency scam alerts.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "12px",
          padding: "32px 20px",
          borderRadius: "12px",
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-dark)",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
          }}
        >
          <UserPlus size={22} />
        </div>

        <h3
          style={{
            color: "var(--text-primary)",
            fontSize: "16px",
            fontWeight: 600,
            margin: 0,
          }}
        >
          No Guardian Added
        </h3>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "14px",
            lineHeight: 1.5,
            margin: 0,
            maxWidth: "320px",
          }}
        >
          Kid Mode and Elderly Mode require a registered guardian before they
          can be used. It only takes a minute to set up.
        </p>
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
          onClick={onAdd}
          style={{ width: "100%" }}
        >
          Add Guardian
        </button>
      </div>
    </div>
  );
}