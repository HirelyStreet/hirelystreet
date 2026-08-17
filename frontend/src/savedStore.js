// src/savedStore.js
//
// "Saved providers" — implemented as a simple localStorage-backed store.
// There's no `saved_providers` table in the backend yet (see README backlog),
// so this genuinely works (persists across reloads, updates everywhere it's
// used) but is per-device, not synced across devices/accounts. Swap for a
// real `saved_providers` table + API route if that's needed later — the
// shape here (array of {id, name, avatar, title, city, startingPrice}) maps
// directly onto that.

const KEY = "hs_saved_providers";

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("hs-saved-changed"));
}

export function getSaved() {
  return read();
}
export function isSaved(id) {
  return read().some(p => p.id === id);
}
export function toggleSaved(provider) {
  const list = read();
  const exists = list.some(p => p.id === provider.id);
  const next = exists ? list.filter(p => p.id !== provider.id) : [...list, provider];
  write(next);
  return !exists; // true if now saved
}
export function removeSaved(id) {
  write(read().filter(p => p.id !== id));
}
