"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
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
      className={`relative inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "text-[var(--brand-700)] dark:text-[var(--brand-300)]"
          : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
      {active ? (
        <span
          aria-hidden
          className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-[var(--brand-500)]"
        />
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
        <BrandLogo
          href="/"
          size="md"
          showTagline
          onClick={() => setMobileOpen(false)}
        />

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
          <a
            href="https://unipod.ur.ac.rw"
            target="_blank"
            rel="noreferrer"
            className="hidden text-xs font-medium text-[var(--muted-foreground)] underline-offset-4 hover:text-[var(--brand-700)] hover:underline dark:hover:text-[var(--brand-300)] xl:inline"
          >
            unipod.ur.ac.rw
          </a>
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
                className="inline-flex items-center rounded-md bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[var(--brand-900)]/10 transition hover:bg-[var(--brand-600)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-400)]"
              >
                Get started
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-slate-700 dark:text-slate-200"
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
          className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 lg:hidden"
        >
          <nav
            className="mx-auto flex max-w-[88rem] flex-col gap-1"
            aria-label="Mobile"
          >
            {[
              { href: "/", label: "Home" },
              { href: "/programs", label: "Programs" },
              { href: "/courses", label: "Courses" },
              ...(user
                ? [
                    { href: "/labs", label: "Labs" },
                    { href: "/dashboard", label: "Dashboard" },
                  ]
                : []),
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {user ? (
              <p className="mt-2 rounded-lg border border-dashed border-[var(--border-strong)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                Account, dashboard, and sign out are in the menu next to your
                profile picture.
              </p>
            ) : (
              <div className="mt-1 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
                <Link
                  href="/auth/signin"
                  className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-slate-900 dark:text-slate-100"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-lg bg-[var(--brand-500)] py-2.5 text-center text-sm font-semibold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Get started
                </Link>
              </div>
            )}

            <a
              href="https://unipod.ur.ac.rw"
              target="_blank"
              rel="noreferrer"
              className="mt-3 rounded-lg px-3 py-2 text-xs text-[var(--muted-foreground)] underline-offset-4 hover:underline"
            >
              Visit unipod.ur.ac.rw →
            </a>
          </nav>
        </div>
      ) : null}
    </>
  );
}
