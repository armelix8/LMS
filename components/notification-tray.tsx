"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";
import type { NotificationPreviewItem } from "@/lib/notifications";

type Props = {
  unreadCount: number;
  recent: NotificationPreviewItem[];
};

function formatWhen(d: Date | string): string {
  const t = new Date(d).getTime();
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function NotificationTray({ unreadCount, recent }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const badge =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-teal-900/15 text-teal-900 transition hover:bg-teal-50/80 dark:border-teal-500/25 dark:text-teal-100 dark:hover:bg-teal-950/50"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {badge ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-[60] mt-2 w-[min(100vw-2rem,22rem)] origin-top-right rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Notifications
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  startTransition(() => {
                    markAllNotificationsRead().then(() => router.refresh());
                  });
                }}
                className="text-xs font-medium text-sky-700 hover:underline disabled:opacity-50 dark:text-sky-400"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto">
            {recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recent.map((n) => (
                  <li key={n.id}>
                    <NotificationRow
                      item={n}
                      onNavigate={() => {
                        setOpen(false);
                        router.refresh();
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 p-2 dark:border-slate-800">
            <Link
              href="/notifications"
              className="flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/50"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({
  item,
  onNavigate,
}: {
  item: NotificationPreviewItem;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = !item.readAt;
  const href = item.linkUrl ?? "/notifications";

  const content = (
    <>
      <p
        className={`text-sm leading-snug ${
          unread
            ? "font-semibold text-slate-900 dark:text-white"
            : "font-medium text-slate-700 dark:text-slate-300"
        }`}
      >
        {item.title}
      </p>
      {item.body ? (
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
          {item.body}
        </p>
      ) : null}
      <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
        {formatWhen(item.createdAt)}
      </p>
    </>
  );

  if (item.linkUrl) {
    return (
      <Link
        href={href}
        onClick={() => {
          if (unread) startTransition(() => markNotificationRead(item.id));
          onNavigate();
        }}
        className={`block px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
          unread ? "bg-sky-50/50 dark:bg-sky-950/20" : ""
        }`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await markNotificationRead(item.id);
          router.refresh();
          onNavigate();
        });
      }}
      className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
        unread ? "bg-sky-50/50 dark:bg-sky-950/20" : ""
      }`}
    >
      {content}
    </button>
  );
}
