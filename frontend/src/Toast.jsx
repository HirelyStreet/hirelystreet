// src/Toast.jsx — minimal global toast system so any component can call
// toast("Provider saved.") without prop-drilling. Used throughout to satisfy
// the "every action gives feedback" requirement (save, message sent, etc.)
import React, { createContext, useContext, useState, useCallback } from "react";

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((text) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{ position: "fixed", bottom: 78, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 200, pointerEvents: "none" }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: "var(--ink-900)", color: "#fff", padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600, boxShadow: "0 6px 20px rgba(0,0,0,.2)" }}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
