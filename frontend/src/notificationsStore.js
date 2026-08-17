// src/notificationsStore.js
//
// Notifications — seeded with a few realistic sample entries so the page
// isn't empty on first run, plus real ones get added by actual actions
// (booking confirmed, review submitted, etc. — see calls to `addNotification`
// around the app). Persisted in localStorage; no backend `notifications`
// table exists yet (see README backlog).

const KEY = "hs_notifications";

const SEED = [
  { id: "seed-1", icon: "👥", text: "Your Smart Request received 3 new proposals.", to: "/services", read: false, time: Date.now() - 1000 * 60 * 5 },
  { id: "seed-2", icon: "✅", text: "Your booking was accepted by the provider.", to: "/bookings", read: false, time: Date.now() - 1000 * 60 * 60 },
  { id: "seed-3", icon: "💬", text: "You have a new message.", to: "/messages", read: true, time: Date.now() - 1000 * 60 * 60 * 5 },
];

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) { write(SEED); return SEED; }
    return JSON.parse(raw);
  } catch { return SEED; }
}
function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("hs-notifications-changed"));
}

export function getNotifications() {
  return read().sort((a, b) => b.time - a.time);
}
export function unreadCount() {
  return read().filter(n => !n.read).length;
}
export function markRead(id) {
  write(read().map(n => n.id === id ? { ...n, read: true } : n));
}
export function addNotification({ icon = "🔔", text, to = "/" }) {
  const list = read();
  list.unshift({ id: "n-" + Date.now(), icon, text, to, read: false, time: Date.now() });
  write(list);
}
