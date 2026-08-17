import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import { getSaved } from "../savedStore";

const MENU = [
  { icon: "👤", label: "Personal Information", to: "/account" },
  { icon: "💬", label: "Messages", to: "/messages" },
  { icon: "💳", label: "Payment Methods", to: "/payment-methods" },
  { icon: "🔔", label: "Notifications", to: "/notifications" },
  { icon: "❤️", label: "Saved", to: "/saved" },
  { icon: "❓", label: "Help & Support", to: "/help" },
];

export default function CustomerProfile() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState({ upcoming: 0, completed: 0, totalSpent: 0 });

  useEffect(() => {
    if (!user) return;
    api.myBookings().then(({ bookings }) => {
      const upcoming = bookings.filter(b => b.status === "upcoming" || b.status === "active").length;
      const completed = bookings.filter(b => b.status === "completed").length;
      const totalSpent = bookings.filter(b => b.payment_status === "paid").reduce((s, b) => s + b.price, 0);
      setStats({ upcoming, completed, totalSpent });
    }).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div>
        <h1 style={{ marginBottom: 16 }}>Profile</h1>
        <div className="profile-hero">
          <div className="row">
            <div className="pic">👤</div>
            <div>
              <div className="name">Guest</div>
              <div className="sub">Not signed in</div>
            </div>
          </div>
          <div className="profile-stats">
            <div className="stat"><div className="v">0</div><div className="l">Upcoming</div></div>
            <div className="stat"><div className="v">0</div><div className="l">Completed</div></div>
            <div className="stat"><div className="v">{getSaved().length}</div><div className="l">Saved</div></div>
          </div>
        </div>
        <button className="btn btn-primary btn-block" style={{ marginBottom: 20 }} onClick={() => nav("/login")}>→ Sign in</button>
        {MENU.map(m => (
          <div key={m.label} className="menu-row" onClick={() => nav(m.to === "/saved" || m.to === "/help" ? m.to : "/login")}>
            <div className="icon">{m.icon}</div>
            <div className="label">{m.label}</div>
            <div className="chev">›</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Profile</h1>
      <div className="profile-hero">
        <div className="row">
          <img src={user.avatar} className="pic" style={{ objectFit: "cover" }} alt="" />
          <div>
            <div className="name">{user.name}</div>
            <div className="sub">{user.email}</div>
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat"><div className="v">{stats.upcoming}</div><div className="l">Upcoming</div></div>
          <div className="stat"><div className="v">{stats.completed}</div><div className="l">Completed</div></div>
          <div className="stat"><div className="v">₹{stats.totalSpent.toLocaleString("en-IN")}</div><div className="l">Spent</div></div>
        </div>
      </div>

      {MENU.map(m => (
        <div key={m.label} className="menu-row" onClick={() => nav(m.to)}>
          <div className="icon">{m.icon}</div>
          <div className="label">{m.label}</div>
          <div className="chev">›</div>
        </div>
      ))}

      <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={() => { logout(); nav("/login"); }}>Log out</button>
    </div>
  );
}
