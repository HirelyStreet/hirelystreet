import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { categoryMeta } from "../categoryMeta";

const CATEGORY_DESCRIPTIONS = {
  "Home Cleaning": "Cleaning experts for your home",
  "Plumbing": "All types of plumbing services",
  "Electrician": "Installations & repairs",
  "Electrical": "Installations & repairs",
  "Pest Control": "Protect your home from pests",
  "Wall Painting": "Interior & exterior painting",
  "Carpentry": "All types of carpentry work",
  "AC Repair": "Servicing, repair & installation",
  "Tutoring": "Learn from verified tutors",
  "Web Development": "Websites & web apps, built right",
  "Graphic Design": "Logos, branding & visual design",
  "Video Editing": "Reels, YouTube & professional edits",
  "Digital Marketing": "SEO, ads & growth marketing",
  "Content Writing": "Blogs, copywriting & more",
};

export default function CustomerServices() {
  const nav = useNavigate();
  const [mode, setMode] = useState("offline");
  const [categories, setCategories] = useState([]);
  const [priceRanges, setPriceRanges] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([api.categories(), api.listProviders()])
      .then(([catData, provData]) => {
        setCategories(catData.categories);
        const ranges = {};
        provData.providers.forEach(p => {
          const r = ranges[p.category] || { min: Infinity, max: 0 };
          r.min = Math.min(r.min, p.startingPrice);
          r.max = Math.max(r.max, p.startingPrice);
          ranges[p.category] = r;
        });
        setPriceRanges(ranges);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = categories.filter(c => (mode === "online" ? c.online : !c.online));

  const priceLabel = (name) => {
    const r = priceRanges[name];
    if (!r) return "No providers yet";
    return r.min === r.max ? `₹${r.min}+` : `₹${r.min} – ₹${r.max}`;
  };

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Browse Services</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Pick a category to see verified professionals.</p>

      <div className="toggle-pill-row">
        <button className={mode === "offline" ? "active" : ""} onClick={() => setMode("offline")}>🧰 Offline</button>
        <button className={mode === "online" ? "active" : ""} onClick={() => setMode("online")}>💻 Online</button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="empty">Loading categories...</div>
      ) : visible.length === 0 ? (
        <div className="empty">No {mode} categories yet — an admin can add some from Admin → Categories.</div>
      ) : (
        visible.map(c => {
          const meta = categoryMeta(c.name);
          return (
            <div key={c.id} className="category-list-row" onClick={() => nav("/explore", { state: { category: c.name } })}>
              <div className="icon" style={{ background: meta.tint }}>{meta.icon}</div>
              <div className="info">
                <div className="name">{c.name}</div>
                <div className="desc">{CATEGORY_DESCRIPTIONS[c.name] || `Verified ${c.name.toLowerCase()} professionals`}</div>
                <div className="price">{priceLabel(c.name)}</div>
              </div>
              <span className="muted">›</span>
            </div>
          );
        })
      )}
    </div>
  );
}
