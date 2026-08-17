// routes/admin.js
const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

// GET /api/admin/overview
router.get("/overview", (req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) c FROM users").get().c;
  const customers = db.prepare("SELECT COUNT(*) c FROM users WHERE role='customer'").get().c;
  const providers = db.prepare("SELECT COUNT(*) c FROM users WHERE role='provider'").get().c;
  const bookings = db.prepare("SELECT COUNT(*) c FROM bookings").get().c;
  const gmv = db.prepare("SELECT COALESCE(SUM(price),0) s FROM bookings WHERE payment_status='paid'").get().s;
  res.json({ totalUsers, customers, providers, bookings, gmv });
});

// GET /api/admin/users
router.get("/users", (req, res) => {
  const rows = db.prepare("SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC").all();
  res.json({ users: rows });
});

// PATCH /api/admin/users/:id/status — suspend or reactivate a user
router.patch("/users/:id/status", (req, res) => {
  const { status } = req.body || {};
  if (!["active", "suspended"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ ok: true });
});

// GET /api/admin/providers — all listings, with owner + verification info
router.get("/providers", (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, u.name, u.email, u.avatar, u.status as user_status
    FROM provider_profiles p JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
  `).all();
  res.json({ providers: rows });
});

// PATCH /api/admin/providers/:id/verify
router.patch("/providers/:id/verify", (req, res) => {
  const { verified } = req.body || {};
  db.prepare("UPDATE provider_profiles SET verified = ? WHERE id = ?").run(verified ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// GET /api/admin/categories — full category list (same data as the public
// endpoint, kept here too so the admin UI has one consistent base path)
router.get("/categories", (req, res) => {
  const rows = db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
  res.json({ categories: rows });
});

// POST /api/admin/categories — admin adds a new "work" / service category
// body: { name, online }
router.post("/categories", (req, res) => {
  const { name, online } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Category name is required" });
  try {
    const info = db.prepare("INSERT INTO categories (name, online) VALUES (?, ?)").run(name.trim(), online === false ? 0 : 1);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) return res.status(409).json({ error: "That category already exists" });
    throw e;
  }
});

// DELETE /api/admin/categories/:id
router.delete("/categories/:id", (req, res) => {
  db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// GET /api/admin/bookings — every booking on the platform
router.get("/bookings", (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, cu.name as customer_name, pu.name as provider_name
    FROM bookings b
    JOIN users cu ON cu.id = b.customer_id
    JOIN provider_profiles p ON p.id = b.provider_id
    JOIN users pu ON pu.id = p.user_id
    ORDER BY b.created_at DESC
  `).all();
  res.json({ bookings: rows });
});

module.exports = router;
