import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markRead } from "../notificationsStore";

export default function Notifications() {
  const nav = useNavigate();
  const [items, setItems] = useState(getNotifications());

  useEffect(() => {
    const refresh = () => setItems(getNotifications());
    window.addEventListener("hs-notifications-changed", refresh);
    return () => window.removeEventListener("hs-notifications-changed", refresh);
  }, []);

  const open = (n) => {
    if (!n.read) markRead(n.id);
    nav(n.to);
  };

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Notifications</h1>
      {items.length === 0 && <div className="empty">No notifications yet.</div>}
      {items.map(n => (
        <div key={n.id} className="menu-row" style={{ cursor: "pointer", background: n.read ? "#fff" : "var(--brand-50)" }} onClick={() => open(n)}>
          <div className="icon">{n.icon}</div>
          <div className="label">
            <div>{n.text}</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{new Date(n.time).toLocaleString()}</div>
          </div>
          {!n.read && <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--brand-600)" }} />}
        </div>
      ))}
    </div>
  );
}
