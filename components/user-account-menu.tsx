"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Role } from "@prisma/client";
import type { HeaderSessionUser } from "@/components/header-types";

type Props = {
  user: HeaderSessionUser;
  signOutAction: () => Promise<void>;
};

function roleLabel(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "INSTRUCTOR":
      return "Instructor";
    default:
      return "Learner";
  }
}

const menuItemClass =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80";

export function UserAccountMenu({ user, signOutAction }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const display =
    user.name?.trim() || user.email?.split("@")[0] || "Account";
  const initial = (display || "?").slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-teal-900/10 bg-white/90 py-1 pl-1 pr-2 shadow-sm transition hover:border-teal-900/20 hover:bg-white dark:border-teal-500/20 dark:bg-slate-900/90 dark:hover:bg-slate-900"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-sky-100 dark:ring-sky-900/50"
          />
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-sm font-semibold text-white dark:from-teal-500 dark:to-teal-700"
            aria-hidden
          >
            {initial}
          </span>
        )}
        <span className="hidden max-w-[140px] sm:block">
          <span className="block truncate text-left text-sm font-semibold text-slate-900 dark:text-white">
            {display}
          </span>
          <span className="block truncate text-left text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {roleLabel(user.role)}
          </span>
        </span>
        <svg
          className={`mr-1 h-4 w-4 shrink-0 text-slate-500 transition dark:text-slate-400 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-[70] mt-2 w-[min(calc(100vw-2rem),17.5rem)] origin-top-right rounded-2xl border border-slate-200/90 bg-white py-2 shadow-xl shadow-slate-900/10 ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
          role="menu"
          aria-label="Account"
        >
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:hidden">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {display}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {roleLabel(user.role)}
            </p>
          </div>

          <div className="hidden border-b border-slate-100 px-4 py-2.5 dark:border-slate-800 sm:block">
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/dashboard"
              className={menuItemClass}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/notifications"
              className={menuItemClass}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Notifications
            </Link>
            <Link
              href="/profile"
              className={menuItemClass}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            {(user.role === "INSTRUCTOR" || user.role === "ADMIN") && (
              <Link
                href="/instructor"
                className={menuItemClass}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                Instructor
              </Link>
            )}
            {user.role === "ADMIN" && (
              <Link
                href="/admin/programs"
                className={menuItemClass}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
          <div className="border-t border-slate-100 p-2 dark:border-slate-800">
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                role="menuitem"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
