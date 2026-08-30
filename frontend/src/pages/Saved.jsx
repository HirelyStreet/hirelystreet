import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSaved, removeSaved } from "../savedStore";
import { useToast } from "../Toast";
import EmptyState from "../components/EmptyState";

export default function Saved() {
  const nav = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState(getSaved());

  useEffect(() => {
    const refresh = () => setItems(getSaved());
    window.addEventListener("hs-saved-changed", refresh);
    return () => window.removeEventListener("hs-saved-changed", refresh);
  }, []);

  const remove = (id) => {
    removeSaved(id);
    toast("Removed from saved");
  };

  if (items.length === 0) {
    return (
      <div>
        <h1 style={{ marginBottom: 16 }}>Saved</h1>
        <EmptyState emoji="♡" title="No saved services yet" text="Save providers you love and they’ll show up here." action="Explore services" onAction={() => nav("/explore")} />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Saved</h1>
      {items.map(p => (
        <div key={p.id} className="card provider-row">
          <img src={p.avatar} className="avatar" alt="" onClick={() => nav(`/provider/${p.id}`)} style={{ cursor: "pointer" }} />
          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => nav(`/provider/${p.id}`)}>
            <strong>{p.name}</strong>
            <div className="muted">{p.title} · {p.city}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => remove(p.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
