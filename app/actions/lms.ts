"use server";

import { rm } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { getLessonCompletionBlockers } from "@/lib/lesson-completion";
import {
  deletePublicUploadFile,
  getFormImageFile,
  saveCourseCoverUpload,
  validateCourseCoverImage,
} from "@/lib/image-upload";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  canonicalizeBlockNoteForStorage,
  extractFirstVideoUrlFromBlocks,
  isBlockNoteContent,
  parseBlockNoteDocument,
} from "@/lib/lesson-blocknote";
import { uniqueCourseSlug } from "@/lib/slug";
import { NotificationType } from "@prisma/client";

function parseOptionalThumbnailUrl(
  raw: string,
): { ok: true; value: string | null } | { ok: false } {
  const t = raw.trim();
  if (!t) return { ok: true, value: null };
  const parsed = z.string().url().safeParse(t);
  if (!parsed.success) return { ok: false };
  return { ok: true, value: parsed.data };
}

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

export async function enrollInCourse(courseId: string): Promise<void> {
  const user = await requireUser();
  const course = await prisma.course.findFirst({
    where: { id: courseId, published: true },
  });
  if (!course) return;

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId: user.id, courseId },
    },
  });

  if (existing?.status === "ACTIVE") return;
  if (existing?.status === "PENDING") return;

  if (existing?.status === "REJECTED") {
    await prisma.enrollment.update({
      where: { id: existing.id },
      data: { status: "PENDING" },
    });
  } else {
    await prisma.enrollment.create({
      data: { userId: user.id, courseId, status: "PENDING" },
    });
  }

  const displayName = user.name?.trim() || user.email || "A learner";
  await createNotification({
    userId: course.instructorId,
    type: NotificationType.ENROLLMENT_REQUEST,
    title: "New enrollment request",
    body: `${displayName} requested access to “${course.title}”.`,
    linkUrl: `/instructor/courses/${courseId}/students`,
  });

  revalidatePath("/courses");
  revalidatePath("/dashboard");
  revalidatePath(`/courses/${course.slug}`);
  revalidatePath(`/learn/${course.slug}`);
  revalidatePath(`/instructor/courses/${courseId}`);
}

export async function approveEnrollment(enrollmentId: string): Promise<void> {
  const user = await requireInstructor();
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment || enrollment.status !== "PENDING") return;
  if (user.role !== "ADMIN" && enrollment.course.instructorId !== user.id) {
    return;
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "ACTIVE" },
  });

  const slug = enrollment.course.slug;
  const courseId = enrollment.courseId;
  await createNotification({
    userId: enrollment.userId,
    type: NotificationType.ENROLLMENT_APPROVED,
    title: `You’re enrolled in ${enrollment.course.title}`,
    body: "Your instructor approved your enrollment. You can open lessons from your dashboard or the course page.",
    linkUrl: `/learn/${slug}`,
  });
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/instructor/courses/${courseId}/students`);
  revalidatePath(`/courses/${slug}`);
  revalidatePath(`/dashboard`);
  revalidatePath(`/learn/${slug}`);
}

export async function rejectEnrollment(enrollmentId: string): Promise<void> {
  const user = await requireInstructor();
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment || enrollment.status !== "PENDING") return;
  if (user.role !== "ADMIN" && enrollment.course.instructorId !== user.id) {
    return;
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "REJECTED" },
  });

  const slug = enrollment.course.slug;
  const courseId = enrollment.courseId;
  await createNotification({
    userId: enrollment.userId,
    type: NotificationType.ENROLLMENT_REJECTED,
    title: `Enrollment update: ${enrollment.course.title}`,
    body: "Your enrollment request was not approved. You can visit the course page if you’d like to try again.",
    linkUrl: `/courses/${slug}`,
  });
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/instructor/courses/${courseId}/students`);
  revalidatePath(`/courses/${slug}`);
  revalidatePath(`/dashboard`);
  revalidatePath(`/learn/${slug}`);
}

export async function setLessonCompleted(lessonId: string, completed: boolean) {
  const user = await requireUser();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) return { error: "Lesson not found." };

  const enrolled = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: lesson.module.courseId,
      },
    },
  });
  if (!enrolled || enrolled.status !== "ACTIVE") {
    return { error: "You are not enrolled in this course." };
  }

  if (completed) {
    const blockers = await getLessonCompletionBlockers(lessonId, user.id);
    if (blockers.length > 0) {
      return { error: blockers.join(" ") };
    }

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: user.id, lessonId },
      },
      create: { userId: user.id, lessonId },
      update: {},
    });
  } else {
    await prisma.lessonProgress.deleteMany({
      where: { userId: user.id, lessonId },
    });
  }

  const slug = lesson.module.course.slug;
  revalidatePath(`/learn/${slug}`);
  revalidatePath(`/learn/${slug}/${lessonId}`);
  return { ok: true as const };
}

export async function createCourse(formData: FormData): Promise<void> {
  const user = await requireInstructor();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const thumbFile = getFormImageFile(formData, "thumbnailFile");
  const thumbParsed = parseOptionalThumbnailUrl(
    String(formData.get("thumbnail") ?? ""),
  );

  if (!title || !description) {
    redirect("/instructor/courses/new?error=required");
  }
  if (thumbFile) {
    const v = validateCourseCoverImage(thumbFile);
    if (!v.ok) {
      redirect(
        `/instructor/courses/new?error=invalid-course-image&reason=${v.reason}`,
      );
    }
  } else if (!thumbParsed.ok) {
    redirect("/instructor/courses/new?error=invalid-thumbnail");
  }

  const slug = await uniqueCourseSlug(title);
  const initialThumb = thumbFile
    ? null
    : thumbParsed.ok
      ? thumbParsed.value
      : null;
  const course = await prisma.course.create({
    data: {
      title,
      slug,
      description,
      thumbnail: initialThumb,
      instructorId: user.id,
      published: false,
    },
  });

  if (thumbFile) {
    const { url } = await saveCourseCoverUpload(course.id, thumbFile);
    await prisma.course.update({
      where: { id: course.id },
      data: { thumbnail: url },
    });
  }

  revalidatePath("/instructor/courses");
  redirect(`/instructor/courses/${course.id}`);
}

