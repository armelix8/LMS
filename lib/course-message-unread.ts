import { prisma } from "@/lib/prisma";

/** Messages from instructor (or anyone other than the student) not yet “seen”. */
export async function countUnreadMessagesForStudent(
  enrollmentId: string,
  studentUserId: string,
  studentMessagesReadAt: Date | null,
): Promise<number> {
  return prisma.courseMessage.count({
    where: {
      enrollmentId,
      senderId: { not: studentUserId },
      ...(studentMessagesReadAt
        ? { createdAt: { gt: studentMessagesReadAt } }
        : {}),
    },
  });
}

/** Messages from the student not yet seen by the instructor in Students. */
export async function countUnreadMessagesFromStudentForInstructor(
  enrollmentId: string,
  studentUserId: string,
  instructorMessagesReadAt: Date | null,
): Promise<number> {
  return prisma.courseMessage.count({
    where: {
      enrollmentId,
      senderId: studentUserId,
      ...(instructorMessagesReadAt
        ? { createdAt: { gt: instructorMessagesReadAt } }
        : {}),
    },
  });
}
