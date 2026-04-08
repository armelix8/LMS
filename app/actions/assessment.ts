"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  removeAssignmentFileFromDisk,
  saveAssignmentFile,
  validateAssignmentFile,
} from "@/lib/assignment-files";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  return session.user;
}

async function requireInstructor() {
  const user = await requireUser();
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

async function getLessonInstructorContext(lessonId: string) {
  const user = await requireInstructor();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) return null;
  if (user.role !== "ADMIN" && lesson.module.course.instructorId !== user.id) {
    return null;
  }
  return { user, lesson, course: lesson.module.course };
}

function revalidateLessonPaths(
  courseId: string,
  slug: string,
  lessonId: string,
) {
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/instructor/courses/${courseId}/lessons/${lessonId}`);
  revalidatePath(`/learn/${slug}/${lessonId}`);
}

export async function createQuiz(lessonId: string): Promise<void> {
  const ctx = await getLessonInstructorContext(lessonId);
  if (!ctx) return;

  const existing = await prisma.quiz.findUnique({ where: { lessonId } });
  if (existing) return;

  await prisma.quiz.create({
    data: {
      lessonId,
      title: "Lesson quiz",
      passPercent: 70,
      questions: {
        create: [
          {
            prompt: "Sample question — edit the text and options below.",
            sortOrder: 0,
            options: {
              create: [
                { text: "Correct answer", isCorrect: true, sortOrder: 0 },
                { text: "Incorrect answer", isCorrect: false, sortOrder: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  revalidateLessonPaths(ctx.course.id, ctx.course.slug, lessonId);
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { lesson: { include: { module: { include: { course: true } } } } },
  });
  if (!quiz) return;

  const ctx = await getLessonInstructorContext(quiz.lessonId);
  if (!ctx) return;

  await prisma.quiz.delete({ where: { id: quizId } });
  revalidateLessonPaths(ctx.course.id, ctx.course.slug, quiz.lessonId);
}

export async function updateQuizMeta(
  quizId: string,
  formData: FormData,
): Promise<void> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { lesson: { include: { module: { include: { course: true } } } } },
  });
  if (!quiz) return;

  const ctx = await getLessonInstructorContext(quiz.lessonId);
  if (!ctx) return;

  const title = String(formData.get("title") ?? "").trim();
  const passRaw = Number(formData.get("passPercent"));
  const passPercent = Number.isFinite(passRaw)
    ? Math.min(100, Math.max(0, Math.round(passRaw)))
    : 70;

  if (!title) return;

  const requiredForCompletion = formData.get("requiredForCompletion") === "on";

  await prisma.quiz.update({
    where: { id: quizId },
    data: { title, passPercent, requiredForCompletion },
  });

  revalidateLessonPaths(ctx.course.id, ctx.course.slug, quiz.lessonId);
}

export async function addQuizQuestion(quizId: string): Promise<void> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { lesson: { include: { module: { include: { course: true } } } } },
  });
  if (!quiz) return;

  const ctx = await getLessonInstructorContext(quiz.lessonId);
  if (!ctx) return;

  const maxOrder = await prisma.quizQuestion.aggregate({
    where: { quizId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  await prisma.quizQuestion.create({
    data: {
      quizId,
      prompt: "New question",
      sortOrder,
      options: {
        create: [
          { text: "Option A (correct)", isCorrect: true, sortOrder: 0 },
          { text: "Option B", isCorrect: false, sortOrder: 1 },
        ],
      },
    },
  });

  revalidateLessonPaths(ctx.course.id, ctx.course.slug, quiz.lessonId);
}

export async function deleteQuizQuestion(questionId: string): Promise<void> {
  const q = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
    include: { quiz: { include: { lesson: { include: { module: { include: { course: true } } } } } } },
  });
  if (!q) return;

  const ctx = await getLessonInstructorContext(q.quiz.lessonId);
  if (!ctx) return;

  await prisma.quizQuestion.delete({ where: { id: questionId } });
  revalidateLessonPaths(ctx.course.id, ctx.course.slug, q.quiz.lessonId);
}

export async function saveQuizQuestion(
  questionId: string,
  formData: FormData,
): Promise<void> {
  const q = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
    include: {
      quiz: { include: { lesson: { include: { module: { include: { course: true } } } } } },
    },
  });
  if (!q) return;

  const ctx = await getLessonInstructorContext(q.quiz.lessonId);
  if (!ctx) return;

  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!prompt) return;

  const slots = formData.getAll("optionText").map((v) => String(v).trim());
  const correctSlot = Math.min(
    Math.max(0, Math.round(Number(formData.get("correctIndex")))),
    Math.max(0, slots.length - 1),
  );

  const nonEmpty = slots
    .map((text, i) => ({ text, i }))
    .filter((x) => x.text.length > 0);

  if (nonEmpty.length < 2) return;
  if (!slots[correctSlot]?.trim()) return;

  await prisma.$transaction(async (tx) => {
    await tx.quizQuestion.update({
      where: { id: questionId },
      data: { prompt },
    });
    await tx.quizOption.deleteMany({ where: { questionId } });
    await tx.quizOption.createMany({
      data: nonEmpty.map(({ text, i }, order) => ({
        questionId,
        text,
        isCorrect: i === correctSlot,
        sortOrder: order,
      })),
    });
  });

  revalidateLessonPaths(ctx.course.id, ctx.course.slug, q.quiz.lessonId);
}

export async function submitQuizAttempt(
  quizId: string,
  formData: FormData,
): Promise<{ ok: true; score: number; passed: boolean } | { error: string }> {
  const user = await requireUser();
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      lesson: { include: { module: { include: { course: true } } } },
      questions: { include: { options: true } },
    },
  });

  if (!quiz) return { error: "Quiz not found." };

  const enrolled = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: quiz.lesson.module.courseId,
      },
    },
  });
  if (!enrolled || enrolled.status !== "ACTIVE") {
    return { error: "You must be enrolled in this course." };
  }

  if (quiz.questions.length === 0) {
    return { error: "This quiz has no questions yet." };
  }

  let correct = 0;
  for (const question of quiz.questions) {
    const selected = formData.get(`q_${question.id}`);
    if (typeof selected !== "string") continue;
    const opt = question.options.find((o) => o.id === selected);
    if (opt?.isCorrect) correct += 1;
  }

  const total = quiz.questions.length;
  const score = Math.round((correct / total) * 100);
  const passed = score >= quiz.passPercent;

  const slug = quiz.lesson.module.course.slug;
  const lessonId = quiz.lessonId;

  await prisma.$transaction(async (tx) => {
    const attempt = await tx.quizAttempt.create({
      data: {
        quizId,
        userId: user.id,
        score,
        passed,
      },
    });

    for (const question of quiz.questions) {
      const selected = formData.get(`q_${question.id}`);
      if (typeof selected !== "string") continue;
      const option = question.options.find((o) => o.id === selected);
      if (!option) continue;
      await tx.quizAttemptAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: question.id,
          optionId: option.id,
        },
      });
    }
  });

  revalidatePath(`/learn/${slug}/${lessonId}`);

  return { ok: true, score, passed };
}

export async function createAssignment(lessonId: string): Promise<void> {
  const ctx = await getLessonInstructorContext(lessonId);
  if (!ctx) return;

  const maxOrder = await prisma.assignment.aggregate({
    where: { lessonId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  await prisma.assignment.create({
    data: {
      lessonId,
      sortOrder,
      title: "New assignment",
      description: "Edit the title and instructions below.",
      maxPoints: 100,
      requiredForCompletion: false,
      responseType: "TEXT",
    },
  });

  revalidateLessonPaths(ctx.course.id, ctx.course.slug, lessonId);
}

export async function updateAssignment(
  assignmentId: string,
  formData: FormData,
): Promise<void> {
  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { lesson: { include: { module: { include: { course: true } } } } },
  });
  if (!a) return;

  const ctx = await getLessonInstructorContext(a.lessonId);
  if (!ctx) return;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const maxRaw = Number(formData.get("maxPoints"));
  const maxPoints = Number.isFinite(maxRaw)
    ? Math.min(1000, Math.max(1, Math.round(maxRaw)))
    : 100;
  const dueRaw = String(formData.get("dueAt") ?? "").trim();
  const dueAt = dueRaw ? new Date(dueRaw) : null;

  if (!title || !description) return;
  if (dueAt && Number.isNaN(dueAt.getTime())) return;

  const requiredForCompletion = formData.get("requiredForCompletion") === "on";
  const responseType =
    formData.get("responseType") === "FILE" ? "FILE" : "TEXT";

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      title,
      description,
      maxPoints,
      dueAt,
      requiredForCompletion,
      responseType,
    },
  });

  revalidateLessonPaths(ctx.course.id, ctx.course.slug, a.lessonId);
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      lesson: { include: { module: { include: { course: true } } } },
      submissions: { select: { fileUrl: true } },
    },
  });
  if (!a) return;

  const ctx = await getLessonInstructorContext(a.lessonId);
  if (!ctx) return;

  for (const s of a.submissions) {
    if (s.fileUrl) await removeAssignmentFileFromDisk(s.fileUrl);
  }

  await prisma.assignment.delete({ where: { id: assignmentId } });
  revalidateLessonPaths(ctx.course.id, ctx.course.slug, a.lessonId);
}

export async function submitAssignmentWork(
  assignmentId: string,
  formData: FormData,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireUser();
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      lesson: { include: { module: { include: { course: true } } } },
    },
  });

  if (!assignment) return { error: "Assignment not found." };

  const enrolled = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: assignment.lesson.module.courseId,
      },
    },
  });
  if (!enrolled || enrolled.status !== "ACTIVE") {
    return { error: "You must be enrolled in this course." };
  }

  const slug = assignment.lesson.module.course.slug;
  const lessonId = assignment.lessonId;
  const content = String(formData.get("content") ?? "").trim();
  const fileEntry = formData.get("file");

  const existing = await prisma.assignmentSubmission.findUnique({
    where: {
      assignmentId_userId: { assignmentId, userId: user.id },
    },
  });

  if (existing?.reviewStatus === "APPROVED") {
    return {
      error:
        "This submission was approved and can no longer be changed.",
    };
  }

  if (assignment.responseType === "TEXT") {
    if (!content) return { error: "Please enter your response." };
  } else {
    const hasNewFile =
      fileEntry instanceof File && fileEntry.size > 0;
    if (!hasNewFile && !existing?.fileUrl) {
      return { error: "Please upload a file." };
    }
    if (hasNewFile && fileEntry instanceof File) {
      const v = validateAssignmentFile(fileEntry);
      if ("error" in v) return { error: v.error };
    }
  }

  const submission = await prisma.assignmentSubmission.upsert({
    where: {
      assignmentId_userId: { assignmentId, userId: user.id },
    },
    create: {
      assignmentId,
      userId: user.id,
      content,
      reviewStatus: "PENDING",
    },
    update: {
      content,
      submittedAt: new Date(),
      grade: null,
      feedback: null,
      gradedAt: null,
      reviewStatus: "PENDING",
    },
  });

  if (
    assignment.responseType === "FILE" &&
    fileEntry instanceof File &&
    fileEntry.size > 0
  ) {
    const existingSub = await prisma.assignmentSubmission.findUnique({
      where: { id: submission.id },
      select: { fileUrl: true },
    });
    if (existingSub?.fileUrl) {
      await removeAssignmentFileFromDisk(existingSub.fileUrl);
    }
    try {
      const saved = await saveAssignmentFile(fileEntry, submission.id);
      await prisma.assignmentSubmission.update({
        where: { id: submission.id },
        data: { fileUrl: saved.url, fileName: saved.fileName },
      });
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Could not save file.",
      };
    }
  }

  const course = assignment.lesson.module.course;
  const submitter = user.name?.trim() || user.email;
  await createNotification({
    userId: course.instructorId,
    type: NotificationType.ASSIGNMENT_SUBMITTED,
    title: `New submission — ${assignment.title}`,
    body: `${submitter} submitted work in “${course.title}”.`,
    linkUrl: `/instructor/courses/${course.id}/lessons/${lessonId}`,
  });

  revalidatePath(`/learn/${slug}/${lessonId}`);
  return { ok: true };
}

export async function reviewAssignmentSubmission(
  submissionId: string,
  formData: FormData,
): Promise<void> {
  const user = await requireInstructor();

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: { lesson: { include: { module: { include: { course: true } } } } },
      },
    },
  });

  if (!submission) return;

  const course = submission.assignment.lesson.module.course;
  if (user.role !== "ADMIN" && course.instructorId !== user.id) {
    return;
  }

  const decision = String(formData.get("decision") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();
  const maxPoints = submission.assignment.maxPoints;
  const slug = course.slug;
  const lessonId = submission.assignment.lessonId;

  if (decision === "approve") {
    const gradeRaw = formData.get("grade");
    const gradeStr = String(gradeRaw ?? "").trim();
    const gradeParsed = Number(gradeStr);
    const grade =
      gradeStr === "" || !Number.isFinite(gradeParsed)
        ? maxPoints
        : Math.min(maxPoints, Math.max(0, Math.round(gradeParsed)));
    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        reviewStatus: "APPROVED",
        grade,
        feedback: feedback || null,
        gradedAt: new Date(),
      },
    });
    await createNotification({
      userId: submission.userId,
      type: NotificationType.ASSIGNMENT_REVIEWED,
      title: `Graded: ${submission.assignment.title}`,
      body:
        feedback ||
        `Your submission was approved (${grade}/${maxPoints} points).`,
      linkUrl: `/learn/${slug}/${lessonId}`,
    });
  } else if (decision === "reject") {
    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        reviewStatus: "REJECTED",
        grade: null,
        feedback: feedback || null,
        gradedAt: null,
      },
    });
    await createNotification({
      userId: submission.userId,
      type: NotificationType.ASSIGNMENT_REVIEWED,
      title: `Revision needed: ${submission.assignment.title}`,
      body:
        feedback ||
        "Your submission was reviewed. Update your work and resubmit if needed.",
      linkUrl: `/learn/${slug}/${lessonId}`,
    });
  } else {
    return;
  }

  revalidatePath(`/instructor/courses/${course.id}/lessons/${lessonId}`);
  revalidatePath(`/instructor/courses/${course.id}/students`);
  revalidatePath(`/learn/${slug}/${lessonId}`);
}
