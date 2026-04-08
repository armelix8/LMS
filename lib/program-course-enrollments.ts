import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getDistinctCourseIdsForProgram(
  programId: string,
): Promise<string[]> {
  const links = await prisma.programPhaseCourse.findMany({
    where: { phase: { programId } },
    select: { courseId: true },
  });
  return [...new Set(links.map((l) => l.courseId))];
}

async function revalidatePathsForCourseIds(courseIds: string[]): Promise<void> {
  if (courseIds.length === 0) return;
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { slug: true },
  });
  for (const c of courses) {
    revalidatePath(`/learn/${c.slug}`);
    revalidatePath(`/learn/${c.slug}/messages`);
    revalidatePath(`/courses/${c.slug}`);
  }
  revalidatePath("/dashboard");
}

/** Ensures ACTIVE LMS enrollment for every course linked on any phase of the program. */
export async function syncProgramCourseEnrollmentsForUser(
  userId: string,
  programId: string,
): Promise<void> {
  const courseIds = await getDistinctCourseIdsForProgram(programId);
  for (const courseId of courseIds) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, status: "ACTIVE" },
      update: { status: "ACTIVE" },
    });
  }
  await revalidatePathsForCourseIds(courseIds);
}

export async function syncProgramCourseEnrollmentsForAllActiveMembers(
  programId: string,
): Promise<void> {
  const courseIds = await getDistinctCourseIdsForProgram(programId);
  if (courseIds.length === 0) return;
  const members = await prisma.cohortMember.findMany({
    where: { status: "ACTIVE", cohort: { programId } },
    distinct: ["userId"],
    select: { userId: true },
  });
  for (const { userId } of members) {
    for (const courseId of courseIds) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId, status: "ACTIVE" },
        update: { status: "ACTIVE" },
      });
    }
  }
  await revalidatePathsForCourseIds(courseIds);
}
