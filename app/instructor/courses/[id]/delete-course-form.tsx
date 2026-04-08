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
      className="mt-4"
    >
      <button
        type="submit"
        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
      >
        Delete course permanently
      </button>
    </form>
  );
}
