import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import { categoryMeta } from "../categoryMeta";

const OFFERS = [
  { cls: "a", tag: "₹100 OFF", code: "WELCOME100", desc: "Flat ₹100 off on orders above ₹499" },
  { cls: "b", tag: "20% OFF", code: "FIRST20", desc: "20% off on your first booking, up to ₹699" },
];

export default function CustomerHome() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("offline"); // offline | online
  const [categories, setCategories] = useState([]);
  const [priceRanges, setPriceRanges] = useState({});
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    api.categories().then(d => setCategories(d.categories)).catch(() => {});
    api.listProviders().then(({ providers }) => {
      const ranges = {};
      providers.forEach(p => {
        const r = ranges[p.category] || { min: Infinity, max: 0 };
        r.min = Math.min(r.min, p.startingPrice);
        r.max = Math.max(r.max, p.startingPrice);
        ranges[p.category] = r;
      });
      setPriceRanges(ranges);
    }).catch(() => {});
  }, []);

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const visibleCategories = categories.filter(c => (mode === "online" ? c.online : !c.online)).slice(0, 8);

  const priceLabel = (name) => {
    const r = priceRanges[name];
    if (!r) return "";
    return r.min === r.max ? `₹${r.min}+` : `₹${r.min}–₹${r.max}`;
  };

  return (
    <div>
      <div className="location-row">
        <div>
          <div className="loc-label">📍 Current location</div>
          <div className="loc-value">Hyderabad</div>
        </div>
        <button className="bell-btn" onClick={() => nav("/notifications")}>🔔</button>
      </div>

      <div className="search-row">
        <div className="search-input" onClick={() => nav("/explore")}>
          <span>🔍</span>
          <input placeholder="Search for services..." readOnly />
        </div>
        <button className="filter-btn" onClick={() => nav("/services")}>⚙️</button>
      </div>

      <div className="hero-banner">
        <h2>Reliable services. Right at your doorstep.</h2>
        <button className="btn" style={{ background: "#fff", color: "var(--brand-700)" }} onClick={() => nav("/explore")}>Book Now</button>
        <div className="emoji-deco">🛠️</div>
      </div>

      <div className="section-head">
        <h3>🏷️ Offers for you</h3>
      </div>
      <div className="offers-row">
        {OFFERS.map(o => (
          <div key={o.code} className={`offer-card ${o.cls}`} onClick={() => copyCode(o.code)}>
            <div className="tag">{o.tag}</div>
            <div className="code">{o.code}</div>
            <div className="desc">{o.desc}</div>
            <span className="copy">{copiedCode === o.code ? "Copied ✓" : "Tap to copy"}</span>
          </div>
        ))}
      </div>

      <div className="toggle-pill-row">
        <button className={mode === "offline" ? "active" : ""} onClick={() => setMode("offline")}>🧰 Offline</button>
        <button className={mode === "online" ? "active" : ""} onClick={() => setMode("online")}>💻 Online</button>
      </div>

      <div className="section-head">
        <h3>Top Categories</h3>
        <button className="link" onClick={() => nav(`/services/${mode}`)}>See all</button>
      </div>
      <div className="category-grid">
        {visibleCategories.length === 0 && <p className="muted" style={{ gridColumn: "1 / -1" }}>No {mode} categories yet.</p>}
        {visibleCategories.map(c => {
          const meta = categoryMeta(c.name);
          return (
            <button key={c.id} className="category-tile" onClick={() => nav("/explore", { state: { category: c.name } })}>
              <div className="icon" style={{ background: meta.tint }}>{meta.icon}</div>
              <div className="name">{c.name}</div>
              <div className="price">{priceLabel(c.name) || "View"}</div>
            </button>
          );
        })}
      </div>

      {!user && (
        <div className="guest-banner" style={{ marginTop: 20 }}>
          <div>
            <div className="title">Browsing as guest</div>
            <div className="muted">Sign in to book a service and track your appointments.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => nav("/login")}>Sign in</button>
        </div>
      )}
    </div>
  );
}
