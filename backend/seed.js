// seed.js — run with `npm run seed`
// Creates the admin account + sample provider listings so the app isn't empty on first launch.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

const ADMIN_EMAIL = "admin@hirelystreet.com";
const ADMIN_PASSWORD = "admin123";

function upsertUser({ name, email, password, role, phone }) {
  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (existing) return existing;
  const password_hash = bcrypt.hashSync(password, 10);
  const avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;
  const info = db.prepare(
    `INSERT INTO users (name, email, phone, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(name, email, phone || null, password_hash, role, avatar);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
}

// 0. Work categories (admin-managed — these are the ones an admin would
//    normally add via the Admin > Categories tab)
const STARTER_CATEGORIES = [
  ["Web Development", 1], ["Graphic Design", 1], ["Video Editing", 1],
  ["Digital Marketing", 1], ["Content Writing", 1], ["Home Cleaning", 0],
  ["Electrician", 0], ["Plumbing", 0], ["AC Repair", 0], ["Tutoring", 1],
];
for (const [name, online] of STARTER_CATEGORIES) {
  const exists = db.prepare("SELECT id FROM categories WHERE name = ?").get(name);
  if (!exists) db.prepare("INSERT INTO categories (name, online) VALUES (?, ?)").run(name, online);
}
console.log(`Seeded ${STARTER_CATEGORIES.length} work categories`);

// 1. Admin
upsertUser({ name: "HirelyStreet Admin", email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: "admin" });
console.log(`Admin ready → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

// 2. Sample customer
upsertUser({ name: "Ritika Malhotra", email: "customer@hirelystreet.com", password: "customer123", role: "customer" });
console.log("Sample customer ready → customer@hirelystreet.com / customer123");

// 3. Sample providers with profiles + services
const SAMPLE_PROVIDERS = [
  { name: "Arjun Mehta", email: "arjun@hirelystreet.com", title: "Full Stack Developer", category: "Web Development", city: "Hyderabad", online: 1, price: 1500, upi: "arjunmehta@okhdfcbank",
    skills: ["React","Node.js","TypeScript"], services: [{ name: "Standard Website", price: 15000, duration: "7 days" }] },
  { name: "Priya Reddy", email: "priya@hirelystreet.com", title: "Logo & Brand Designer", category: "Graphic Design", city: "Bengaluru", online: 1, price: 2500, upi: "priyareddy@okicici",
    skills: ["Logo Design","Figma","Brand Identity"], services: [{ name: "Brand Identity Package", price: 8500, duration: "5 days" }] },
  { name: "Karthik Rao", email: "karthik@hirelystreet.com", title: "AC & Appliance Technician", category: "AC Repair", city: "Chennai", online: 0, price: 499, upi: "karthikrao@oksbi",
    skills: ["AC Servicing","Gas Refilling"], services: [{ name: "AC Servicing", price: 699, duration: "1 hr" }] },
];

for (const p of SAMPLE_PROVIDERS) {
  const user = upsertUser({ name: p.name, email: p.email, password: "provider123", role: "provider" });
  const exists = db.prepare("SELECT id FROM provider_profiles WHERE user_id = ?").get(user.id);
  let profileId;
  if (!exists) {
    const info = db.prepare(
      `INSERT INTO provider_profiles (user_id, title, category, city, online, starting_price, about, skills, upi_id, verified, rating, review_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 4.8, 32)`
    ).run(user.id, p.title, p.category, p.city, p.online, p.price, `${p.name} is a top-rated ${p.category.toLowerCase()} professional on HirelyStreet.`, JSON.stringify(p.skills), p.upi);
    profileId = info.lastInsertRowid;
    for (const s of p.services) {
      db.prepare("INSERT INTO services (provider_id, name, description, price, duration) VALUES (?, ?, ?, ?, ?)")
        .run(profileId, s.name, "", s.price, s.duration);
    }
  }
  console.log(`Provider ready → ${p.email} / provider123`);
}

console.log("\nSeeding complete.");
