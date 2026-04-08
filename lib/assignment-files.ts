import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const MAX_BYTES = 15 * 1024 * 1024;

const ALLOWED_EXT = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".zip",
  ".pptx",
]);

function extension(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0) return "";
  return name.slice(i).toLowerCase();
}

export function validateAssignmentFile(file: File): { ok: true } | { error: string } {
  if (file.size > MAX_BYTES) {
    return { error: "File is too large (max 15 MB)." };
  }
  if (file.size === 0) {
    return { error: "Empty file." };
  }
  const ext = extension(file.name);
  if (!ext || !ALLOWED_EXT.has(ext)) {
    return {
      error: `File type not allowed. Use: ${[...ALLOWED_EXT].join(", ")}`,
    };
  }
  return { ok: true };
}

export async function saveAssignmentFile(
  file: File,
  submissionId: string,
): Promise<{ url: string; fileName: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safe = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const dir = join(
    process.cwd(),
    "public",
    "uploads",
    "assignments",
    submissionId,
  );
  await mkdir(dir, { recursive: true });
  const path = join(dir, safe);
  await writeFile(path, buffer);
  return {
    url: `/uploads/assignments/${submissionId}/${safe}`,
    fileName: file.name,
  };
}

export async function removeAssignmentFileFromDisk(
  publicUrl: string | null | undefined,
): Promise<void> {
  if (!publicUrl || !publicUrl.startsWith("/uploads/")) return;
  const local = join(process.cwd(), "public", publicUrl.replace(/^\//, ""));
  try {
    await unlink(local);
  } catch {
    // ignore missing
  }
}
