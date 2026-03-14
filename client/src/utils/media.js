const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
let apiOriginFromBase = "http://localhost:5000";
try {
  apiOriginFromBase = new URL(API_BASE_URL).origin;
} catch (error) {
  apiOriginFromBase = "http://localhost:5000";
}
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || apiOriginFromBase;

export function resolveMediaUrl(value) {
  if (!value) return null;
  const input = String(value).trim();
  if (!input) return null;
  if (/^https?:\/\//i.test(input)) return input;

  const normalized = input.replace(/\\/g, "/");
  const uploadsIndex = normalized.lastIndexOf("/uploads/");
  if (uploadsIndex !== -1) {
    return `${API_ORIGIN}${normalized.slice(uploadsIndex)}`;
  }
  if (normalized.startsWith("uploads/")) {
    return `${API_ORIGIN}/${normalized}`;
  }
  if (normalized.startsWith("/uploads/")) {
    return `${API_ORIGIN}${normalized}`;
  }
  return input;
}

export function getCourseCategory(course) {
  const custom = course?.customCategory;
  if (typeof custom === "string" && custom.trim()) return custom.trim();
  return course?.category || "";
}
