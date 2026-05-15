"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  showChevron = false,
}: {
  href: string;
  children: React.ReactNode;
  showChevron?: boolean;
}) {
  const pathname = usePathname();
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "text-sky-700 dark:text-sky-300"
          : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
      {showChevron ? (
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 8 4 4 4-4" />
        </svg>
      ) : null}
    </Link>
  );
}

export function SiteHeaderNav({
  user,
  signOutAction,
  notificationPreview,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="mx-auto flex h-[4.25rem] max-w-[88rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex min-w-0 shrink items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/brand/unipod-logo.png"
            alt="UR UniPod"
            width={220}
            height={52}
            className="h-9 w-auto max-w-[180px] object-contain object-left sm:h-10 sm:max-w-[220px]"
            priority
          />
          <span className="hidden min-w-0 flex-col border-l border-slate-200 pl-3 leading-tight sm:flex dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              UR UniPod
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Creativity starts here
            </span>
          </span>
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
          aria-label="Main"
        >
          <div className="inline-flex items-center gap-1">
            <NavItem href="/">Home</NavItem>
            <NavItem href="/programs">Programs</NavItem>
            <NavItem href="/courses">Courses</NavItem>
            {user ? <NavItem href="/labs">Labs</NavItem> : null}
            {user ? <NavItem href="/dashboard">Dashboard</NavItem> : null}
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            aria-label="Theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              <circle cx="12" cy="12" r="4" />
              <path strokeLinecap="round" d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
            </svg>
          </button>
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
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
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
          className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 lg:hidden"
        >
          <nav
            className="mx-auto flex max-w-[88rem] flex-col gap-1"
            aria-label="Mobile"
          >
            <Link
              href="/"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/programs"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900"
              onClick={() => setMobileOpen(false)}
            >
              Programs
            </Link>
            <Link
              href="/courses"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900"
              onClick={() => setMobileOpen(false)}
            >
              Courses
            </Link>
            {user ? (
              <Link
                href="/labs"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                Labs
              </Link>
            ) : null}
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
            ) : null}
            {user ? (
              <p className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300">
                Account, dashboard, and sign out are in the menu next to your
                profile picture.
              </p>
            ) : (
              <div className="mt-1 flex flex-col gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                <Link
                  href="/auth/signin"
                  className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-slate-900 dark:text-slate-100"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </>
  );
}
