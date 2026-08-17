import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api } from "../api";

const STATUS_TONE = { upcoming: "brand", active: "warn", completed: "success", cancelled: "danger" };
const NEXT_STATUS = { upcoming: "active", active: "completed" };

function UpiSettings() {
  const [upiId, setUpiId] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      await api.updateMyProviderProfile({ upiId });
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Payment settings</h3>
      <p className="muted">Customers pay you directly via UPI QR after a job is marked completed — HirelyStreet never holds the money. Set your UPI ID (VPA) below.</p>
      {error && <div className="error-banner">{error}</div>}
      <div className="field">
        <label>Your UPI ID</label>
        <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@okbank" />
      </div>
      <button className="btn btn-primary btn-sm" disabled={saving} onClick={save}>
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save UPI ID"}
      </button>
    </div>
  );
}

function NextSteps({ profile, services, portfolio }) {
  const nav = useNavigate();
  if (!profile) return null;

  const steps = [
    { done: true, label: "Profile created", to: "/provider/profile" },
    { done: profile.skills?.length > 0, label: profile.skills?.length > 0 ? "Skills added" : "Add your skills", to: "/provider/profile" },
    { done: services.length > 0, label: services.length > 0 ? `${services.length} service${services.length > 1 ? "s" : ""} published` : "Add at least one service", to: "/provider/profile" },
    { done: portfolio.length > 0, label: portfolio.length > 0 ? "Portfolio added" : "Add portfolio photos", to: "/provider/profile" },
    { done: !!profile.upiId, label: profile.upiId ? "UPI payment set up" : "Set up your UPI ID for payments", to: "/provider/profile" },
    { done: profile.verified, label: profile.verified ? "Verified" : "Complete verification", to: "/provider/profile" },
  ];
  const remaining = steps.filter(s => !s.done).length;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Your Next Steps</h3>
        {remaining > 0 ? <span className="badge warn">{remaining} to do</span> : <span className="badge success">All set ✓</span>}
      </div>
      {steps.map(s => (
        <div key={s.label} className="next-steps-item" onClick={() => nav(s.to)}>
          <div className={`mark ${s.done ? "done" : "pending"}`}>{s.done ? "✓" : "!"}</div>
          <div className={`txt ${s.done ? "done" : ""}`}>{s.label}</div>
          {!s.done && <span className="muted">›</span>}
        </div>
      ))}
    </div>
  );
}

export default function ProviderDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [profileFull, setProfileFull] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.myBookings(), api.getMyProviderFull()])
      .then(([b, full]) => { setBookings(b.bookings); setProfileFull(full); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const advance = async (b) => {
    await api.updateBookingStatus(b.id, NEXT_STATUS[b.status]);
    load();
  };

  const earnings = bookings.filter(b => b.payment_status === "paid").reduce((s, b) => s + b.price, 0);
  const active = bookings.filter(b => b.status === "active" || b.status === "upcoming").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1>Welcome back, {user.name.split(" ")[0]}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => nav("/provider/profile")}>Customize profile</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(s => !s)}>
            {showSettings ? "Hide" : "Payment settings"}
          </button>
        </div>
      </div>
      {showSettings && <UpiSettings />}
      <NextSteps profile={profileFull?.provider} services={profileFull?.services || []} portfolio={profileFull?.portfolio || []} />
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-box"><div className="v">₹{earnings.toLocaleString("en-IN")}</div><div className="l">Total earnings</div></div>
        <div className="stat-box"><div className="v">{active}</div><div className="l">Active/upcoming jobs</div></div>
        <div className="stat-box"><div className="v">{bookings.filter(b=>b.status==="completed").length}</div><div className="l">Completed jobs</div></div>
        <div className="stat-box"><div className="v">{bookings.length}</div><div className="l">Total bookings</div></div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      <h3>Bookings</h3>
      {loading ? <div className="empty">Loading...</div> : bookings.length === 0 ? (
        <div className="empty">No bookings yet. Customers will find you once your profile is complete — see backend `PUT /api/providers/me/profile` and `POST /api/providers/me/services` to add your services.</div>
      ) : bookings.map(b => (
        <div key={b.id} className="card">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <img src={b.customer_avatar} className="avatar-sm" alt="" />
            <div style={{ flex: 1 }}>
              <strong>{b.service_name}</strong>
              <div className="muted">{b.customer_name} · {b.appointment_date || "Date TBD"} {b.appointment_time || ""}</div>
            </div>
            <span className={`badge ${STATUS_TONE[b.status]}`}>{b.status}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <div>
              <strong>₹{b.price.toLocaleString("en-IN")}</strong>{" "}
              {b.status === "completed" && (
                <span className={`badge ${b.payment_status === "paid" ? "success" : "warn"}`}>
                  {b.payment_status === "paid" ? "Paid" : "Awaiting payment"}
                </span>
              )}
            </div>
            {NEXT_STATUS[b.status] && (
              <button className="btn btn-primary btn-sm" onClick={() => advance(b)}>
                Mark as {NEXT_STATUS[b.status]}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
