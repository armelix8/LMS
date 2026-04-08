"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export async function sendCourseMessage(
  enrollmentId: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    return { error: "Please enter a message." };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment) {
    return { error: "Enrollment not found." };
  }

  const uid = session.user.id;
  const isStudent = enrollment.userId === uid;
  if (isStudent && enrollment.status !== "ACTIVE") {
    return {
      error:
        "Your enrollment is not active yet. Wait for instructor approval.",
    };
  }
  const isAdmin = session.user.role === "ADMIN";
  const isInstructor =
    session.user.role === "INSTRUCTOR" &&
    enrollment.course.instructorId === uid;

  if (!isStudent && !isInstructor && !isAdmin) {
    return { error: "You cannot send messages in this conversation." };
  }

  await prisma.courseMessage.create({
    data: {
      enrollmentId,
      senderId: uid,
      body,
    },
  });

  const recipientId = isStudent
    ? enrollment.course.instructorId
    : enrollment.userId;
  if (recipientId !== uid) {
    const preview =
      body.length > 180 ? `${body.slice(0, 177)}…` : body;
    await createNotification({
      userId: recipientId,
      type: NotificationType.COURSE_MESSAGE,
      title: `New message — ${enrollment.course.title}`,
      body: preview,
      linkUrl: isStudent
        ? `/instructor/courses/${enrollment.courseId}/students`
        : `/learn/${enrollment.course.slug}/messages`,
    });
  }

  const slug = enrollment.course.slug;
  const courseId = enrollment.courseId;

  revalidatePath(`/learn/${slug}/messages`);
  revalidatePath(`/learn/${slug}`, "layout");
  revalidatePath(`/instructor/courses/${courseId}/students`);
  revalidatePath(`/instructor/courses/${courseId}/students`, "layout");

  return { ok: true };
}

/** Learner opened the messages modal or full page — clears unread badge for instructor messages. */
export async function markStudentMessagesOpened(
  enrollmentId: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { userId: true, courseId: true, status: true },
  });
  if (
    !enrollment ||
    enrollment.userId !== session.user.id ||
    enrollment.status !== "ACTIVE"
  ) {
    return;
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { studentMessagesReadAt: new Date() },
  });

  const course = await prisma.course.findUnique({
    where: { id: enrollment.courseId },
    select: { slug: true },
  });
  if (!course) return;

  revalidatePath(`/learn/${course.slug}`, "layout");
  revalidatePath(`/learn/${course.slug}/messages`);
}
