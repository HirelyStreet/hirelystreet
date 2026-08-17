// src/categoryMeta.js
// Cosmetic-only mapping: emoji icon + soft pastel tile background per category.
// Falls back to a generic icon/tint for any category an admin adds that isn't
// in this list, so new categories never look broken.

const META = {
  "Home Cleaning": { icon: "🧹", tint: "#fde3df" },
  "Plumbing": { icon: "🔧", tint: "#dbeefe" },
  "Electrician": { icon: "⚡", tint: "#fdf1cf" },
  "Electrical": { icon: "⚡", tint: "#fdf1cf" },
  "Pest Control": { icon: "🐞", tint: "#e0f3e2" },
  "Wall Painting": { icon: "🎨", tint: "#fbe0ef" },
  "Carpentry": { icon: "🪚", tint: "#f6e3cf" },
  "AC Repair": { icon: "❄️", tint: "#dff5f7" },
  "Tutoring": { icon: "📘", tint: "#e6e3fb" },
  "Web Development": { icon: "💻", tint: "#dcefe1" },
  "Graphic Design": { icon: "🖌️", tint: "#fbe0ef" },
  "Video Editing": { icon: "🎬", tint: "#e3e6fb" },
  "Digital Marketing": { icon: "📈", tint: "#fdeccb" },
  "Content Writing": { icon: "✍️", tint: "#e3f0fb" },
  "Photography": { icon: "📷", tint: "#eee0fb" },
  "Makeup Artist": { icon: "💄", tint: "#fbe0e6" },
  "Appliance Repair": { icon: "🧰", tint: "#e6ecf5" },
};

const DEFAULT = { icon: "🛠️", tint: "var(--brand-50)" };

export function categoryMeta(name) {
  return META[name] || DEFAULT;
}
