import Link from "next/link";
import type { ReactNode } from "react";

/** Shared form field styles for instructor surfaces */
export const instructorLabelClass =
  "block text-sm font-medium text-slate-700 dark:text-slate-300";

export const instructorInputClass =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900/90 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25";

export const instructorTextareaClass = `${instructorInputClass} min-h-[140px] resize-y leading-relaxed`;

export const instructorFileInputClass =
  "mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 file:shadow-sm transition file:hover:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-950/50 dark:file:text-indigo-200 dark:file:hover:bg-indigo-900/60";

export const instructorHintClass =
  "mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400";

export const instructorPrimaryButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

export const instructorSecondaryButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800";

export const instructorCardClass =
  "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-800 dark:bg-slate-900/45 dark:ring-white/[0.04] sm:p-8";

export const instructorStatCardClass =
  "rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900/50 dark:ring-white/[0.03]";

export const instructorCalloutClass =
  "rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3.5 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300";

type BreadcrumbItem = { label: string; href?: string };

export function InstructorBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-x-1">
            {i > 0 ? (
              <span
                className="text-slate-300 dark:text-slate-600"
                aria-hidden
              >
                /
              </span>
            ) : null}
            {item.href ? (
              <Link
                href={item.href}
                className="font-medium text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="font-medium text-slate-800 dark:text-slate-200"
                aria-current={i === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function InstructorPageShell({
  children,
  maxWidthClass = "max-w-4xl",
  className = "",
}: {
  children: ReactNode;
  maxWidthClass?: string;
  className?: string;
}) {
  return (
    <main
      className={`mx-auto w-full ${maxWidthClass} flex-1 px-4 py-10 sm:px-6 lg:py-12 ${className}`}
    >
      {children}
    </main>
  );
}

type PageTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function InstructorPageTitle({
  eyebrow,
  title,
  description,
  actions,
}: PageTitleProps) {
  return (
    <div className="flex flex-col gap-6 border-b border-slate-200/90 pb-8 dark:border-slate-800 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2rem] sm:leading-tight">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
