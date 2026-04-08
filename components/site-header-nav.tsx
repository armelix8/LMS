"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationTray } from "@/components/notification-tray";
import { UserAccountMenu } from "@/components/user-account-menu";
import type { HeaderSessionUser } from "@/components/header-types";
import type { NotificationPreviewItem } from "@/lib/notifications";

export type { HeaderSessionUser };

type Props = {
  user: HeaderSessionUser | null;
  signOutAction: () => Promise<void>;
  notificationPreview: {
    unreadCount: number;
    recent: NotificationPreviewItem[];
  } | null;
};

function NavItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-sky-50 text-sky-900 shadow-sm ring-1 ring-sky-200/90 dark:bg-sky-950/50 dark:text-sky-100 dark:ring-sky-700/60"
          : "text-slate-600 hover:bg-teal-50/80 hover:text-teal-900 dark:text-slate-400 dark:hover:bg-teal-950/40 dark:hover:text-teal-100"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function SiteHeaderNav({
  user,
  signOutAction,
  notificationPreview,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex min-w-0 shrink items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/brand/unipod-logo.png"
            alt="UniPod — University of Rwanda"
            width={240}
            height={56}
            className="h-10 w-auto max-w-[200px] object-contain object-left sm:max-w-[240px] sm:h-11"
            priority
          />
          <span className="hidden min-w-0 flex-col border-l border-teal-200/80 pl-3 leading-tight sm:flex dark:border-teal-700/50">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-800 dark:text-teal-200">
              Learn
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              LMS
            </span>
          </span>
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-0.5 md:flex"
          aria-label="Main"
        >
          <div className="inline-flex items-center gap-0.5 rounded-full border border-teal-900/10 bg-gradient-to-b from-white to-teal-50/40 p-1 shadow-inner dark:border-teal-500/15 dark:from-slate-900/80 dark:to-teal-950/30">
            <NavItem href="/courses">Courses</NavItem>
            <NavItem href="/programs">Programs</NavItem>
          </div>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user && notificationPreview ? (
            <NotificationTray
              unreadCount={notificationPreview.unreadCount}
              recent={notificationPreview.recent}
            />
          ) : null}
          {user ? (
            <UserAccountMenu user={user} signOutAction={signOutAction} />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/signin"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-teal-50 dark:text-slate-300 dark:hover:bg-teal-950/40"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400 dark:bg-sky-600 dark:hover:bg-sky-500"
              >
                Get started
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {user && notificationPreview ? (
            <NotificationTray
              unreadCount={notificationPreview.unreadCount}
              recent={notificationPreview.recent}
            />
          ) : null}
          {user ? (
            <UserAccountMenu user={user} signOutAction={signOutAction} />
          ) : null}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-teal-900/15 text-teal-900 dark:border-teal-500/25 dark:text-teal-100"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-teal-900/10 bg-gradient-to-b from-teal-50/90 to-white px-4 py-4 dark:border-teal-500/15 dark:from-teal-950/80 dark:to-slate-950 md:hidden"
        >
          <nav
            className="mx-auto flex max-w-6xl flex-col gap-1"
            aria-label="Mobile"
          >
            <Link
              href="/courses"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-teal-950 hover:bg-white dark:text-teal-50 dark:hover:bg-slate-900"
              onClick={() => setMobileOpen(false)}
            >
              Courses
            </Link>
            <Link
              href="/programs"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-teal-950 hover:bg-white dark:text-teal-50 dark:hover:bg-slate-900"
              onClick={() => setMobileOpen(false)}
            >
              Programs
            </Link>
            {user ? (
              <p className="mt-2 rounded-lg border border-dashed border-teal-300/80 bg-teal-50/50 px-3 py-2 text-xs text-teal-900 dark:border-teal-700/60 dark:bg-teal-950/40 dark:text-teal-200">
                Account, dashboard, and sign out are in the menu next to your
                profile picture.
              </p>
            ) : (
              <div className="mt-1 flex flex-col gap-2 border-t border-teal-200 pt-3 dark:border-teal-800">
                <Link
                  href="/auth/signin"
                  className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-teal-950 dark:text-teal-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-lg bg-sky-500 py-2.5 text-center text-sm font-semibold text-white dark:bg-sky-600"
                  onClick={() => setMobileOpen(false)}
                >
                  Get started
                </Link>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </>
  );
}
