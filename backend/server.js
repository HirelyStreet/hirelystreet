// server.js — HirelyStreet API entrypoint
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const providerRoutes = require("./routes/providers");
const bookingRoutes = require("./routes/bookings");
const adminRoutes = require("./routes/admin");

const app = express();
app.use(cors());
// Raised limit so base64-encoded portfolio photos (a few MB each) can be
// uploaded as JSON without Express rejecting the request body as too large.
app.use(express.json({ limit: "8mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "hirelystreet-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`HirelyStreet API running on http://localhost:${PORT}`);
});
