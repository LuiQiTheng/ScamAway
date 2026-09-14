import React, { useState, useRef, useCallback } from 'react';
import { RotateCcw, X, Trash2 } from 'lucide-react';

/**
 * Reusable Custom Hook to trigger an Undo Toast notification anywhere in the application.
 *
 * @returns {Object} { undoToast, showUndoToast, dismissUndoToast }
 *
 * Example Usage:
 *   const { undoToast, showUndoToast } = useUndoToast();
 *
 *   const handleDelete = (item) => {
 *     removeItem(item.id);
 *     showUndoToast({
 *       message: `Report ${item.code} deleted.`,
 *       onUndo: () => restoreItem(item.id),
 *       duration: 6000 // optional, default 6000ms
 *     });
 *   };
 *
 *   // In JSX:
 *   <UndoToast toast={undoToast} lang={lang} isElderlyMode={isElderlyMode} />
 */
export function useUndoToast() {
  const [undoToast, setUndoToast] = useState(null);
  const timerRef = useRef(null);

  const dismissUndoToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setUndoToast(null);
  }, []);

  const showUndoToast = useCallback(({ message, onUndo, icon, duration = 6000 }) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setUndoToast(null);
      timerRef.current = null;
    }, duration);

    setUndoToast({
      message,
      icon,
      onUndo: async () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (typeof onUndo === 'function') {
          await onUndo();
        }
        setUndoToast(null);
      },
      dismiss: () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setUndoToast(null);
      }
    });
  }, []);

  return {
    undoToast,
    showUndoToast,
    dismissUndoToast
  };
}

/**
 * Presentational Undo Toast component.
 * Renders a fixed floating notification with an "Undo" action and a dismiss button.
 */
export function UndoToast({ toast, lang = 'en', isElderlyMode = false, isKidMode = false }) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={isKidMode ? 'kid-mode' : (isElderlyMode ? 'elderly-mode' : '')}
      style={{
        position: 'fixed',
        bottom: '36px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        background: isKidMode
          ? 'rgba(30, 27, 75, 0.98)'
          : (isElderlyMode ? 'rgba(15, 23, 42, 0.98)' : 'rgba(15, 23, 42, 0.96)'),
        border: isKidMode
          ? '2px solid rgba(168, 85, 247, 0.6)'
          : (isElderlyMode ? '2px solid #38bdf8' : '1px solid rgba(59, 130, 246, 0.5)'),
        boxShadow: isKidMode
          ? '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(168, 85, 247, 0.35)'
          : (isElderlyMode ? '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.3)' : '0 10px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.25)'),
        backdropFilter: 'blur(12px)',
        borderRadius: isKidMode ? '20px' : (isElderlyMode ? '16px' : '12px'),
        padding: isElderlyMode ? '1rem 1.6rem' : (isKidMode ? '0.95rem 1.45rem' : '0.85rem 1.35rem'),
        display: 'flex',
        alignItems: 'center',
        gap: isElderlyMode ? '1.25rem' : '1rem',
        maxWidth: '92vw',
        animation: 'fadeInUp 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {toast.icon || <Trash2 size={isElderlyMode ? 22 : (isKidMode ? 18 : 16)} color={isKidMode ? '#f472b6' : '#ef4444'} style={{ flexShrink: 0 }} />}
        <span style={{
          color: '#f8fafc',
          fontSize: isElderlyMode ? '1.2rem' : (isKidMode ? '0.95rem' : '0.9rem'),
          fontWeight: isElderlyMode ? 700 : (isKidMode ? 600 : 500)
        }}>
          {toast.message}
        </span>
      </div>
      <button
        type="button"
        onClick={toast.onUndo}
        style={{
          background: isKidMode ? 'rgba(168, 85, 247, 0.3)' : (isElderlyMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(59, 130, 246, 0.25)'),
          border: isKidMode ? '1px solid rgba(168, 85, 247, 0.7)' : (isElderlyMode ? '2px solid #38bdf8' : '1px solid rgba(59, 130, 246, 0.6)'),
          color: isKidMode ? '#c084fc' : (isElderlyMode ? '#38bdf8' : '#60a5fa'),
          padding: isElderlyMode ? '0.65rem 1.35rem' : (isKidMode ? '0.45rem 1rem' : '0.42rem 0.9rem'),
          borderRadius: isKidMode ? '14px' : (isElderlyMode ? '10px' : '6px'),
          fontSize: isElderlyMode ? '1.15rem' : (isKidMode ? '0.88rem' : '0.85rem'),
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}
      >
        <RotateCcw size={isElderlyMode ? 18 : 14} />
        {lang === 'ms' ? 'Buat Asal' : 'Undo'}
      </button>
      <button
        type="button"
        onClick={toast.dismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '0.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default UndoToast;
