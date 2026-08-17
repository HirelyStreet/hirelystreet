// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { requireAuth, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function publicUser(u) {
  const { password_hash, ...rest } = u;
  return rest;
}

// POST /api/auth/signup
// body: { name, email, password, role: 'customer'|'provider', phone? }
router.post("/signup", (req, res) => {
  const { name, email, password, role, phone } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password and role are required" });
  }
  if (!["customer", "provider"].includes(role)) {
    return res.status(400).json({ error: "role must be 'customer' or 'provider' (admin accounts are seeded separately)" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;

  const info = db.prepare(
    `INSERT INTO users (name, email, phone, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(name.trim(), email.toLowerCase().trim(), phone || null, password_hash, role, avatar);

  if (role === "provider") {
    db.prepare(
      `INSERT INTO provider_profiles (user_id, title, category, city, online, starting_price, about, skills)
       VALUES (?, ?, ?, ?, 1, 0, ?, '[]')`
    ).run(info.lastInsertRowid, "New Provider", "General Services", "Hyderabad", "Just joined HirelyStreet.");
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
// body: { email, password }
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: "Invalid email or password" });
  if (user.status === "suspended") return res.status(403).json({ error: "This account has been suspended" });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me — validate token & return current user
router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

// PATCH /api/auth/me — update the current user's own name/phone
router.patch("/me", requireAuth, (req, res) => {
  const { name, phone } = req.body || {};
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!existing) return res.status(404).json({ error: "User not found" });
  db.prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?").run(
    name?.trim() || existing.name,
    phone !== undefined ? phone : existing.phone,
    req.user.id
  );
  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(updated) });
});

module.exports = router;
