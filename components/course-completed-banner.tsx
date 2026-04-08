type Props = {
  courseTitle: string;
};

export function CourseCompletedBanner({ courseTitle }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/80 px-4 py-4 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/50 dark:to-teal-950/30 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-3 sm:items-center">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white shadow-md shadow-emerald-600/25 dark:bg-emerald-500"
          aria-hidden
        >
          ✓
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
            Course completed
          </p>
          <p className="mt-0.5 text-base font-semibold text-slate-900 dark:text-white">
            {courseTitle}
          </p>
          <p className="mt-1 text-sm text-emerald-900/85 dark:text-emerald-100/80">
            You have finished all lessons in this course. Great work.
          </p>
        </div>
      </div>
    </div>
  );
}
