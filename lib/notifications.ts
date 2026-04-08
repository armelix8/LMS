import { revalidatePath } from "next/cache";
import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NotificationPreviewItem = {
  id: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  readAt: Date | null;
  createdAt: Date | string;
  type: NotificationType;
};

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      linkUrl: input.linkUrl ?? null,
    },
  });
  revalidatePath("/", "layout");
}

/** Same notification for many users (e.g. all admins). Deduplicates user IDs. */
export async function createNotificationsForUsers(
  userIds: string[],
  payload: {
    type: NotificationType;
    title: string;
    body?: string | null;
    linkUrl?: string | null;
  },
): Promise<void> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body ?? null,
      linkUrl: payload.linkUrl ?? null,
    })),
  });
  revalidatePath("/", "layout");
}

export async function getNotificationPreview(userId: string): Promise<{
  unreadCount: number;
  recent: NotificationPreviewItem[];
}> {
  try {
    const [unreadCount, recent] = await Promise.all([
      prisma.notification.count({
        where: { userId, readAt: null },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          body: true,
          linkUrl: true,
          readAt: true,
          createdAt: true,
          type: true,
        },
      }),
    ]);
    return { unreadCount, recent };
  } catch (error) {
    // Keep the shell/header functional when DB is offline in dev.
    console.error("Failed to load notification preview:", error);
    return { unreadCount: 0, recent: [] };
  }
}
