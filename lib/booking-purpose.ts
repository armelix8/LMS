/** Max length for lab / equipment reservation purpose text. */
export const BOOKING_PURPOSE_MAX_LEN = 2000;

/** Returns trimmed purpose or null if missing / too long (invalid for new bookings). */
export function requireBookingPurposeFromFormData(
  formData: FormData,
): string | null {
  const raw = String(formData.get("purpose") ?? "").trim();
  if (!raw) return null;
  if (raw.length > BOOKING_PURPOSE_MAX_LEN) return null;
  return raw;
}
