import React from "react";
import { ShieldCheck, UserRound, Users, Phone } from "lucide-react";

export default function GuardianProfileCard({ guardian, onEdit }) {
  const { name, relationship, phone } = guardian || {};

  const rows = [
    { icon: UserRound, label: "Guardian Name", value: name },
    { icon: Users, label: "Relationship", value: relationship },
    { icon: Phone, label: "Phone Number", value: phone },
  ];

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
          Your trusted guardian for Kid Mode and Elderly Mode.
        </p>
      </div>

      <div
        style={{
          borderRadius: "12px",
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          overflow: "hidden",
        }}
      >
        {rows.map(({ icon: Icon, label, value }, index) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              padding: "14px 16px",
              borderTop:
                index === 0 ? "none" : "1px solid var(--glass-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              <Icon size={16} style={{ color: "var(--primary)" }} />
              {label}
            </div>

            <div
              style={{
                color: "var(--text-primary)",
                fontSize: "15px",
                fontWeight: 500,
                paddingLeft: "24px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {value || "—"}
            </div>
          </div>
        ))}
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
          onClick={onEdit}
          style={{ width: "100%" }}
        >
          Edit Guardian
        </button>
      </div>
    </div>
  );
}