import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProviderProfileEdit() {
  const nav = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({ title: "", category: "", city: "", online: true, startingPrice: 0, about: "", skills: [], upiId: "" });
  const [skillInput, setSkillInput] = useState("");

  const [newService, setNewService] = useState({ name: "", description: "", price: "", duration: "" });
  const [editingServiceId, setEditingServiceId] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [full, cats] = await Promise.all([api.getMyProviderFull(), api.categories()]);
      setProfile(full.provider);
      setServices(full.services);
      setPortfolio(full.portfolio);
      setCategories(cats.categories);
      setForm({
        title: full.provider.title || "",
        category: full.provider.category || "",
        city: full.provider.city || "",
        online: full.provider.online,
        startingPrice: full.provider.startingPrice || 0,
        about: full.provider.about || "",
        skills: full.provider.skills || [],
        upiId: full.provider.upiId || "",
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await api.updateMyProviderProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setForm({ ...form, skills: [...form.skills, s] });
    setSkillInput("");
  };
  const removeSkill = (s) => setForm({ ...form, skills: form.skills.filter(x => x !== s) });

  const saveService = async () => {
    if (!newService.name || !newService.price) { setError("Service name and price are required"); return; }
    setError("");
    try {
      if (editingServiceId) {
        await api.updateMyService(editingServiceId, { ...newService, price: Number(newService.price) });
      } else {
        await api.addMyService({ ...newService, price: Number(newService.price) });
      }
      setNewService({ name: "", description: "", price: "", duration: "" });
      setEditingServiceId(null);
      const full = await api.getMyProviderFull();
      setServices(full.services);
    } catch (e) {
      setError(e.message);
    }
  };

  const editService = (s) => {
    setEditingServiceId(s.id);
    setNewService({ name: s.name, description: s.description || "", price: String(s.price), duration: s.duration || "" });
  };

  const deleteService = async (id) => {
    await api.deleteMyService(id);
    setServices(s => s.filter(x => x.id !== id));
    if (editingServiceId === id) { setEditingServiceId(null); setNewService({ name: "", description: "", price: "", duration: "" }); }
  };

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    if (file.size > 3.5 * 1024 * 1024) {
      setUploadError("Please choose a photo under ~3.5MB");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { id } = await api.addPortfolioImage({ imageData: dataUrl });
      setPortfolio(p => [{ id, image_data: dataUrl, caption: "" }, ...p]);
    } catch (err) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deletePhoto = async (id) => {
    await api.deletePortfolioImage(id);
    setPortfolio(p => p.filter(x => x.id !== id));
  };

  if (loading) return <div className="empty">Loading your profile...</div>;

  return (
    <div>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: 14 }} onClick={() => nav("/provider")}>← Back to dashboard</button>
      <h1>Customize your profile</h1>
      <p className="muted">This is what customers see when they view your listing.</p>
      {error && <div className="error-banner">{error}</div>}

      {/* --- Basic info --- */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Basic info</h3>
        <div className="field">
          <label>Professional title</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Full Stack Developer" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Category / work type</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">Select a category</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>City</label>
            <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g. Hyderabad" />
          </div>
        </div>
        <div className="role-toggle">
          <button type="button" className={form.online ? "active" : ""} onClick={() => setForm({ ...form, online: true })}>Online / remote</button>
          <button type="button" className={!form.online ? "active" : ""} onClick={() => setForm({ ...form, online: false })}>Offline / in-person</button>
        </div>
        <div className="field">
          <label>Starting price (₹)</label>
          <input type="number" value={form.startingPrice} onChange={e => setForm({ ...form, startingPrice: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label>About you</label>
          <textarea rows={4} value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} placeholder="Tell customers about your experience and what makes your work stand out..." />
        </div>
        <div className="field">
          <label>Skills</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Type a skill and press Enter" />
            <button type="button" className="btn btn-secondary" onClick={addSkill}>Add</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {form.skills.map(s => (
              <span key={s} className="badge brand" style={{ cursor: "pointer" }} onClick={() => removeSkill(s)}>{s} ✕</span>
            ))}
          </div>
        </div>
        <div className="field">
          <label>UPI ID (for direct payment after job completion)</label>
          <input value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} placeholder="yourname@okbank" />
        </div>
        <button className="btn btn-primary" disabled={saving} onClick={saveProfile}>
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save profile"}
        </button>
      </div>

      {/* --- Services --- */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Services you offer</h3>
        {services.length === 0 && <p className="muted">No services added yet — add your first one below.</p>}
        {services.map(s => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--ink-100)" }}>
            <div>
              <strong>{s.name}</strong> — ₹{s.price.toLocaleString("en-IN")} {s.duration && `· ${s.duration}`}
              {s.description && <div className="muted">{s.description}</div>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => editService(s)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => deleteService(s.id)}>Delete</button>
            </div>
          </div>
        ))}

        <h4 style={{ marginBottom: 8 }}>{editingServiceId ? "Edit service" : "Add a service"}</h4>
        <div className="grid-2">
          <div className="field"><label>Name</label><input value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} placeholder="e.g. Standard Website" /></div>
          <div className="field"><label>Price (₹)</label><input type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} /></div>
        </div>
        <div className="field"><label>Duration</label><input value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} placeholder="e.g. 5 days, 1 hr" /></div>
        <div className="field"><label>Description</label><textarea rows={2} value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} /></div>
        <div style={{ display: "flex", gap: 8 }}>
          {editingServiceId && <button className="btn btn-secondary" onClick={() => { setEditingServiceId(null); setNewService({ name: "", description: "", price: "", duration: "" }); }}>Cancel</button>}
          <button className="btn btn-primary" onClick={saveService}>{editingServiceId ? "Save changes" : "Add service"}</button>
        </div>
      </div>

      {/* --- Portfolio photos --- */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Portfolio photos</h3>
        <p className="muted">Show off your past work — customers see these on your profile.</p>
        {uploadError && <div className="error-banner">{uploadError}</div>}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickPhoto} />
        <button className="btn btn-secondary" disabled={uploading} onClick={() => fileInputRef.current.click()}>
          {uploading ? "Uploading..." : "+ Add photo"}
        </button>

        {portfolio.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10, marginTop: 14 }}>
            {portfolio.map(img => (
              <div key={img.id} style={{ position: "relative" }}>
                <img src={img.image_data} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10, border: "1px solid var(--ink-100)" }} />
                <button onClick={() => deletePhoto(img.id)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,.6)", color: "#fff", border: "none", borderRadius: 999, width: 22, height: 22, cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
