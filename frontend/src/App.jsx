import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CustomerHome from "./pages/CustomerHome";
import ServicesHub from "./pages/ServicesHub";
import ServicesByMode from "./pages/ServicesByMode";
import CustomerExplore from "./pages/CustomerExplore";
import CustomerProviderDetail from "./pages/CustomerProviderDetail";
import CustomerBookings from "./pages/CustomerBookings";
import CustomerProfile from "./pages/CustomerProfile";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Saved from "./pages/Saved";
import HelpSupport from "./pages/HelpSupport";
import AccountInfo from "./pages/AccountInfo";
import PaymentMethods from "./pages/PaymentMethods";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderProfileEdit from "./pages/ProviderProfileEdit";
import AdminDashboard from "./pages/AdminDashboard";

// Pages a provider/admin shouldn't be browsing (these are the customer app) —
// send them back to their own dashboard instead. Guests and customers pass through.
function CustomerOnly({ children }) {
  const { user } = useAuth();
  if (user && user.role === "provider") return <Navigate to="/provider" replace />;
  if (user && user.role === "admin") return <Navigate to="/admin" replace />;
  return children;
}

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    const home = user.role === "customer" ? "/" : user.role === "provider" ? "/provider" : "/admin";
    return <Navigate to={home} replace />;
  }
  return children;
}

function RedirectIfAuthed({ children }) {
  const { user } = useAuth();
  if (user) {
    const home = user.role === "customer" ? "/" : user.role === "provider" ? "/provider" : "/admin";
    return <Navigate to={home} replace />;
  }
  return children;
}

function TopBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  // Provider/admin keep a simple top nav (work tools, not a browse-as-guest experience).
  if (user && (user.role === "provider" || user.role === "admin")) {
    const links = user.role === "provider"
      ? [["/provider", "Dashboard"], ["/provider/profile", "My Profile"]]
      : [["/admin", "Admin"]];
    return (
      <div className="topbar">
        <div className="brand"><span className="dot">h</span> HirelyStreet</div>
        <div className="nav-links">
          {links.map(([path, label]) => (
            <button key={path} className={loc.pathname === path ? "active" : ""} onClick={() => nav(path)}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={user.avatar} className="avatar-sm" alt="" />
          <button className="btn btn-secondary btn-sm" onClick={() => { logout(); nav("/login"); }}>Log out</button>
        </div>
      </div>
    );
  }

  // Customer / guest: minimal top bar — the bottom nav does the navigating.
  if (loc.pathname === "/login" || loc.pathname === "/signup") return null;
  return (
    <div className="topbar">
      <div className="brand"><span className="dot">h</span> HirelyStreet</div>
      {user ? (
        <img src={user.avatar} className="avatar-sm" style={{ cursor: "pointer" }} onClick={() => nav("/profile")} alt="" />
      ) : (
        <button className="btn btn-primary btn-sm" onClick={() => nav("/login")}>Sign in</button>
      )}
    </div>
  );
}

const CUSTOMER_TABS = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/bookings", label: "Bookings", icon: "📅" },
  { path: "/services", label: "Services", icon: "🔲" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

function BottomNav() {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  if (user && (user.role === "provider" || user.role === "admin")) return null;
  if (loc.pathname === "/login" || loc.pathname === "/signup") return null;
  if (loc.pathname.startsWith("/provider/") && loc.pathname !== "/provider/profile") return null; // provider detail view

  return (
    <nav className="bottom-nav-v2">
      {CUSTOMER_TABS.map(t => {
        const active = t.path === "/" ? loc.pathname === "/" : loc.pathname.startsWith(t.path);
        return (
          <button key={t.path} className={active ? "active" : ""} onClick={() => nav(t.path)}>
            <span className="ico">{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="empty">Loading HirelyStreet...</div>;
  }

  return (
    <div className="app-shell">
      <TopBar />
      <div className="main">
        <Routes>
          <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
          <Route path="/signup" element={<RedirectIfAuthed><SignupPage /></RedirectIfAuthed>} />

          {/* Guests can browse freely; booking/profile actions prompt sign-in inline */}
          <Route path="/" element={<CustomerOnly><CustomerHome /></CustomerOnly>} />
          <Route path="/services" element={<CustomerOnly><ServicesHub /></CustomerOnly>} />
          <Route path="/services/:mode" element={<CustomerOnly><ServicesByMode /></CustomerOnly>} />
          <Route path="/explore" element={<CustomerOnly><CustomerExplore /></CustomerOnly>} />
          <Route path="/provider/:id" element={<CustomerOnly><CustomerProviderDetail /></CustomerOnly>} />
          <Route path="/bookings" element={<CustomerOnly><CustomerBookings /></CustomerOnly>} />
          <Route path="/profile" element={<CustomerOnly><CustomerProfile /></CustomerOnly>} />
          <Route path="/notifications" element={<CustomerOnly><Notifications /></CustomerOnly>} />
          <Route path="/messages" element={<CustomerOnly><Messages /></CustomerOnly>} />
          <Route path="/saved" element={<CustomerOnly><Saved /></CustomerOnly>} />
          <Route path="/help" element={<CustomerOnly><HelpSupport /></CustomerOnly>} />
          <Route path="/account" element={<Protected role="customer"><AccountInfo /></Protected>} />
          <Route path="/payment-methods" element={<Protected role="customer"><PaymentMethods /></Protected>} />

          <Route path="/provider" element={<Protected role="provider"><ProviderDashboard /></Protected>} />
          <Route path="/provider/profile" element={<Protected role="provider"><ProviderProfileEdit /></Protected>} />

          <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />

          <Route path="*" element={<div className="empty">Page not found</div>} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}
