import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

const MAX_COURSE_COVER_BYTES = 10 * 1024 * 1024;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_LAB_FEATURED_BYTES = 10 * 1024 * 1024;
const MAX_EQUIPMENT_FEATURED_BYTES = 10 * 1024 * 1024;

function extension(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0) return "";
  return name.slice(i).toLowerCase();
}

/** Non-empty image file from multipart form, or null. */
export function getFormImageFile(
  formData: FormData,
  key: string,
): File | null {
  const v = formData.get(key);
  if (v == null || typeof v === "string") return null;
  if (!(v instanceof File)) return null;
  if (v.size === 0) return null;
  return v;
}

export function validateCourseCoverImage(
  file: File,
): { ok: true } | { ok: false; reason: "size" | "type" } {
  if (file.size > MAX_COURSE_COVER_BYTES) return { ok: false, reason: "size" };
  const ext = extension(file.name);
  if (!ext || !IMAGE_EXT.has(ext)) return { ok: false, reason: "type" };
  return { ok: true };
}

export function validateAvatarImage(
  file: File,
): { ok: true } | { ok: false; reason: "size" | "type" } {
  if (file.size > MAX_AVATAR_BYTES) return { ok: false, reason: "size" };
  const ext = extension(file.name);
  if (!ext || !IMAGE_EXT.has(ext)) return { ok: false, reason: "type" };
  return { ok: true };
}

export function validateLabFeaturedImage(
  file: File,
): { ok: true } | { ok: false; reason: "size" | "type" } {
  if (file.size > MAX_LAB_FEATURED_BYTES) return { ok: false, reason: "size" };
  const ext = extension(file.name);
  if (!ext || !IMAGE_EXT.has(ext)) return { ok: false, reason: "type" };
  return { ok: true };
}

export function validateEquipmentFeaturedImage(
  file: File,
): { ok: true } | { ok: false; reason: "size" | "type" } {
  if (file.size > MAX_EQUIPMENT_FEATURED_BYTES) {
    return { ok: false, reason: "size" };
  }
  const ext = extension(file.name);
  if (!ext || !IMAGE_EXT.has(ext)) return { ok: false, reason: "type" };
  return { ok: true };
}

/** Remove a file we stored under known public uploads paths. */
export async function deletePublicUploadFile(
  publicUrl: string | null | undefined,
): Promise<void> {
  if (!publicUrl?.startsWith("/uploads/")) return;
  const rel = publicUrl.slice(1);
  if (rel.includes("..")) return;
  const ok =
    rel.startsWith("uploads/courses/") ||
    rel.startsWith("uploads/avatars/") ||
    rel.startsWith("uploads/labs/") ||
    rel.startsWith("uploads/equipment/");
  if (!ok) return;
  const local = join(process.cwd(), "public", rel);
  try {
    await unlink(local);
  } catch {
    /* missing */
  }
}

export async function saveCourseCoverUpload(
  courseId: string,
  file: File,
): Promise<{ url: string }> {
  const ext = extension(file.name) || ".jpg";
  const name = `${randomUUID()}${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "courses", courseId);
  await mkdir(dir, { recursive: true });
  const path = join(dir, name);
  await writeFile(path, Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/courses/${courseId}/${name}` };
}

/** Clears previous files in the user’s avatar folder, then saves the new image. */
export async function saveAvatarUpload(
  userId: string,
  file: File,
): Promise<{ url: string }> {
  const dir = join(process.cwd(), "public", "uploads", "avatars", userId);
  await mkdir(dir, { recursive: true });
  try {
    const prev = await readdir(dir);
    for (const f of prev) {
      await unlink(join(dir, f)).catch(() => {});
    }
  } catch {
    /* empty */
  }
  const ext = extension(file.name) || ".jpg";
  const name = `${randomUUID()}${ext}`;
  const path = join(dir, name);
  await writeFile(path, Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/avatars/${userId}/${name}` };
}

export async function saveLabFeaturedUpload(
  labId: string,
  file: File,
): Promise<{ url: string }> {
  const ext = extension(file.name) || ".jpg";
  const name = `${randomUUID()}${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "labs", labId);
  await mkdir(dir, { recursive: true });
  const path = join(dir, name);
  await writeFile(path, Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/labs/${labId}/${name}` };
}

export async function saveEquipmentFeaturedUpload(
  equipmentId: string,
  file: File,
): Promise<{ url: string }> {
  const ext = extension(file.name) || ".jpg";
  const name = `${randomUUID()}${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "equipment", equipmentId);
  await mkdir(dir, { recursive: true });
  const path = join(dir, name);
  await writeFile(path, Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/equipment/${equipmentId}/${name}` };
}
