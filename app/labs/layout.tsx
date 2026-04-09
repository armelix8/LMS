import Link from "next/link";
import { auth } from "@/auth";

export default async function LabsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const signedIn = !!session?.user;

  return (
    <div className="flex-1">
      <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          <Link
            href="/labs"
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
          >
            Labs
          </Link>
          {signedIn ? (
            <>
              <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                |
              </span>
              <Link
                href="/labs/equipment"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Equipment
              </Link>
              <Link
                href="/labs/bookings"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Bookings
              </Link>
              <Link
                href="/labs/maintenance"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Maintenance
              </Link>
            </>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {signedIn ? (
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin?callbackUrl=/labs"
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/50"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup?callbackUrl=/labs"
                  className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
