import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import { isSaved, toggleSaved } from "../savedStore";
import { openConversation } from "../messagesStore";
import { addNotification } from "../notificationsStore";
import { useToast } from "../Toast";
import { SITE_URL } from "../config";

export default function CustomerProviderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null); // { service }
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [requirements, setRequirements] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getProvider(id).then(d => { setData(d); setSaved(isSaved(d.provider.id)); }).catch(e => setError(e.message));
  }, [id]);

  const startBooking = (service) => {
    if (!user) { nav("/login"); return; }
    setBooking(service);
  };

  const handleSave = () => {
    if (!user) { nav("/login"); return; }
    const nowSaved = toggleSaved({
      id: data.provider.id, name: data.provider.name, avatar: data.provider.avatar,
      title: data.provider.title, city: data.provider.city, startingPrice: data.provider.startingPrice,
    });
    setSaved(nowSaved);
    toast(nowSaved ? "Provider saved." : "Removed from saved.");
  };

  const handleMessage = () => {
    if (!user) { nav("/login"); return; }
    openConversation({ id: data.provider.id, name: data.provider.name, avatar: data.provider.avatar });
    nav("/messages", { state: { provider: { id: data.provider.id, name: data.provider.name, avatar: data.provider.avatar } } });
  };

  const handleSendRequest = () => {
    if (!user) { nav("/login"); return; }
    addNotification({ icon: "📨", text: `Your request was sent to ${data.provider.name}.`, to: "/messages" });
    toast(`Request sent to ${data.provider.name}`);
    handleMessage();
  };

  const handleShare = () => {
    const url = `${SITE_URL}/provider/${id}`;
    navigator.clipboard?.writeText(url).then(() => toast("Profile link copied")).catch(() => toast(url));
  };

  const submitBooking = async () => {
    setSubmitting(true);
    setError("");
    try {
      const { booking: created } = await api.createBooking({
        providerId: Number(id),
        serviceId: booking.id,
        serviceName: booking.name,
        price: booking.price,
        appointmentDate: date,
        appointmentTime: time,
        requirements,
      });
      setConfirmed(created);
      addNotification({ icon: "✅", text: `Booking confirmed with ${data.provider.name}.`, to: "/bookings" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !data) return <div className="error-banner">{error}</div>;
  if (!data) return <div className="empty">Loading...</div>;

  const { provider, services, portfolio, reviews } = data;

  if (confirmed) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <h2>Booking confirmed 🎉</h2>
        <p className="muted">Booking #{confirmed.id} with {provider.name}</p>
        <p style={{ margin: "12px 0" }}><strong>{confirmed.service_name}</strong> · ₹{confirmed.price.toLocaleString("en-IN")}</p>
        <button className="btn btn-primary" onClick={() => nav("/bookings")}>View my bookings</button>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: 14 }} onClick={() => nav(-1)}>← Back</button>
      <div className="card provider-row">
        <img src={provider.avatar} className="avatar" style={{ width: 72, height: 72 }} alt="" />
        <div>
          <h2 style={{ margin: 0 }}>{provider.name} {provider.verified && <span className="badge success">Verified</span>}</h2>
          <div className="muted">{provider.title} · {provider.city}</div>
          <div className="muted">★ {provider.rating} ({provider.reviewCount} reviews)</div>
          {provider.skills?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {provider.skills.map(s => <span key={s} className="badge">{s}</span>)}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={handleMessage}>💬 Message</button>
            <button className="btn btn-secondary btn-sm" onClick={handleSendRequest}>📨 Send Request</button>
            <button className="btn btn-secondary btn-sm" onClick={handleSave}>{saved ? "❤️ Saved" : "🤍 Save"}</button>
            <button className="btn btn-secondary btn-sm" onClick={handleShare}>🔗 Share</button>
          </div>
        </div>
      </div>

      {provider.about && <div className="card"><p>{provider.about}</p></div>}

      {portfolio && portfolio.length > 0 && (
        <>
          <h3>Portfolio</h3>
          <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
            {portfolio.map(img => (
              <img key={img.id} src={img.image_data} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10 }} />
            ))}
          </div>
        </>
      )}

      <h3>Services</h3>
      {services.length === 0 && <p className="muted">This provider hasn't added services yet.</p>}
      {services.map(s => (
        <div key={s.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{s.name}</strong>
            <div className="muted">{s.duration}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div><strong>₹{s.price.toLocaleString("en-IN")}</strong></div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 6 }} onClick={() => startBooking(s)}>Book</button>
          </div>
        </div>
      ))}

      {reviews.length > 0 && (
        <>
          <h3>Reviews</h3>
          {reviews.map(r => (
            <div key={r.id} className="card">
              <strong>{r.customer_name}</strong> — ★ {r.rating}
              <p className="muted">{r.text}</p>
            </div>
          ))}
        </>
      )}

      {booking && (
        <div className="card" style={{ position: "sticky", bottom: 70 }}>
          <h3 style={{ marginTop: 0 }}>Book: {booking.name}</h3>
          {error && <div className="error-banner">{error}</div>}
          <div className="grid-2">
            <div className="field"><label>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="field"><label>Time</label><input type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
          </div>
          <div className="field"><label>Requirements (optional)</label><textarea rows={3} value={requirements} onChange={e => setRequirements(e.target.value)} /></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setBooking(null)}>Cancel</button>
            <button className="btn btn-primary btn-block" disabled={submitting} onClick={submitBooking}>
              {submitting ? "Booking..." : `Confirm booking · ₹${booking.price.toLocaleString("en-IN")}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
