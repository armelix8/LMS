import type { ProgramPhase, ProgramPhaseAssignment } from "@prisma/client";
import { isSubmissionApproved } from "@/lib/assignment-review";
import { prisma } from "@/lib/prisma";

export type CourseLessonProgress = {
  completedCount: number;
  totalLessons: number;
  isComplete: boolean;
};

/**
 * Lesson completion counts for a learner (same rules as the learn view progress bar).
 * Without ACTIVE enrollment, completedCount stays 0 while totalLessons reflects the course size.
 */
export async function getCourseLessonProgressForUser(
  userId: string,
  courseId: string,
): Promise<CourseLessonProgress> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { modules: { include: { lessons: { select: { id: true } } } } },
  });
  if (!course) {
    return { completedCount: 0, totalLessons: 0, isComplete: false };
  }

  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const totalLessons = lessonIds.length;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment || enrollment.status !== "ACTIVE") {
    return { completedCount: 0, totalLessons, isComplete: false };
  }

  if (totalLessons === 0) {
    return { completedCount: 0, totalLessons: 0, isComplete: true };
  }

  const completedCount = await prisma.lessonProgress.count({
    where: { userId, lessonId: { in: lessonIds } },
  });

  return {
    completedCount,
    totalLessons,
    isComplete: completedCount === totalLessons,
  };
}

/** All lessons in the course have progress rows for this user (same bar as dashboard "completed"). */
export async function isUserCourseFullyComplete(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const p = await getCourseLessonProgressForUser(userId, courseId);
  return p.isComplete;
}

export async function isProgramPhaseCompleteForUser(
  userId: string,
  phase: ProgramPhase & {
    assignments: ProgramPhaseAssignment[];
    phaseCourses: { courseId: string }[];
  },
  opts?: { courseCompleteById?: Record<string, boolean> },
): Promise<boolean> {
  for (const { courseId } of phase.phaseCourses) {
    const ok =
      opts?.courseCompleteById?.[courseId] ??
      (await isUserCourseFullyComplete(userId, courseId));
    if (!ok) return false;
  }

  const required = phase.assignments.filter((a) => a.requiredForCompletion);
  for (const a of required) {
    const sub = await prisma.programPhaseAssignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId: a.id, userId } },
    });
    if (!sub) return false;
    if (a.responseType === "TEXT") {
      if (!sub.content.trim()) return false;
    } else if (!sub.fileUrl) {
      return false;
    }
    if (!isSubmissionApproved(sub)) return false;
  }

  return true;
}

export async function isCohortFinishedForUser(
  userId: string,
  programId: string,
): Promise<boolean> {
  const phases = await prisma.programPhase.findMany({
    where: { programId },
    orderBy: { sortOrder: "asc" },
    include: { assignments: true, phaseCourses: true },
  });
  if (phases.length === 0) return true;
  for (const p of phases) {
    if (!(await isProgramPhaseCompleteForUser(userId, p))) return false;
  }
  return true;
}
