// src/config.js — central place for values that shouldn't be hardcoded
// throughout the app. If/when the real purchased domain is available, change
// it ONLY here and every "visit our website" link, footer, and share action
// updates automatically.

// No purchased domain was found in the project's reference files, so this is
// a placeholder — swap it for the real one whenever it's ready.
export const SITE_URL = "https://www.hirelystreet.com";

export const SUPPORT_EMAIL = "hirelystreet@gmail.com";

export function mailtoSupport(subject = "", body = "") {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${SUPPORT_EMAIL}${qs ? `?${qs}` : ""}`;
}
