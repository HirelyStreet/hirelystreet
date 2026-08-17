import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await signup({ ...form, role });
      nav(user.role === "customer" ? "/" : "/provider");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow">
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 2px" }}>Create your account</h1>
        <p className="muted">Join HirelyStreet — one platform, every service</p>
      </div>
      <form className="card" onSubmit={submit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="role-toggle">
          <button type="button" className={role === "customer" ? "active" : ""} onClick={() => setRole("customer")}>I'm hiring</button>
          <button type="button" className={role === "provider" ? "active" : ""} onClick={() => setRole("provider")}>I offer services</button>
        </div>
        <div className="field">
          <label>Full name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
        </div>
        <button className="btn btn-primary btn-block" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
        <p className="muted" style={{ textAlign: "center", marginTop: 14 }}>
          Already have an account? <Link to="/login" style={{ color: "var(--brand-700)", fontWeight: 600 }}>Log in</Link>
        </p>
      </form>
    </div>
  );
}
