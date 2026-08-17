import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { useAuth } from "../AuthContext";
import { api } from "../api";

const STATUS_TONE = { upcoming: "brand", active: "warn", completed: "success", cancelled: "danger" };
const TABS = ["upcoming", "completed", "cancelled"];

export default function CustomerBookings() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("upcoming");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewFor, setReviewFor] = useState(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [payFor, setPayFor] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [payInfo, setPayInfo] = useState(null);
  const [payError, setPayError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const load = () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    api.myBookings().then(({ bookings }) => setBookings(bookings)).catch(e => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [user]);

  const cancel = async (id) => {
    await api.updateBookingStatus(id, "cancelled");
    load();
  };

  const submitReview = async () => {
    await api.reviewBooking(reviewFor.id, { rating, text });
    setReviewFor(null); setText(""); setRating(5);
    load();
  };

  const openPay = async (b) => {
    setPayFor(b);
    setPayError("");
    setQrDataUrl(null);
    setPayInfo(null);
    try {
      const info = await api.getPaymentQr(b.id);
      setPayInfo(info);
      const dataUrl = await QRCode.toDataURL(info.upiString, { width: 240, margin: 1 });
      setQrDataUrl(dataUrl);
    } catch (e) {
      setPayError(e.message);
    }
  };

  const confirmPaid = async () => {
    setConfirming(true);
    try {
      await api.confirmPayment(payFor.id);
      setPayFor(null);
      load();
    } catch (e) {
      setPayError(e.message);
    } finally {
      setConfirming(false);
    }
  };

  const filtered = bookings.filter(b => tab === "upcoming" ? (b.status === "upcoming" || b.status === "active") : b.status === tab);

  return (
    <div>
      <h1>My Bookings</h1>

      {!user && (
        <div className="guest-banner">
          <div>
            <div className="title">🔒 Sign in to see bookings</div>
            <div className="muted">Your booking history will appear here.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => nav("/login")}>→ Sign in</button>
        </div>
      )}

      <div className="toggle-pill-row" style={{ marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}
      {user && loading ? (
        <div className="empty">Loading your bookings...</div>
      ) : user && filtered.length === 0 ? (
        <div className="empty">No {tab} bookings.</div>
      ) : null}

      {user && filtered.map(b => (
        <div key={b.id} className="card">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <img src={b.provider_avatar} className="avatar-sm" alt="" />
            <div style={{ flex: 1 }}>
              <strong>{b.service_name}</strong>
              <div className="muted">{b.provider_name} · {b.appointment_date || "Date TBD"} {b.appointment_time || ""}</div>
            </div>
            <span className={`badge ${STATUS_TONE[b.status]}`}>{b.status}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <div>
              <strong>₹{b.price.toLocaleString("en-IN")}</strong>{" "}
              {b.status === "completed" && (
                <span className={`badge ${b.payment_status === "paid" ? "success" : "warn"}`}>
                  {b.payment_status === "paid" ? "Paid" : "Payment due"}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {b.status === "upcoming" && <button className="btn btn-secondary btn-sm" onClick={() => cancel(b.id)}>Cancel</button>}
              {b.status === "completed" && b.payment_status === "pending" && (
                <button className="btn btn-primary btn-sm" onClick={() => openPay(b)}>Pay via UPI QR</button>
              )}
              {b.status === "completed" && b.payment_status === "paid" && (
                <button className="btn btn-primary btn-sm" onClick={() => setReviewFor(b)}>Leave review</button>
              )}
            </div>
          </div>
        </div>
      ))}

      {payFor && (
        <div className="card" style={{ textAlign: "center" }}>
          <h3 style={{ marginTop: 0 }}>Pay {payFor.provider_name}</h3>
          <p className="muted">Job completed — pay directly via UPI. HirelyStreet does not hold or process this payment.</p>
          {payError && <div className="error-banner">{payError}</div>}
          {qrDataUrl && (
            <>
              <img src={qrDataUrl} alt="UPI QR code" style={{ margin: "12px auto", display: "block" }} />
              <p><strong>₹{payInfo.amount.toLocaleString("en-IN")}</strong> to <strong>{payInfo.upiId}</strong></p>
              <p className="muted">Scan with any UPI app (GPay, PhonePe, Paytm...) to pay.</p>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn btn-secondary btn-block" onClick={() => setPayFor(null)}>Close</button>
                <button className="btn btn-primary btn-block" disabled={confirming} onClick={confirmPaid}>
                  {confirming ? "Confirming..." : "I've paid"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {reviewFor && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Review {reviewFor.provider_name}</h3>
          <div className="field">
            <label>Rating</label>
            <select value={rating} onChange={e => setRating(Number(e.target.value))}>
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} stars</option>)}
            </select>
          </div>
          <div className="field"><label>Comments</label><textarea rows={3} value={text} onChange={e => setText(e.target.value)} /></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setReviewFor(null)}>Cancel</button>
            <button className="btn btn-primary btn-block" onClick={submitReview}>Submit review</button>
          </div>
        </div>
      )}
    </div>
  );
}
