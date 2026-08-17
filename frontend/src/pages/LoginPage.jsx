import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === "customer") nav("/");
      else if (user.role === "provider") nav("/provider");
      else nav("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const DEMO = {
    customer: { email: "customer@hirelystreet.com", password: "customer123" },
    provider: { email: "arjun@hirelystreet.com", password: "provider123" },
    admin: { email: "admin@hirelystreet.com", password: "admin123" },
  };

  const continueAs = async (which) => {
    setError("");
    setLoading(true);
    try {
      const user = await login(DEMO[which].email, DEMO[which].password);
      if (user.role === "customer") nav("/");
      else if (user.role === "provider") nav("/provider");
      else nav("/admin");
    } catch (err) {
      setError(err.message + " — make sure the backend has been seeded (`npm run seed`).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow">
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div className="dot" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--brand-600)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "serif", fontSize: 22, fontWeight: 600 }}>h</div>
        <h1 style={{ margin: "12px 0 2px" }}>Welcome back</h1>
        <p className="muted">Log in to HirelyStreet</p>
      </div>
      <form className="card" onSubmit={submit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type="password" required minLength={6} />
        </div>
        <button className="btn btn-primary btn-block" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
        <p className="muted" style={{ textAlign: "center", marginTop: 14 }}>
          Don't have an account? <Link to="/signup" style={{ color: "var(--brand-700)", fontWeight: 600 }}>Sign up</Link>
        </p>
      </form>

      <div className="card">
        <p className="muted" style={{ marginBottom: 8, fontWeight: 600 }}>Quick demo access</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => continueAs("customer")}>Continue as Customer</button>
          <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => continueAs("provider")}>Continue as Provider</button>
          <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => continueAs("admin")}>Continue as Admin</button>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>Requires the backend to be running and seeded (`npm run seed`).</p>
      </div>
    </div>
  );
}
