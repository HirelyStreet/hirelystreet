import React from "react";
import { useNavigate } from "react-router-dom";

export default function ServicesHub() {
  const nav = useNavigate();

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Services</h1>
      <p className="muted" style={{ marginBottom: 18 }}>What kind of service do you need?</p>

      <div className="mode-hub-card" style={{ background: "linear-gradient(135deg, var(--brand-600), var(--brand-800))" }} onClick={() => nav("/services/online")}>
        <div className="mode-hub-emoji">💻</div>
        <div className="mode-hub-title">ONLINE</div>
        <div className="mode-hub-desc">Remote professionals & digital services — web dev, design, marketing, tutoring and more.</div>
        <div className="mode-hub-cta">Explore →</div>
      </div>

      <div className="mode-hub-card" style={{ background: "linear-gradient(135deg, var(--ink-700), var(--ink-900))" }} onClick={() => nav("/services/offline")}>
        <div className="mode-hub-emoji">🧰</div>
        <div className="mode-hub-title">OFFLINE</div>
        <div className="mode-hub-desc">Local services near you — electricians, cleaning, repairs, painters, photographers and more.</div>
        <div className="mode-hub-cta">Explore →</div>
      </div>

      <div className="card" style={{ textAlign: "center" }}>
        <p className="muted" style={{ marginBottom: 10 }}>Not sure exactly what you need?</p>
        <button className="btn btn-primary" onClick={() => nav("/explore")}>Search all services</button>
      </div>
    </div>
  );
}
