"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type InstructorRosterItem = {
  enrollmentId: string;
  displayName: string;
  email: string;
  progressPct: number;
  pendingReviews: number;
  courseComplete: boolean;
  /** New messages from this student since instructor last read (0 while selected). */
  unreadFromStudent: number;
};

type Props = {
  courseId: string;
  selectedEnrollmentId: string;
  items: InstructorRosterItem[];
};

export function InstructorStudentRoster({
  courseId,
  selectedEnrollmentId,
  items,
}: Props) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (i) =>
        i.displayName.toLowerCase().includes(s) ||
        i.email.toLowerCase().includes(s),
    );
  }, [items, q]);

  return (
    <div className="flex min-h-[320px] flex-col border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40 lg:min-h-[min(85vh,920px)] lg:border-b-0 lg:border-r">
      <div className="shrink-0 space-y-2 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <label className="sr-only" htmlFor="instructor-student-search">
          Search students
        </label>
        <input
          id="instructor-student-search"
          type="search"
          placeholder="Search name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {filtered.length === items.length
            ? `${items.length} student${items.length === 1 ? "" : "s"}`
            : `${filtered.length} of ${items.length} shown`}
        </p>
      </div>
      <nav
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
        aria-label="Student list"
      >
        <ul className="space-y-1">
          {filtered.map((item) => {
            const active = item.enrollmentId === selectedEnrollmentId;
            return (
              <li key={item.enrollmentId}>
                <Link
                  href={`/instructor/courses/${courseId}/students?e=${item.enrollmentId}`}
                  scroll={false}
                  className={`block rounded-xl px-3 py-2.5 text-left transition ${
                    active
                      ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/30 dark:bg-indigo-600 dark:text-white"
                      : "text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                      <span
                        className={`font-semibold leading-snug ${
                          active ? "text-white" : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {item.displayName}
                      </span>
                      {item.unreadFromStudent > 0 ? (
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            active
                              ? "bg-amber-400 text-amber-950"
                              : "bg-amber-500 text-white dark:bg-amber-600"
                          }`}
                          title={`${item.unreadFromStudent} new message${item.unreadFromStudent === 1 ? "" : "s"} from student`}
                        >
                          {item.unreadFromStudent > 99
                            ? "99+"
                            : item.unreadFromStudent}{" "}
                          new
                        </span>
                      ) : null}
                    </span>
                    {item.courseComplete ? (
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200"
                        }`}
                      >
                        Done
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={`mt-0.5 truncate text-xs ${
                      active
                        ? "text-indigo-100"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {item.email}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className={`h-1.5 min-w-0 flex-1 overflow-hidden rounded-full ${
                        active ? "bg-white/25" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <div
                        className="h-full rounded-full bg-white/90 dark:bg-indigo-400"
                        style={{
                          width: `${item.progressPct}%`,
                          opacity: active ? 1 : 0.85,
                        }}
                      />
                    </div>
                    <span
                      className={`shrink-0 text-xs tabular-nums ${
                        active ? "text-white" : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {item.progressPct}%
                    </span>
                  </div>
                  {item.pendingReviews > 0 ? (
                    <p
                      className={`mt-1.5 text-xs font-medium ${
                        active
                          ? "text-amber-200"
                          : "text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {item.pendingReviews} submission
                      {item.pendingReviews === 1 ? "" : "s"} to review
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
        {filtered.length === 0 && (
          <p className="px-3 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No students match your search.
          </p>
        )}
      </nav>
    </div>
  );
}
