"use client";

import dynamic from "next/dynamic";

const LessonBlockNoteViewDynamic = dynamic(
  () =>
    import("@/components/lesson-block-note-view").then(
      (m) => m.LessonBlockNoteView,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="mt-8 flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        Loading lesson…
      </div>
    ),
  },
);

/** Client-only loader so the learn page (RSC) can embed BlockNote without `ssr: false` in a server file. */
export function LessonBlockNoteViewLoader({ raw }: { raw: string }) {
  return <LessonBlockNoteViewDynamic raw={raw} />;
}
