/**
 * Lab routes that are visible without signing in (browse-only).
 * Operational routes (equipment admin, bookings, maintenance) stay protected.
 */
const RESERVED_LAB_SEGMENTS = new Set(["equipment", "bookings", "maintenance"]);

export function isPublicLabsPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  if (p === "/labs") return true;
  const parts = p.split("/").filter(Boolean);
  if (parts[0] !== "labs" || parts.length < 2) return false;
  if (RESERVED_LAB_SEGMENTS.has(parts[1])) return false;
  if (parts.length > 3) return false;
  if (parts.length === 3 && parts[2] === "edit") return false;
  return parts.length === 2;
}
