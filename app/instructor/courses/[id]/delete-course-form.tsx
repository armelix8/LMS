"use client";

type Props = {
  deleteAction: () => Promise<void>;
  courseTitle: string;
};

export function DeleteCourseForm({ deleteAction, courseTitle }: Props) {
  return (
    <form
      action={deleteAction}
      onSubmit={(e) => {
        const msg = `Delete “${courseTitle}” and all modules, lessons, enrollments, quizzes, assignments, and submissions? This cannot be undone.`;
        if (!confirm(msg)) e.preventDefault();
      }}
      className="mt-5"
    >
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-800 shadow-sm transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-800/90 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
      >
        Delete course permanently
      </button>
    </form>
  );
}
