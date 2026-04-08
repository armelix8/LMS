"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { setLessonCompleted } from "@/app/actions/lms";

type NavLesson = { id: string; title: string };

type Props = {
  slug: string;
  lessonId: string;
  prevLesson: NavLesson | null;
  nextLesson: NavLesson | null;
  isCompleted: boolean;
  /** Skip auto-complete for instructor learner preview */
  isInstructorOwner: boolean;
};

export function LessonNavigationBar({
  slug,
  lessonId,
  prevLesson,
  nextLesson,
  isCompleted,
  isInstructorOwner,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function goNext() {
    if (!nextLesson) return;
    startTransition(async () => {
      if (!isInstructorOwner && !isCompleted) {
        await setLessonCompleted(lessonId, true);
      }
      router.push(`/learn/${slug}/${nextLesson.id}`);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      {prevLesson && (
        <Link
          href={`/learn/${slug}/${prevLesson.id}`}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          ← Previous
        </Link>
      )}
      {nextLesson && (
        <button
          type="button"
          disabled={pending}
          onClick={goNext}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {pending ? "Next…" : "Next →"}
        </button>
      )}
    </div>
  );
}

type AutoProps = {
  lessonId: string;
  isLastLesson: boolean;
  isCompleted: boolean;
  isInstructorOwner: boolean;
  /** From server: no quiz/assignment blockers (same rules as Mark complete). */
  eligibleToComplete: boolean;
};

/**
 * When this is the final lesson and requirements are met, marks the lesson
 * complete so the course can show as finished without an extra click.
 */
export function LessonAutoCompleteWhenLast({
  lessonId,
  isLastLesson,
  isCompleted,
  isInstructorOwner,
  eligibleToComplete,
}: AutoProps) {
  const router = useRouter();

  useEffect(() => {
    if (
      !isLastLesson ||
      isCompleted ||
      isInstructorOwner ||
      !eligibleToComplete
    ) {
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await setLessonCompleted(lessonId, true);
      if (!cancelled && "ok" in res && res.ok) {
        router.refresh();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    lessonId,
    isLastLesson,
    isCompleted,
    isInstructorOwner,
    eligibleToComplete,
    router,
  ]);

  return null;
}