export async function updateCourse(
  courseId: string,
  formData: FormData,
): Promise<void> {
  const user = await requireInstructor();
  const c = await prisma.course.findUnique({ where: { id: courseId } });
  if (!c) return;
  if (user.role !== "ADMIN" && c.instructorId !== user.id) {
    return;
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const published = formData.get("published") === "on";
  const thumbFile = getFormImageFile(formData, "thumbnailFile");
  const thumbFieldRaw = String(formData.get("thumbnail") ?? "");
  const thumbParsed = parseOptionalThumbnailUrl(thumbFieldRaw);
  const removeThumbnail = formData.get("removeThumbnail") === "on";

  if (!title || !description) return;

  let nextThumbnail = c.thumbnail;
  if (thumbFile) {
    const v = validateCourseCoverImage(thumbFile);
    if (!v.ok) {
      redirect(
        `/instructor/courses/${courseId}?error=invalid-course-image&reason=${v.reason}`,
      );
    }
    await deletePublicUploadFile(c.thumbnail);
    const { url } = await saveCourseCoverUpload(courseId, thumbFile);
    nextThumbnail = url;
  } else if (removeThumbnail) {
    await deletePublicUploadFile(c.thumbnail);
    nextThumbnail = null;
  } else if (thumbFieldRaw.trim()) {
    if (!thumbParsed.ok) {
      redirect(`/instructor/courses/${courseId}?error=invalid-thumbnail`);
    }
    if (
      c.thumbnail &&
      c.thumbnail !== thumbParsed.value &&
      c.thumbnail.startsWith("/uploads/courses/")
    ) {
      await deletePublicUploadFile(c.thumbnail);
    }
    nextThumbnail = thumbParsed.value;
  }

  const slug =
    title !== c.title ? await uniqueCourseSlug(title, c.id) : c.slug;

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title,
      slug,
      description,
      published,
      thumbnail: nextThumbnail,
    },
  });

  revalidatePath("/instructor/courses");
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath(`/courses/${slug}`);
  revalidatePath(`/learn/${slug}`);
}

export async function createModule(
  courseId: string,
  title: string,
): Promise<void> {
  const user = await requireInstructor();
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return;
  if (user.role !== "ADMIN" && course.instructorId !== user.id) {
    return;
  }

  const maxOrder = await prisma.module.aggregate({
    where: { courseId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  await prisma.module.create({
    data: { courseId, title: title.trim() || "Untitled module", sortOrder },
  });

  revalidatePath(`/instructor/courses/${courseId}`);
}

export async function createLesson(
  moduleId: string,
  title: string,
): Promise<void> {
  const user = await requireInstructor();
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: true },
  });
  if (!mod) return;
  if (user.role !== "ADMIN" && mod.course.instructorId !== user.id) {
    return;
  }

  const maxOrder = await prisma.lesson.aggregate({
    where: { moduleId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  await prisma.lesson.create({
    data: {
      moduleId,
      title: title.trim() || "Untitled lesson",
      content: "Add your lesson content here. You can use **Markdown**.",
      sortOrder,
    },
  });

  revalidatePath(`/instructor/courses/${mod.courseId}`);
}

export async function updateLesson(
  lessonId: string,
  data: { title?: string; content?: string; videoUrl?: string | null },
): Promise<void> {
  const user = await requireInstructor();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) return;
  if (user.role !== "ADMIN" && lesson.module.course.instructorId !== user.id) {
    return;
  }

  const contentToPersist = data.content;
  const canonicalBlockNote =
    contentToPersist != null
      ? canonicalizeBlockNoteForStorage(contentToPersist)
      : null;
  const contentForDb =
    canonicalBlockNote != null ? canonicalBlockNote : contentToPersist;

  const blockDerivedVideo =
    contentToPersist != null && isBlockNoteContent(contentToPersist)
      ? extractFirstVideoUrlFromBlocks(
          parseBlockNoteDocument(contentToPersist) ?? [],
        )
      : undefined;

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(data.title != null ? { title: data.title } : {}),
      ...(contentForDb != null ? { content: contentForDb } : {}),
      ...(blockDerivedVideo !== undefined
        ? { videoUrl: blockDerivedVideo }
        : data.videoUrl !== undefined
          ? { videoUrl: data.videoUrl || null }
          : {}),
    },
  });

  const slug = lesson.module.course.slug;
  revalidatePath(`/instructor/courses/${lesson.module.courseId}`);
  revalidatePath(`/learn/${slug}/${lessonId}`);
}

export async function deleteCourse(courseId: string): Promise<void> {
  const user = await requireInstructor();
  const c = await prisma.course.findUnique({ where: { id: courseId } });
  if (!c) return;
  if (user.role !== "ADMIN" && c.instructorId !== user.id) {
    return;
  }

  const slug = c.slug;
  const courseUploadDir = join(
    process.cwd(),
    "public",
    "uploads",
    "courses",
    courseId,
  );
  await rm(courseUploadDir, { recursive: true, force: true }).catch(() => {});
  await prisma.course.delete({ where: { id: courseId } });

  revalidatePath("/instructor/courses");
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/instructor/courses/${courseId}/students`);
  revalidatePath("/courses");
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/dashboard");
  revalidatePath(`/learn/${slug}`);

  redirect("/instructor/courses");
}
