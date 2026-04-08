type Props = {
  completedCount: number;
  totalLessons: number;
  className?: string;
};

/** Learner course completion: lessons with `LessonProgress` vs all lessons in the course. */
export function LearnerCourseProgressBar({
  completedCount,
  totalLessons,
  className = "",
}: Props) {
  if (totalLessons <= 0) return null;

  const pct = Math.round((completedCount / totalLessons) * 100);

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/50 ${className}`}
      role="group"
      aria-label={`Course progress: ${completedCount} of ${totalLessons} lessons completed`}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Your progress
        </span>
        <span className="tabular-nums text-slate-600 dark:text-slate-300">
          {pct}%
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-indigo-600 transition-[width] duration-300 ease-out dark:bg-indigo-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
        {completedCount} of {totalLessons} lesson{totalLessons === 1 ? "" : "s"}{" "}
        completed
      </p>
    </div>
  );
}
