import React, { useState } from "react";
import { SUPPORT_EMAIL, mailtoSupport } from "../config";

const FAQS = [
  { q: "How does HirelyStreet work?", a: "Browse or search for a service, view a provider's profile, and book directly. For local (offline) jobs the provider comes to you; for online work, they deliver remotely." },
  { q: "How do I hire a provider?", a: "Open their profile, pick a service, choose a date/time, and confirm the booking. No payment is needed until the job is actually completed." },
  { q: "How are payments protected?", a: "Payment happens after the job is marked completed by the provider — you pay them directly via a UPI QR code, so you're never paying upfront for work that hasn't been done." },
  { q: "How do I become a provider?", a: "Sign up and choose \"I offer services\" — you'll get your own dashboard to add services, upload portfolio photos, and set your price and UPI ID." },
  { q: "How do I cancel a booking?", a: "Go to My Bookings, open the booking, and tap Cancel. This is available any time before the provider marks the job as completed." },
  { q: "How do refunds work?", a: "Since payment only happens after work is completed and confirmed by you, most disputes are avoided by design. If something goes wrong, contact support below and we'll help mediate." },
  { q: "How does provider verification work?", a: "Providers submit ID details through their dashboard; our admin team reviews and approves it, after which a Verified badge appears on their public profile." },
];

export default function HelpSupport() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Help & Support</h1>
      <p className="muted" style={{ marginBottom: 18 }}>We're here to help — reach out any time.</p>

      <div className="card" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a className="btn btn-primary" href={mailtoSupport("Support request")}>✉️ Contact Support</a>
        <a className="btn btn-secondary" href={mailtoSupport("Reporting an issue")}>⚠️ Report an Issue</a>
        <a className="btn btn-secondary" href={mailtoSupport()}>{SUPPORT_EMAIL}</a>
      </div>

      <h3 style={{ margin: "20px 0 10px" }}>Frequently Asked Questions</h3>
      {FAQS.map((f, i) => (
        <div key={f.q} className="card" style={{ cursor: "pointer" }} onClick={() => setOpenIdx(openIdx === i ? -1 : i)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700 }}>
            {f.q}
            <span className="muted">{openIdx === i ? "−" : "+"}</span>
          </div>
          {openIdx === i && <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
