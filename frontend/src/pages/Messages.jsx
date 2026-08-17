import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getConversations, getConversation, openConversation, sendMessage } from "../messagesStore";
import { useToast } from "../Toast";

export default function Messages() {
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const [convos, setConvos] = useState(getConversations());
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");

  // If we arrived here via "Message" on a provider profile, open/create that conversation
  useEffect(() => {
    if (loc.state?.provider) {
      openConversation(loc.state.provider);
      setConvos(getConversations());
      setActiveId(loc.state.provider.id);
    } else if (convos.length > 0 && !activeId) {
      setActiveId(convos[0].providerId);
    }
  }, [loc.state]);

  const active = activeId ? getConversation(activeId) : null;

  const send = () => {
    if (!draft.trim() || !activeId) return;
    sendMessage(activeId, draft);
    setDraft("");
    setConvos(getConversations());
    toast("Message sent");
  };

  if (convos.length === 0) {
    return (
      <div>
        <h1 style={{ marginBottom: 16 }}>Messages</h1>
        <div className="empty">
          No conversations yet.
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => nav("/explore")}>Find a provider to message</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Messages</h1>
      {!active ? (
        convos.map(c => (
          <div key={c.providerId} className="menu-row" onClick={() => setActiveId(c.providerId)}>
            <img src={c.providerAvatar} className="avatar-sm" alt="" />
            <div className="label">
              <div>{c.providerName}</div>
              <div className="muted" style={{ fontSize: 12 }}>{c.messages.length ? c.messages[c.messages.length - 1].text : "No messages yet"}</div>
            </div>
          </div>
        ))
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderBottom: "1px solid var(--ink-100)" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveId(null)}>←</button>
            <img src={active.providerAvatar} className="avatar-sm" alt="" />
            <strong>{active.providerName}</strong>
          </div>
          <div style={{ padding: 14, minHeight: 200, maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {active.messages.length === 0 && <p className="muted" style={{ textAlign: "center" }}>Say hello 👋</p>}
            {active.messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === "customer" ? "flex-end" : "flex-start", background: m.from === "customer" ? "var(--brand-700)" : "var(--ink-50)", color: m.from === "customer" ? "#fff" : "var(--ink-900)", padding: "8px 12px", borderRadius: 14, maxWidth: "75%" }}>
                {m.text}
                <div style={{ fontSize: 10, opacity: .7, marginTop: 2 }}>{m.time}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--ink-100)" }}>
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message..." style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--ink-100)", borderRadius: 10, background: "var(--ink-50)" }} />
            <button className="btn btn-primary btn-sm" onClick={send}>Send</button>
          </div>
        </div>
      )}
      <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>Note: messages are stored on this device only in this demo build.</p>
    </div>
  );
}
