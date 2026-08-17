import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../Toast";

export default function PaymentMethods() {
  const nav = useNavigate();
  const toast = useToast();
  const [upis, setUpis] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hs_my_upis") || "[]"); } catch { return []; }
  });
  const [newUpi, setNewUpi] = useState("");

  const persist = (list) => {
    setUpis(list);
    localStorage.setItem("hs_my_upis", JSON.stringify(list));
  };

  const add = () => {
    if (!newUpi.trim()) return;
    persist([...upis, newUpi.trim()]);
    setNewUpi("");
    toast("UPI ID added");
  };
  const remove = (id) => {
    persist(upis.filter(u => u !== id));
    toast("Removed");
  };

  return (
    <div>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: 14 }} onClick={() => nav("/profile")}>← Back</button>
      <h1 style={{ marginBottom: 4 }}>Payment Methods</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        HirelyStreet doesn't hold your payment details — you pay providers directly via UPI QR after a job is completed.
        Save a UPI ID here just for your own convenience when scanning to pay.
      </p>
      <div className="card">
        {upis.length === 0 && <p className="muted">No saved UPI IDs yet.</p>}
        {upis.map(u => (
          <div key={u} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--ink-100)" }}>
            <span>💳 {u}</span>
            <button className="btn btn-danger btn-sm" onClick={() => remove(u)}>Remove</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input value={newUpi} onChange={e => setNewUpi(e.target.value)} placeholder="yourname@okbank" style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--ink-100)", borderRadius: 10, background: "var(--ink-50)" }} />
          <button className="btn btn-primary" onClick={add}>Add</button>
        </div>
      </div>
    </div>
  );
}
