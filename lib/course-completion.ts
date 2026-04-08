import { prisma } from "@/lib/prisma";

/** True when the learner has marked every lesson in the course complete. */
export async function isCourseFullyCompletedByUser(
  lessonIds: string[],
  userId: string,
): Promise<boolean> {
  if (lessonIds.length === 0) return false;
  const done = await prisma.lessonProgress.count({
    where: { userId, lessonId: { in: lessonIds } },
  });
  return done === lessonIds.length;
}
