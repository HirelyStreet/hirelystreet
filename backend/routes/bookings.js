// routes/bookings.js
const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// POST /api/bookings — customer books an appointment
// body: { providerId, serviceId?, serviceName, price, appointmentDate, appointmentTime, requirements? }
router.post("/", requireAuth, requireRole("customer"), (req, res) => {
  const { providerId, serviceId, serviceName, price, appointmentDate, appointmentTime, requirements } = req.body || {};
  if (!providerId || !serviceName || !price) {
    return res.status(400).json({ error: "providerId, serviceName and price are required" });
  }
  const provider = db.prepare("SELECT id FROM provider_profiles WHERE id = ?").get(providerId);
  if (!provider) return res.status(404).json({ error: "Provider not found" });

  // No money changes hands at booking time — payment is collected directly via
  // UPI QR code after the provider marks the job "completed".
  const info = db.prepare(
    `INSERT INTO bookings (customer_id, provider_id, service_id, service_name, price, appointment_date, appointment_time, requirements, status, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', 'pending')`
  ).run(req.user.id, providerId, serviceId || null, serviceName, price, appointmentDate || null, appointmentTime || null, requirements || null);

  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ booking });
});

// GET /api/bookings/mine — role-aware: customer sees their bookings, provider sees bookings for them
router.get("/mine", requireAuth, (req, res) => {
  let rows;
  if (req.user.role === "customer") {
    rows = db.prepare(`
      SELECT b.*, u.name as provider_name, u.avatar as provider_avatar
      FROM bookings b
      JOIN provider_profiles p ON p.id = b.provider_id
      JOIN users u ON u.id = p.user_id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
    `).all(req.user.id);
  } else if (req.user.role === "provider") {
    const profile = db.prepare("SELECT id FROM provider_profiles WHERE user_id = ?").get(req.user.id);
    rows = profile ? db.prepare(`
      SELECT b.*, u.name as customer_name, u.avatar as customer_avatar
      FROM bookings b
      JOIN users u ON u.id = b.customer_id
      WHERE b.provider_id = ?
      ORDER BY b.created_at DESC
    `).all(profile.id) : [];
  } else {
    return res.status(403).json({ error: "Admins should use /api/admin/bookings" });
  }
  res.json({ bookings: rows });
});

// PATCH /api/bookings/:id/status — update booking status (provider or customer, depending on action)
router.patch("/:id/status", requireAuth, (req, res) => {
  const { status } = req.body || {};
  const allowed = ["upcoming", "active", "completed", "cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const profile = db.prepare("SELECT id FROM provider_profiles WHERE user_id = ?").get(req.user.id);
  const isOwnerCustomer = req.user.role === "customer" && booking.customer_id === req.user.id;
  const isOwnerProvider = req.user.role === "provider" && profile && booking.provider_id === profile.id;
  if (!isOwnerCustomer && !isOwnerProvider && req.user.role !== "admin") {
    return res.status(403).json({ error: "Not authorized to update this booking" });
  }

  db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ ok: true });
});

// GET /api/bookings/:id/pay — returns the UPI payment string for a QR code.
// Only available once the provider has marked the job "completed". Payment is
// direct customer → provider via UPI (no escrow, platform never touches the money).
router.get("/:id/pay", requireAuth, requireRole("customer"), (req, res) => {
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!booking || booking.customer_id !== req.user.id) return res.status(404).json({ error: "Booking not found" });
  if (booking.status !== "completed") return res.status(400).json({ error: "Payment is only collected after the job is marked completed" });
  if (booking.payment_status === "paid") return res.status(400).json({ error: "This booking has already been paid" });

  const provider = db.prepare(`
    SELECT p.upi_id, u.name FROM provider_profiles p JOIN users u ON u.id = p.user_id WHERE p.id = ?
  `).get(booking.provider_id);
  if (!provider || !provider.upi_id) {
    return res.status(400).json({ error: "This provider hasn't set up a UPI ID yet — ask them to add one in their profile settings." });
  }

  const note = encodeURIComponent(`HirelyStreet booking #${booking.id}`);
  const payeeName = encodeURIComponent(provider.name);
  // Standard UPI deep link — any UPI app (GPay, PhonePe, Paytm, etc.) can scan/open this.
  const upiString = `upi://pay?pa=${provider.upi_id}&pn=${payeeName}&am=${booking.price}&cu=INR&tn=${note}`;

  res.json({ upiString, upiId: provider.upi_id, payeeName: provider.name, amount: booking.price });
});

// PATCH /api/bookings/:id/confirm-payment — customer confirms they've paid via UPI.
// This is a self-reported confirmation (there's no payment gateway in the loop
// since payment is direct P2P via UPI, not processed by HirelyStreet).
router.patch("/:id/confirm-payment", requireAuth, requireRole("customer"), (req, res) => {
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!booking || booking.customer_id !== req.user.id) return res.status(404).json({ error: "Booking not found" });
  if (booking.status !== "completed") return res.status(400).json({ error: "Job must be marked completed before payment" });

  db.prepare("UPDATE bookings SET payment_status = 'paid' WHERE id = ?").run(booking.id);
  res.json({ ok: true });
});

// POST /api/bookings/:id/review — customer reviews a completed booking
router.post("/:id/review", requireAuth, requireRole("customer"), (req, res) => {
  const { rating, text } = req.body || {};
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "rating must be 1-5" });

  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!booking || booking.customer_id !== req.user.id) return res.status(404).json({ error: "Booking not found" });

  db.prepare(
    "INSERT INTO reviews (booking_id, provider_id, customer_id, rating, text) VALUES (?, ?, ?, ?, ?)"
  ).run(booking.id, booking.provider_id, req.user.id, rating, text || "");

  const stats = db.prepare("SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE provider_id = ?").get(booking.provider_id);
  db.prepare("UPDATE provider_profiles SET rating = ?, review_count = ? WHERE id = ?")
    .run(Math.round(stats.avg * 10) / 10, stats.cnt, booking.provider_id);

  res.status(201).json({ ok: true });
});

module.exports = router;
