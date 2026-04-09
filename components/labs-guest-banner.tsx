import Link from "next/link";

export function LabsGuestBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-slate-50 p-6 shadow-sm dark:border-sky-900/40 dark:from-sky-950/40 dark:via-slate-950 dark:to-slate-900">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-200/40 blur-2xl dark:bg-sky-500/10"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            Welcome
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            Explore our labs and spaces
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Browse facilities, capacity, and equipment. Sign in with your university account
            to request bookings and access full tools.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <Link
            href="/auth/signin?callbackUrl=/labs"
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup?callbackUrl=/labs"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
