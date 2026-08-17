import React, { useEffect, useState } from "react";
import { api } from "../api";
import { SITE_URL, SUPPORT_EMAIL } from "../config";

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryOnline, setNewCategoryOnline] = useState(true);
  const [error, setError] = useState("");

  const loadAll = () => {
    api.adminOverview().then(setOverview).catch(e => setError(e.message));
    api.adminUsers().then(d => setUsers(d.users)).catch(e => setError(e.message));
    api.adminProviders().then(d => setProviders(d.providers)).catch(e => setError(e.message));
    api.adminBookings().then(d => setBookings(d.bookings)).catch(e => setError(e.message));
    api.adminCategories().then(d => setCategories(d.categories)).catch(e => setError(e.message));
  };
  useEffect(loadAll, []);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await api.adminAddCategory({ name: newCategory.trim(), online: newCategoryOnline });
      setNewCategory("");
      loadAll();
    } catch (e) {
      setError(e.message);
    }
  };
  const removeCategory = async (id) => {
    await api.adminDeleteCategory(id);
    loadAll();
  };

  const toggleUserStatus = async (u) => {
    await api.adminSetUserStatus(u.id, u.status === "active" ? "suspended" : "active");
    loadAll();
  };
  const toggleVerify = async (p) => {
    await api.adminVerifyProvider(p.id, !p.verified);
    loadAll();
  };

  return (
    <div>
      <h1>Marketplace Admin</h1>
      {error && <div className="error-banner">{error}</div>}
      <div className="tabs">
        {["overview", "users", "providers", "categories", "bookings"].map(t => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === "overview" && overview && (
        <>
          {(() => {
            const unverifiedCount = providers.filter(p => !p.verified).length;
            const suspendedCount = users.filter(u => u.status === "suspended").length;
            const emptyCategories = categories.length === 0;
            const items = [
              unverifiedCount > 0 && { text: `${unverifiedCount} provider${unverifiedCount > 1 ? "s" : ""} awaiting verification`, tab: "providers" },
              suspendedCount > 0 && { text: `${suspendedCount} user${suspendedCount > 1 ? "s" : ""} currently suspended`, tab: "users" },
              emptyCategories && { text: `No work categories set up yet`, tab: "categories" },
            ].filter(Boolean);
            if (items.length === 0) return null;
            return (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>⚠ Action Required</h3>
                {items.map(it => (
                  <div key={it.text} className="action-required-item" onClick={() => setTab(it.tab)}>
                    <span>⚠️</span>
                    <span style={{ flex: 1 }}>{it.text}</span>
                    <span className="muted">›</span>
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="stat-grid">
            <div className="stat-box"><div className="v">{overview.totalUsers}</div><div className="l">Total users</div></div>
            <div className="stat-box"><div className="v">{overview.customers}</div><div className="l">Customers</div></div>
            <div className="stat-box"><div className="v">{overview.providers}</div><div className="l">Providers</div></div>
            <div className="stat-box"><div className="v">{overview.bookings}</div><div className="l">Bookings</div></div>
            <div className="stat-box" style={{ gridColumn: "1 / -1" }}><div className="v">₹{overview.gmv.toLocaleString("en-IN")}</div><div className="l">Total GMV</div></div>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Platform settings</h3>
            <div className="muted">Support email</div>
            <div style={{ marginBottom: 10 }}><strong>{SUPPORT_EMAIL}</strong></div>
            <div className="muted">Website</div>
            <div><strong>{SITE_URL}</strong></div>
            <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>Configured centrally in <code>src/config.js</code> — change once, updates everywhere it's referenced.</p>
          </div>
        </>
      )}

      {tab === "users" && users.map(u => (
        <div key={u.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{u.name}</strong> <span className="badge">{u.role}</span>
            <div className="muted">{u.email} {u.phone ? `· ${u.phone}` : ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`badge ${u.status === "active" ? "success" : "danger"}`}>{u.status}</span>
            {u.role !== "admin" && (
              <button className="btn btn-secondary btn-sm" onClick={() => toggleUserStatus(u)}>
                {u.status === "active" ? "Suspend" : "Reactivate"}
              </button>
            )}
          </div>
        </div>
      ))}

      {tab === "providers" && providers.map(p => (
        <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{p.name}</strong>
            <div className="muted">{p.title} · {p.category} · {p.city}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`badge ${p.verified ? "success" : "warn"}`}>{p.verified ? "Verified" : "Unverified"}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => toggleVerify(p)}>
              {p.verified ? "Unverify" : "Verify"}
            </button>
          </div>
        </div>
      ))}

      {tab === "categories" && (
        <>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Add a work category</h3>
            <p className="muted">These appear as filters on the customer explore page and as options providers pick from when creating their profile.</p>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div className="field" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
                <label>Category name</label>
                <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Carpentry" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Type</label>
                <select value={newCategoryOnline ? "online" : "offline"} onChange={e => setNewCategoryOnline(e.target.value === "online")}>
                  <option value="online">Online / remote</option>
                  <option value="offline">Offline / local</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={addCategory}>Add</button>
            </div>
          </div>
          {categories.map(c => (
            <div key={c.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><strong>{c.name}</strong> <span className="badge">{c.online ? "Online" : "Offline"}</span></div>
              <button className="btn btn-danger btn-sm" onClick={() => removeCategory(c.id)}>Remove</button>
            </div>
          ))}
        </>
      )}

      {tab === "bookings" && bookings.map(b => (
        <div key={b.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{b.service_name}</strong>
            <div className="muted">{b.customer_name} → {b.provider_name}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>₹{b.price.toLocaleString("en-IN")}</strong>
            <div><span className="badge">{b.status}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}
