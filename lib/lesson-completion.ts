import { prisma } from "@/lib/prisma";
import { isSubmissionApproved } from "@/lib/assignment-review";

/** Reasons the learner cannot mark the lesson complete (empty = allowed). */
export async function getLessonCompletionBlockers(
  lessonId: string,
  userId: string,
): Promise<string[]> {
  const messages: string[] = [];

  const quiz = await prisma.quiz.findUnique({
    where: { lessonId },
    include: { _count: { select: { questions: true } } },
  });

  if (quiz?.requiredForCompletion) {
    if (quiz._count.questions === 0) {
      messages.push("The required quiz has no questions yet.");
    } else {
      const passed = await prisma.quizAttempt.findFirst({
        where: { quizId: quiz.id, userId, passed: true },
      });
      if (!passed) {
        messages.push(
          `Pass the quiz (at least ${quiz.passPercent}% required).`,
        );
      }
    }
  }

  const requiredAssignments = await prisma.assignment.findMany({
    where: { lessonId, requiredForCompletion: true },
    orderBy: { sortOrder: "asc" },
  });

  for (const assignment of requiredAssignments) {
    const sub = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_userId: {
          assignmentId: assignment.id,
          userId,
        },
      },
    });
    const label = `"${assignment.title}"`;
    if (!sub) {
      messages.push(`Submit the required assignment ${label}.`);
      continue;
    }
    let hasBody = false;
    if (assignment.responseType === "TEXT") {
      if (!sub.content.trim()) {
        messages.push(`Submit the required assignment ${label} (text).`);
      } else {
        hasBody = true;
      }
    } else if (!sub.fileUrl) {
      messages.push(`Upload the required file for assignment ${label}.`);
    } else {
      hasBody = true;
    }
    if (hasBody && !isSubmissionApproved(sub)) {
      messages.push(
        `${label} must be approved by the instructor before you can complete this lesson.`,
      );
    }
  }

  return messages;
}
