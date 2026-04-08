import type { ReactNode } from "react";

/** Small stat row for course catalog page sidebar (Dribbble-style metadata). */
export function CourseMetaStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

export function formatCourseDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m} min`;
}

export function IconLayers(props: { className?: string }) {
  return (
    <svg
      className={props.className ?? "h-4 w-4"}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25A2.25 2.25 0 018.25 10.5H6A2.25 2.25 0 013.75 8.25V6zM13.5 3.75h2.25A2.25 2.25 0 0118 6v2.25A2.25 2.25 0 0115.75 10.5h-2.25A2.25 2.25 0 0111.25 8.25V6A2.25 2.25 0 0113.5 3.75zM3.75 13.5h2.25A2.25 2.25 0 0110.5 15.75v2.25A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM18 13.5h-2.25A2.25 2.25 0 0013.5 15.75v2.25A2.25 2.25 0 0015.75 20.25H18A2.25 2.25 0 0020.25 18v-2.25z"
      />
    </svg>
  );
}

export function IconBook(props: { className?: string }) {
  return (
    <svg
      className={props.className ?? "h-4 w-4"}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v15.263A9 9 0 0118 18a9 9 0 00-6-1.5m-6 1.5V4.5m6 1.5a8.967 8.967 0 00-6 2.292M18 18a9 9 0 00-6-2.292M18 18V6.042A8.967 8.967 0 0018 3.75c-1.052 0-2.062.18-3 .512"
      />
    </svg>
  );
}

export function IconClock(props: { className?: string }) {
  return (
    <svg
      className={props.className ?? "h-4 w-4"}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function IconUserCircle(props: { className?: string }) {
  return (
    <svg
      className={props.className ?? "h-4 w-4"}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.49 7.49 0 0012 15.75a7.49 7.49 0 00-5.982 2.975m11.963 0a9 9 0 10-11.926 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export function IconUsers(props: { className?: string }) {
  return (
    <svg
      className={props.className ?? "h-4 w-4"}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
      />
    </svg>
  );
}
