// db.js — SQLite database connection + schema initialization
// Uses better-sqlite3: fast, synchronous, zero-config, file-based DB.
// The .db file is created automatically on first run — no external DB server needed.

require("dotenv").config();
const Database = require("better-sqlite3");
const path = require("path");

const DB_FILE = process.env.DB_FILE || "./hirelystreet.db";
const db = new Database(path.resolve(__dirname, DB_FILE));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('customer','provider','admin')),
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS provider_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  category TEXT,
  city TEXT,
  online INTEGER NOT NULL DEFAULT 1,
  starting_price INTEGER DEFAULT 0,
  about TEXT,
  skills TEXT,               -- JSON array stored as text
  upi_id TEXT,                -- provider's UPI VPA for direct QR payment, e.g. name@okhdfcbank
  verified INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 5.0,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- "Works" / service categories — managed by admin, selectable by providers when
-- creating their profile/services, and used as filters on the customer explore page.
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  online INTEGER NOT NULL DEFAULT 1,   -- 1 = typically remote/online work, 0 = local/in-person
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  duration TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Portfolio photos a provider uploads to showcase their work. Images are
-- stored as base64 data URIs directly in the DB — simplest option with no
-- external file storage/cloud bucket required. Fine for a handful of photos
-- per provider; swap for real object storage (S3, Cloudinary, etc.) if a
-- provider base ever needs many large images.
CREATE TABLE IF NOT EXISTS portfolio_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  image_data TEXT NOT NULL,
  caption TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  appointment_date TEXT,
  appointment_time TEXT,
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming','active','completed','cancelled')),
  -- Payment is collected AFTER the work is done, directly between customer and
  -- provider via a UPI QR code (no escrow/holding of funds by the platform).
  -- 'pending' until the job is completed and the customer confirms payment.
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','paid')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;
