import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api";

export default function CustomerExplore() {
  const nav = useNavigate();
  const loc = useLocation();
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(loc.state?.category || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (query = "", cat = "") => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (query) params.q = query;
      if (cat) params.category = cat;
      const { providers } = await api.listProviders(params);
      setProviders(providers);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(q, category);
    api.categories().then(d => setCategories(d.categories)).catch(() => {});
  }, []);

  const onCategoryChange = (val) => {
    setCategory(val);
    load(q, val);
  };

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Explore services</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Browse verified professionals — online or local.</p>

      <div className="card" style={{ display: "flex", gap: 8, padding: 12 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(q)}
          placeholder="Search services, skills or professionals..."
          style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--ink-100)", borderRadius: 10, background: "var(--ink-50)" }}
        />
        <button className="btn btn-primary" onClick={() => load(q, category)}>Search</button>
      </div>

      {categories.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 2px 4px" }}>
          <button className={`badge ${category === "" ? "brand" : ""}`} style={{ border: "none", cursor: "pointer" }} onClick={() => onCategoryChange("")}>All</button>
          {categories.map(c => (
            <button key={c.id} className={`badge ${category === c.name ? "brand" : ""}`} style={{ border: "none", cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => onCategoryChange(c.name)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="empty">Loading providers...</div>
      ) : providers.length === 0 ? (
        <div className="empty">No professionals found. Try a different search, or make sure the backend was seeded (`npm run seed`).</div>
      ) : (
        providers.map(p => (
          <div key={p.id} className="card provider-row" style={{ cursor: "pointer" }} onClick={() => nav(`/provider/${p.id}`)}>
            <img src={p.avatar} className="avatar" alt="" />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <strong>{p.name}</strong>
                {p.verified ? <span className="badge success">Verified</span> : null}
              </div>
              <div className="muted">{p.title} · {p.city}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {p.skills.slice(0, 3).map(s => <span key={s} className="badge">{s}</span>)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="muted" style={{ fontSize: 11 }}>From</div>
              <strong>₹{p.startingPrice.toLocaleString("en-IN")}</strong>
              <div className="muted" style={{ fontSize: 12 }}>★ {p.rating} ({p.reviewCount})</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
