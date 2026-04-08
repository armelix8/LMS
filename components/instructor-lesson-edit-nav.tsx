"use client";

import { useCallback, useEffect, useState } from "react";

const SECTION_IDS = [
  "edit-lesson-body",
  "edit-lesson-quiz",
  "edit-lesson-assignments",
] as const;

type Props = {
  questionCount: number;
  assignmentCount: number;
  pendingReviewCount: number;
};

export function InstructorLessonEditNav({
  questionCount,
  assignmentCount,
  pendingReviewCount,
}: Props) {
  const [active, setActive] = useState<(typeof SECTION_IDS)[number]>(
    "edit-lesson-body",
  );

  const scrollTo = useCallback((id: (typeof SECTION_IDS)[number]) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }, []);

  useEffect(() => {
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target.id && SECTION_IDS.includes(top.target.id as (typeof SECTION_IDS)[number])) {
          setActive(top.target.id as (typeof SECTION_IDS)[number]);
        }
      },
      {
        root: null,
        rootMargin: "-12% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const items: {
    id: (typeof SECTION_IDS)[number];
    title: string;
    subtitle: string;
    badge?: string;
    alert?: number;
  }[] = [
    {
      id: "edit-lesson-body",
      title: "Lesson",
      subtitle: "Title & content",
    },
    {
      id: "edit-lesson-quiz",
      title: "Quiz",
      subtitle: "Multiple choice",
      badge:
        questionCount > 0
          ? `${questionCount} question${questionCount === 1 ? "" : "s"}`
          : "Not set up",
    },
    {
      id: "edit-lesson-assignments",
      title: "Assignments",
      subtitle: "Tasks & reviews",
      badge:
        assignmentCount > 0
          ? `${assignmentCount} item${assignmentCount === 1 ? "" : "s"}`
          : "None yet",
      alert: pendingReviewCount > 0 ? pendingReviewCount : undefined,
    },
  ];

  const linkClass = (id: (typeof SECTION_IDS)[number]) =>
    `group flex w-full flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-left transition ${
      active === id
        ? "border-indigo-300 bg-indigo-50/90 shadow-sm ring-1 ring-indigo-200/80 dark:border-indigo-500/40 dark:bg-indigo-950/50 dark:ring-indigo-500/20"
        : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
    }`;

  return (
    <>
      {/* Mobile / tablet: compact horizontal nav */}
      <nav
        className="-mx-1 flex gap-2 overflow-x-auto pb-1 lg:hidden"
        aria-label="Lesson editor sections"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollTo(item.id)}
            className={`shrink-0 rounded-full border px-3 py-2 text-left text-xs font-semibold transition ${
              active === item.id
                ? "border-indigo-400 bg-indigo-50 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-100"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            <span className="block whitespace-nowrap">{item.title}</span>
          </button>
        ))}
      </nav>

      {/* Desktop: sticky rail */}
      <nav
        className="hidden lg:block lg:w-[220px] lg:shrink-0"
        aria-label="Lesson editor sections"
      >
        <div className="sticky top-28 space-y-1">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            On this page
          </p>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className={linkClass(item.id)}
            >
              <span
                className={`text-sm font-semibold ${
                  active === item.id
                    ? "text-indigo-900 dark:text-indigo-100"
                    : "text-slate-800 dark:text-slate-100"
                }`}
              >
                {item.title}
                {item.alert != null ? (
                  <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white dark:bg-amber-600">
                    {item.alert}
                  </span>
                ) : null}
              </span>
              <span className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                {item.subtitle}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  active === item.id
                    ? "text-indigo-600 dark:text-indigo-300"
                    : "text-slate-500 dark:text-slate-500"
                }`}
              >
                {item.badge}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
