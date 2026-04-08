import Link from "next/link";
import { redirect } from "next/navigation";
import { markAllNotificationsRead } from "@/app/actions/notifications";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Notifications" };

function formatWhen(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/notifications");

  const items = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Updates on enrollments, messages, programs, and course work.
          </p>
        </div>
        {unread > 0 ? (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Mark all as read
            </button>
          </form>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No notifications yet. We&apos;ll notify you when something needs your
          attention.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 dark:divide-slate-800">
          {items.map((n) => (
            <li key={n.id}>
              {n.linkUrl ? (
                <Link
                  href={n.linkUrl}
                  className={`block py-4 transition hover:bg-slate-50/80 dark:hover:bg-slate-900/40 ${
                    !n.readAt ? "bg-sky-50/30 dark:bg-sky-950/15" : ""
                  }`}
                >
                  <NotificationBody n={n} />
                </Link>
              ) : (
                <div
                  className={`py-4 ${
                    !n.readAt ? "bg-sky-50/30 dark:bg-sky-950/15" : ""
                  }`}
                >
                  <NotificationBody n={n} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function NotificationBody({
  n,
}: {
  n: {
    title: string;
    body: string | null;
    createdAt: Date;
    readAt: Date | null;
  };
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${
            !n.readAt
              ? "font-semibold text-slate-900 dark:text-white"
              : "font-medium text-slate-700 dark:text-slate-300"
          }`}
        >
          {n.title}
        </p>
        {n.body ? (
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
            {n.body}
          </p>
        ) : null}
      </div>
      <time
        className="shrink-0 text-xs text-slate-400 dark:text-slate-500"
        dateTime={n.createdAt.toISOString()}
      >
        {formatWhen(n.createdAt)}
      </time>
    </div>
  );
}
