// routes/providers.js
const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function serializeProvider(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    avatar: row.avatar,
    title: row.title,
    category: row.category,
    city: row.city,
    online: !!row.online,
    startingPrice: row.starting_price,
    about: row.about,
    skills: JSON.parse(row.skills || "[]"),
    upiId: row.upi_id || null,
    verified: !!row.verified,
    rating: row.rating,
    reviewCount: row.review_count,
  };
}

// GET /api/providers?category=&city=&online=&q=
router.get("/", (req, res) => {
  const { category, city, online, q } = req.query;
  let sql = `SELECT p.*, u.name, u.avatar FROM provider_profiles p JOIN users u ON u.id = p.user_id WHERE u.status = 'active'`;
  const args = [];
  if (category) { sql += " AND p.category = ?"; args.push(category); }
  if (city) { sql += " AND p.city = ?"; args.push(city); }
  if (online === "true") sql += " AND p.online = 1";
  if (online === "false") sql += " AND p.online = 0";
  if (q) { sql += " AND (u.name LIKE ? OR p.title LIKE ? OR p.category LIKE ?)"; args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  sql += " ORDER BY p.rating DESC";
  const rows = db.prepare(sql).all(...args);
  res.json({ providers: rows.map(serializeProvider) });
});

// GET /api/providers/:id — full profile with services, portfolio, reviews
router.get("/:id", (req, res) => {
  const row = db.prepare(
    `SELECT p.*, u.name, u.avatar FROM provider_profiles p JOIN users u ON u.id = p.user_id WHERE p.id = ?`
  ).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Provider not found" });
  const services = db.prepare("SELECT * FROM services WHERE provider_id = ? ORDER BY id ASC").all(req.params.id);
  const portfolio = db.prepare("SELECT id, image_data, caption FROM portfolio_images WHERE provider_id = ? ORDER BY id DESC").all(req.params.id);
  const reviews = db.prepare("SELECT r.*, u.name as customer_name FROM reviews r JOIN users u ON u.id = r.customer_id WHERE provider_id = ? ORDER BY r.created_at DESC").all(req.params.id);
  res.json({ provider: serializeProvider(row), services, portfolio, reviews });
});

// GET /api/providers/me/full — provider's own profile + services + portfolio,
// for populating their edit page
router.get("/me/full", requireAuth, requireRole("provider"), (req, res) => {
  const row = db.prepare(
    `SELECT p.*, u.name, u.avatar FROM provider_profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = ?`
  ).get(req.user.id);
  if (!row) return res.status(404).json({ error: "Provider profile not found" });
  const services = db.prepare("SELECT * FROM services WHERE provider_id = ? ORDER BY id ASC").all(row.id);
  const portfolio = db.prepare("SELECT id, image_data, caption FROM portfolio_images WHERE provider_id = ? ORDER BY id DESC").all(row.id);
  res.json({ provider: serializeProvider(row), services, portfolio });
});

// PUT /api/providers/me — provider updates their own profile
router.put("/me/profile", requireAuth, requireRole("provider"), (req, res) => {
  const { title, category, city, online, startingPrice, about, skills, upiId } = req.body || {};
  const existing = db.prepare("SELECT * FROM provider_profiles WHERE user_id = ?").get(req.user.id);
  if (!existing) return res.status(404).json({ error: "Provider profile not found" });

  db.prepare(
    `UPDATE provider_profiles SET title=?, category=?, city=?, online=?, starting_price=?, about=?, skills=?, upi_id=? WHERE user_id=?`
  ).run(
    title ?? existing.title,
    category ?? existing.category,
    city ?? existing.city,
    online === undefined ? existing.online : (online ? 1 : 0),
    startingPrice ?? existing.starting_price,
    about ?? existing.about,
    skills ? JSON.stringify(skills) : existing.skills,
    upiId ?? existing.upi_id,
    req.user.id
  );
  res.json({ ok: true });
});

// GET /api/providers/meta/categories — public list of work categories (for
// provider onboarding dropdowns and customer explore filters).
router.get("/meta/categories", (req, res) => {
  const rows = db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
  res.json({ categories: rows });
});

// POST /api/providers/me/services — add a service
router.post("/me/services", requireAuth, requireRole("provider"), (req, res) => {
  const { name, description, price, duration } = req.body || {};
  if (!name || !price) return res.status(400).json({ error: "name and price are required" });
  const profile = db.prepare("SELECT id FROM provider_profiles WHERE user_id = ?").get(req.user.id);
  if (!profile) return res.status(404).json({ error: "Provider profile not found" });
  const info = db.prepare(
    "INSERT INTO services (provider_id, name, description, price, duration) VALUES (?, ?, ?, ?, ?)"
  ).run(profile.id, name, description || "", price, duration || "");
  res.status(201).json({ id: info.lastInsertRowid });
});

// Helper: confirm a service/portfolio row belongs to the logged-in provider
function ownedService(userId, serviceId) {
  return db.prepare(`
    SELECT s.* FROM services s
    JOIN provider_profiles p ON p.id = s.provider_id
    WHERE s.id = ? AND p.user_id = ?
  `).get(serviceId, userId);
}
function ownedImage(userId, imageId) {
  return db.prepare(`
    SELECT i.* FROM portfolio_images i
    JOIN provider_profiles p ON p.id = i.provider_id
    WHERE i.id = ? AND p.user_id = ?
  `).get(imageId, userId);
}

// PUT /api/providers/me/services/:id — edit a service
router.put("/me/services/:id", requireAuth, requireRole("provider"), (req, res) => {
  const existing = ownedService(req.user.id, req.params.id);
  if (!existing) return res.status(404).json({ error: "Service not found" });
  const { name, description, price, duration } = req.body || {};
  db.prepare("UPDATE services SET name=?, description=?, price=?, duration=? WHERE id=?").run(
    name ?? existing.name,
    description ?? existing.description,
    price ?? existing.price,
    duration ?? existing.duration,
    req.params.id
  );
  res.json({ ok: true });
});

// DELETE /api/providers/me/services/:id
router.delete("/me/services/:id", requireAuth, requireRole("provider"), (req, res) => {
  const existing = ownedService(req.user.id, req.params.id);
  if (!existing) return res.status(404).json({ error: "Service not found" });
  db.prepare("DELETE FROM services WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// POST /api/providers/me/portfolio — upload a portfolio photo
// body: { imageData, caption? }  — imageData is a base64 data URI from the browser's file input
router.post("/me/portfolio", requireAuth, requireRole("provider"), (req, res) => {
  const { imageData, caption } = req.body || {};
  if (!imageData || !imageData.startsWith("data:image/")) {
    return res.status(400).json({ error: "imageData must be a base64 image data URI" });
  }
  // Basic size guard — base64 images can get large; keep individual uploads reasonable (~3MB raw)
  if (imageData.length > 4_500_000) {
    return res.status(400).json({ error: "Image too large — please use a photo under ~3MB" });
  }
  const profile = db.prepare("SELECT id FROM provider_profiles WHERE user_id = ?").get(req.user.id);
  if (!profile) return res.status(404).json({ error: "Provider profile not found" });
  const info = db.prepare(
    "INSERT INTO portfolio_images (provider_id, image_data, caption) VALUES (?, ?, ?)"
  ).run(profile.id, imageData, caption || "");
  res.status(201).json({ id: info.lastInsertRowid });
});

// DELETE /api/providers/me/portfolio/:id
router.delete("/me/portfolio/:id", requireAuth, requireRole("provider"), (req, res) => {
  const existing = ownedImage(req.user.id, req.params.id);
  if (!existing) return res.status(404).json({ error: "Photo not found" });
  db.prepare("DELETE FROM portfolio_images WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
