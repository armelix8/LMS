import Link from "next/link";

import type { LabStatus } from "@prisma/client";

import { statusBadgeClass } from "@/lib/lab-display";

function labStatusLabel(status: LabStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "MAINTENANCE":
      return "In maintenance";
    default:
      return "Closed";
  }
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export type LabExploreCardData = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  status: LabStatus;
  featuredImageUrl: string | null;
  equipmentCount: number;
  seatsAvailable: number;
};

export function LabExploreCard({
  lab,
  showEditLink = false,
}: {
  lab: LabExploreCardData;
  showEditLink?: boolean;
}) {
  const isClosed = lab.status === "CLOSED";
  const href = `/labs/${lab.id}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900/40 dark:ring-white/10">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
        {lab.featuredImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-provided URLs; avoid remotePatterns config
          <img
            src={lab.featuredImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-700 via-blue-900 to-slate-900">
            <span className="text-5xl opacity-90 drop-shadow-md" aria-hidden>
              🧪
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">
            {lab.name}
          </h2>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(lab.status)}`}
          >
            {labStatusLabel(lab.status)}
          </span>
        </div>

        <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <p className="flex items-start gap-2">
            <PinIcon className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
            <span>{lab.location}</span>
          </p>
          <p className="flex items-start gap-2">
            <UsersIcon className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
            <span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {lab.seatsAvailable}
              </span>
              <span className="text-slate-400"> / </span>
              {lab.capacity} seats available
            </span>
          </p>
          <p className="flex items-start gap-2">
            <WrenchIcon className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
            <span>
              Equipment:{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {lab.equipmentCount}
              </span>
            </span>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {showEditLink ? (
            <Link
              href={`${href}/edit`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Edit
            </Link>
          ) : null}
          {isClosed ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-500 dark:border-slate-600 dark:text-slate-500">
              Unavailable
            </span>
          ) : (
            <Link
              href={href}
              className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
            >
              View lab
              <ChevronIcon className="opacity-90" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
