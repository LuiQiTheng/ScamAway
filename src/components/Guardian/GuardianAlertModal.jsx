import React from "react";
import { ShieldAlert, TriangleAlert, CircleCheck } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function GuardianAlertModal({ isOpen, guardianName, onClose }) {
  if (!isOpen) return null;

  const { t } = useLanguage();

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
            <ShieldAlert size={28} />
          </div>

          <h2
            style={{
              color: "var(--text-primary)",
              fontSize: "22px",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {t("guardian.alert.title")}
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
            {t("guardian.alert.description")}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "18px 16px",
              borderRadius: "12px",
              background: "rgba(180, 30, 40, 0.1)",
              border: "1px solid rgba(255, 80, 80, 0.3)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                color: "var(--text-primary)",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              <TriangleAlert size={18} style={{ color: "#ff6b6b" }} />
              {t("guardian.alert.high_risk")}
            </div>

            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {t("guardian.alert.high_risk_desc")}
            </p>
          </div>

          <div
            style={{
              borderRadius: "12px",
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
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
              {t("guardian.alert.status")}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-primary)",
                fontSize: "15px",
                fontWeight: 500,
              }}
            >
              <CircleCheck size={16} style={{ color: "var(--primary)" }} />
              {t("guardian.alert.sent")}
            </div>

            {guardianName && (
              <div
                style={{
                  marginTop: "4px",
                  paddingTop: "10px",
                  borderTop: "1px solid var(--glass-border)",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                {t("guardian.alert.sent_to")}{" "}
                <span
                  style={{ color: "var(--text-primary)", fontWeight: 500 }}
                >
                  {guardianName}
                </span>
              </div>
            )}
          </div>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "13px",
              lineHeight: 1.5,
              textAlign: "center",
              margin: 0,
            }}
          >
            {t("guardian.alert.stop")}
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
            onClick={onClose}
            style={{ width: "100%" }}
          >
            {t("guardian.alert.return")}
          </button>
        </div>
      </div>
    </div>
  );
}