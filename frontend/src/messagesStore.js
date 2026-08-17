// src/messagesStore.js
//
// Messaging — this is a genuinely working local mock (conversations persist
// in localStorage per device, sending appends immediately, unread counts
// work) but is NOT wired to a backend, so a provider logged in on a
// different device won't see a customer's message. There's no `messages`
// table yet (see README backlog) — this file's shape (conversations keyed by
// provider id, each an array of {from, text, time}) maps directly onto what
// a real `messages` table + Socket.io/poll-based API would need.

const KEY = "hs_conversations";

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function write(convos) {
  localStorage.setItem(KEY, JSON.stringify(convos));
  window.dispatchEvent(new Event("hs-messages-changed"));
}

export function getConversations() {
  const convos = read();
  return Object.values(convos).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function getConversation(providerId) {
  return read()[providerId] || null;
}

export function openConversation(provider) {
  const convos = read();
  if (!convos[provider.id]) {
    convos[provider.id] = {
      providerId: provider.id,
      providerName: provider.name,
      providerAvatar: provider.avatar,
      messages: [],
      updatedAt: Date.now(),
      unread: false,
    };
    write(convos);
  }
  return convos[provider.id];
}

export function sendMessage(providerId, text) {
  const convos = read();
  const convo = convos[providerId];
  if (!convo) return;
  convo.messages.push({ from: "customer", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
  convo.updatedAt = Date.now();
  write(convos);
}

export function unreadCount() {
  return Object.values(read()).filter(c => c.unread).length;
}
