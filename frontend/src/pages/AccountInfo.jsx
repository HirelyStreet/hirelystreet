import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useToast } from "../Toast";

export default function AccountInfo() {
  const { user, updateProfile } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateProfile({ name, phone });
      toast("Profile updated");
      nav("/profile");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: 14 }} onClick={() => nav("/profile")}>← Back</button>
      <h1 style={{ marginBottom: 16 }}>Personal Information</h1>
      <div className="card">
        {error && <div className="error-banner">{error}</div>}
        <div className="field"><label>Full name</label><input value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field"><label>Email</label><input value={user?.email} disabled style={{ opacity: .6 }} /></div>
        <div className="field"><label>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save changes"}</button>
      </div>
    </div>
  );
}
