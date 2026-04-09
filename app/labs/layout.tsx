import Link from "next/link";

export default function LabsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex-1">
      <div className="border-b border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          <Link
            href="/labs"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Labs
          </Link>
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
        </div>
      </div>
      {children}
    </div>
  );
}
