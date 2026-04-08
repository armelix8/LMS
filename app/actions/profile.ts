"use server";

import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import {
  deletePublicUploadFile,
  getFormImageFile,
  saveAvatarUpload,
  validateAvatarImage,
} from "@/lib/image-upload";
import { prisma } from "@/lib/prisma";
import { isPrismaMissingColumnError } from "@/lib/user-profile-db";

async function requireSessionUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/profile");
  return session.user;
}

const HEADLINE_MAX = 140;
const BIO_MAX = 2000;

export async function updateProfile(formData: FormData): Promise<void> {
  const u = await requireSessionUser();
  const existing = await prisma.user.findUnique({
    where: { id: u.id },
    select: { image: true },
  });

  const name = String(formData.get("name") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const imageRaw = String(formData.get("image") ?? "").trim();
  const avatarFile = getFormImageFile(formData, "avatarFile");
  const removeImage = formData.get("removeImage") === "on";

  if (!name) {
    redirect("/profile?error=name-required");
  }
  if (headline.length > HEADLINE_MAX) {
    redirect("/profile?error=headline-too-long");
  }
  if (bio.length > BIO_MAX) {
    redirect("/profile?error=bio-too-long");
  }

  let image: string | null | undefined = undefined;
  if (avatarFile) {
    const v = validateAvatarImage(avatarFile);
    if (!v.ok) {
      redirect(
        `/profile?error=invalid-avatar-image&reason=${v.reason}`,
      );
    }
    await deletePublicUploadFile(existing?.image);
    image = (await saveAvatarUpload(u.id, avatarFile)).url;
  } else if (removeImage) {
    await deletePublicUploadFile(existing?.image);
    image = null;
  } else if (imageRaw) {
    const parsed = z.string().url().safeParse(imageRaw);
    if (!parsed.success) {
      redirect("/profile?error=invalid-image-url");
    }
    if (existing?.image?.startsWith("/uploads/avatars/")) {
      await deletePublicUploadFile(existing.image);
    }
    image = parsed.data;
  }

  try {
    await prisma.user.update({
      where: { id: u.id },
      data: {
        name,
        headline: headline || null,
        bio: bio || null,
        ...(image !== undefined ? { image } : {}),
      },
    });
  } catch (e) {
    if (isPrismaMissingColumnError(e)) {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          name,
          ...(image !== undefined ? { image } : {}),
        },
      });
      revalidatePath("/profile");
      revalidatePath("/", "layout");
      redirect("/profile?ok=profile&notice=headline-bio-requires-schema");
    }
    throw e;
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  redirect("/profile?ok=profile");
}

export async function changePassword(formData: FormData): Promise<void> {
  const u = await requireSessionUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: u.id },
    select: { password: true },
  });
  if (!dbUser?.password) {
    redirect("/profile?error=no-password-account");
  }

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 8) {
    redirect("/profile?error=password-short");
  }
  if (next !== confirm) {
    redirect("/profile?error=password-mismatch");
  }

  const ok = await compare(current, dbUser.password);
  if (!ok) {
    redirect("/profile?error=wrong-current-password");
  }

  const newHash = await hash(next, 12);
  await prisma.user.update({
    where: { id: u.id },
    data: { password: newHash },
  });

  revalidatePath("/profile");
  redirect("/profile?ok=password");
}
