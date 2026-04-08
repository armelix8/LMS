import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function isPrismaMissingColumnError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022"
  );
}

const profilePageSelectFull = {
  email: true,
  name: true,
  headline: true,
  bio: true,
  image: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
  password: true,
} as const;

const profilePageSelectLegacy = {
  email: true,
  name: true,
  image: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
  password: true,
} as const;

export type ProfilePageUser = Prisma.UserGetPayload<{
  select: typeof profilePageSelectFull;
}>;

export async function loadUserForProfilePage(
  userId: string,
): Promise<ProfilePageUser | null> {
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: profilePageSelectFull,
    });
    return row;
  } catch (e) {
    if (!isPrismaMissingColumnError(e)) throw e;
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: profilePageSelectLegacy,
    });
    if (!row) return null;
    return { ...row, headline: null, bio: null };
  }
}

export async function getUserProfileSnapshotSafe(userId: string): Promise<{
  name: string | null;
  headline: string | null;
}> {
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, headline: true },
    });
    return {
      name: u?.name?.trim() || null,
      headline: u?.headline?.trim() || null,
    };
  } catch (e) {
    if (!isPrismaMissingColumnError(e)) throw e;
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return {
      name: u?.name?.trim() || null,
      headline: null,
    };
  }
}
