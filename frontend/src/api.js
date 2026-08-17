// src/api.js — thin fetch wrapper for the HirelyStreet backend.
//
// IMPORTANT for mobile builds: "localhost" on a phone/emulator refers to the
// device itself, not your computer. Before building the Android app, change
// API_BASE below to your machine's LAN IP (e.g. "http://192.168.1.5:4000/api")
// or to a deployed backend URL. Android emulators specifically can reach your
// host machine at "http://10.0.2.2:4000/api".

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function getToken() {
  return localStorage.getItem("hs_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("hs_token", token);
  else localStorage.removeItem("hs_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
  updateMe: (payload) => request("/auth/me", { method: "PATCH", body: payload }),

  listProviders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/providers${qs ? `?${qs}` : ""}`, { auth: false });
  },
  getProvider: (id) => request(`/providers/${id}`, { auth: false }),
  getMyProviderFull: () => request("/providers/me/full"),
  updateMyProviderProfile: (payload) => request("/providers/me/profile", { method: "PUT", body: payload }),
  addMyService: (payload) => request("/providers/me/services", { method: "POST", body: payload }),
  updateMyService: (id, payload) => request(`/providers/me/services/${id}`, { method: "PUT", body: payload }),
  deleteMyService: (id) => request(`/providers/me/services/${id}`, { method: "DELETE" }),
  addPortfolioImage: (payload) => request("/providers/me/portfolio", { method: "POST", body: payload }),
  deletePortfolioImage: (id) => request(`/providers/me/portfolio/${id}`, { method: "DELETE" }),

  createBooking: (payload) => request("/bookings", { method: "POST", body: payload }),
  myBookings: () => request("/bookings/mine"),
  updateBookingStatus: (id, status) => request(`/bookings/${id}/status`, { method: "PATCH", body: { status } }),
  reviewBooking: (id, payload) => request(`/bookings/${id}/review`, { method: "POST", body: payload }),

  // Direct UPI QR payment — collected AFTER the job is marked completed.
  // No escrow: the platform never holds funds, payment goes straight to the provider's UPI ID.
  getPaymentQr: (id) => request(`/bookings/${id}/pay`),
  confirmPayment: (id) => request(`/bookings/${id}/confirm-payment`, { method: "PATCH" }),

  categories: () => request("/providers/meta/categories", { auth: false }),

  adminOverview: () => request("/admin/overview"),
  adminUsers: () => request("/admin/users"),
  adminSetUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: "PATCH", body: { status } }),
  adminProviders: () => request("/admin/providers"),
  adminVerifyProvider: (id, verified) => request(`/admin/providers/${id}/verify`, { method: "PATCH", body: { verified } }),
  adminBookings: () => request("/admin/bookings"),
  adminCategories: () => request("/admin/categories"),
  adminAddCategory: (payload) => request("/admin/categories", { method: "POST", body: payload }),
  adminDeleteCategory: (id) => request(`/admin/categories/${id}`, { method: "DELETE" }),
};
