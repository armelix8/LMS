"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  removeAssignmentFileFromDisk,
  saveAssignmentFile,
  validateAssignmentFile,
} from "@/lib/assignment-files";
import { NotificationType, Role } from "@prisma/client";
import {
  createNotification,
  createNotificationsForUsers,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { cohortApplicationsWindowOpen } from "@/lib/cohort-applications";
import {
  syncProgramCourseEnrollmentsForAllActiveMembers,
  syncProgramCourseEnrollmentsForUser,
} from "@/lib/program-course-enrollments";
import { uniqueCohortSlug, uniqueProgramSlug } from "@/lib/slug";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  return session.user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

function phaseCourseIdsFromFormData(formData: FormData): string[] {
  const raw = formData.getAll("courseIds");
  const ids: string[] = [];
  for (const v of raw) {
    const s = String(v).trim();
    if (s) ids.push(s);
  }
  return [...new Set(ids)];
}

export async function createProgram(formData: FormData): Promise<void> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const published = formData.get("published") === "on";
  if (!title || !description) {
    redirect("/admin/programs/new?error=required");
  }
  const slug = await uniqueProgramSlug(title);
  const program = await prisma.program.create({
    data: { title, slug, description, published },
  });
  revalidatePath("/admin/programs");
  redirect(`/admin/programs/${program.id}`);
}

export async function updateProgram(programId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const published = formData.get("published") === "on";
  if (!title || !description) return;

  const existing = await prisma.program.findUnique({ where: { id: programId } });
  if (!existing) return;

  const slug =
    slugifyTitle(title) === slugifyTitle(existing.title)
      ? existing.slug
      : await uniqueProgramSlug(title, programId);

  await prisma.program.update({
    where: { id: programId },
    data: { title, description, published, slug },
  });
  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${slug}`);
}

function slugifyTitle(t: string): string {
  return t
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function deleteProgram(programId: string): Promise<void> {
  await requireAdmin();
  const p = await prisma.program.findUnique({ where: { id: programId } });
  if (!p) return;
  await prisma.program.delete({ where: { id: programId } });
  revalidatePath("/admin/programs");
  revalidatePath(`/programs/${p.slug}`);
  redirect("/admin/programs");
}

export async function createProgramCohort(
  programId: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) return;

  const applicationsOpen = formData.get("applicationsOpen") === "on";
  const opensRaw = String(formData.get("applicationOpensAt") ?? "").trim();
  const closesRaw = String(formData.get("applicationClosesAt") ?? "").trim();
  const applicationOpensAt = opensRaw ? new Date(opensRaw) : null;
  const applicationClosesAt = closesRaw ? new Date(closesRaw) : null;

  const slug = await uniqueCohortSlug(programId, name);
  await prisma.programCohort.create({
    data: {
      programId,
      name,
      slug,
      applicationsOpen,
      applicationOpensAt:
        applicationOpensAt && !Number.isNaN(applicationOpensAt.getTime())
          ? applicationOpensAt
          : null,
      applicationClosesAt:
        applicationClosesAt && !Number.isNaN(applicationClosesAt.getTime())
          ? applicationClosesAt
          : null,
    },
  });
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${program.slug}`);
}

export async function updateProgramCohort(
  cohortId: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const cohort = await prisma.programCohort.findUnique({
    where: { id: cohortId },
    include: { program: true },
  });
  if (!cohort) return;

  const applicationsOpen = formData.get("applicationsOpen") === "on";
  const opensRaw = String(formData.get("applicationOpensAt") ?? "").trim();
  const closesRaw = String(formData.get("applicationClosesAt") ?? "").trim();
  const applicationOpensAt = opensRaw ? new Date(opensRaw) : null;
  const applicationClosesAt = closesRaw ? new Date(closesRaw) : null;

  const slug =
    slugifyTitle(name) === slugifyTitle(cohort.name)
      ? cohort.slug
      : await uniqueCohortSlug(cohort.programId, name, cohortId);

  await prisma.programCohort.update({
    where: { id: cohortId },
    data: {
      name,
      slug,
      applicationsOpen,
      applicationOpensAt:
        applicationOpensAt && !Number.isNaN(applicationOpensAt.getTime())
          ? applicationOpensAt
          : null,
      applicationClosesAt:
        applicationClosesAt && !Number.isNaN(applicationClosesAt.getTime())
          ? applicationClosesAt
          : null,
    },
  });
  revalidatePath(`/admin/programs/${cohort.programId}`);
  revalidatePath(`/admin/programs/${cohort.programId}/cohorts/${cohortId}`);
  revalidatePath(`/programs/${cohort.program.slug}`);
  revalidatePath(
    `/programs/${cohort.program.slug}/cohorts/${slug}`,
  );
}

export async function deleteProgramCohort(cohortId: string): Promise<void> {
  await requireAdmin();
  const cohort = await prisma.programCohort.findUnique({
    where: { id: cohortId },
    include: { program: true },
  });
  if (!cohort) return;
  const programId = cohort.programId;
  await prisma.programCohort.delete({ where: { id: cohortId } });
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${cohort.program.slug}`);
  redirect(`/admin/programs/${programId}`);
}

export async function createProgramPhase(
  programId: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const description = String(formData.get("description") ?? "").trim() || null;
  const courseIds = phaseCourseIdsFromFormData(formData);

  const maxOrder = await prisma.programPhase.aggregate({
    where: { programId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  for (const courseId of courseIds) {
    const c = await prisma.course.findUnique({ where: { id: courseId } });
    if (!c) return;
  }

  await prisma.programPhase.create({
    data: {
      programId,
      title,
      description,
      sortOrder,
      phaseCourses: {
        create: courseIds.map((courseId, i) => ({
          courseId,
          sortOrder: i,
        })),
      },
    },
  });
  await syncProgramCourseEnrollmentsForAllActiveMembers(programId);
  revalidatePath(`/admin/programs/${programId}`);
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (program) revalidatePath(`/programs/${program.slug}`);
}

export async function updateProgramPhase(
  phaseId: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const description = String(formData.get("description") ?? "").trim() || null;
  const courseIds = phaseCourseIdsFromFormData(formData);

  const phase = await prisma.programPhase.findUnique({
    where: { id: phaseId },
    include: { program: true },
  });
  if (!phase) return;

  for (const courseId of courseIds) {
    const c = await prisma.course.findUnique({ where: { id: courseId } });
    if (!c) return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.programPhaseCourse.deleteMany({ where: { phaseId } });
    await tx.programPhase.update({
      where: { id: phaseId },
      data: { title, description },
    });
    if (courseIds.length > 0) {
      await tx.programPhaseCourse.createMany({
        data: courseIds.map((courseId, sortOrder) => ({
          phaseId,
          courseId,
          sortOrder,
        })),
      });
    }
  });
  await syncProgramCourseEnrollmentsForAllActiveMembers(phase.programId);
  revalidatePath(`/admin/programs/${phase.programId}`);
  revalidatePath(`/admin/programs/${phase.programId}/phases/${phaseId}`);
  revalidatePath(`/programs/${phase.program.slug}`);
}

export async function deleteProgramPhase(phaseId: string): Promise<void> {
  await requireAdmin();
  const phase = await prisma.programPhase.findUnique({
    where: { id: phaseId },
    include: { program: true },
  });
  if (!phase) return;
  const programId = phase.programId;
  await prisma.programPhase.delete({ where: { id: phaseId } });
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${phase.program.slug}`);
  redirect(`/admin/programs/${programId}`);
}

export async function createProgramPhaseAssignment(
  phaseId: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) return;

  const phase = await prisma.programPhase.findUnique({
    where: { id: phaseId },
    include: { program: true },
  });
  if (!phase) return;

  const maxOrder = await prisma.programPhaseAssignment.aggregate({
    where: { phaseId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;
  const maxPoints = Math.max(
    0,
    Math.round(Number(formData.get("maxPoints")) || 100),
  );
  const requiredForCompletion = formData.get("requiredForCompletion") === "on";
  const responseType =
    formData.get("responseType") === "FILE" ? "FILE" : "TEXT";

  await prisma.programPhaseAssignment.create({
    data: {
      phaseId,
      title,
      description,
      maxPoints,
      sortOrder,
      requiredForCompletion,
      responseType,
    },
  });
  revalidatePath(`/admin/programs/${phase.programId}/phases/${phaseId}`);
  revalidatePath(`/programs/${phase.program.slug}`);
}

export async function updateProgramPhaseAssignment(
  assignmentId: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) return;

  const a = await prisma.programPhaseAssignment.findUnique({
    where: { id: assignmentId },
    include: { phase: { include: { program: true } } },
  });
  if (!a) return;

  const maxPoints = Math.max(
    0,
    Math.round(Number(formData.get("maxPoints")) || 100),
  );
  const requiredForCompletion = formData.get("requiredForCompletion") === "on";
  const responseType =
    formData.get("responseType") === "FILE" ? "FILE" : "TEXT";

  await prisma.programPhaseAssignment.update({
    where: { id: assignmentId },
    data: {
      title,
      description,
      maxPoints,
      requiredForCompletion,
      responseType,
    },
  });
  revalidatePath(
    `/admin/programs/${a.phase.programId}/phases/${a.phaseId}`,
  );
  revalidatePath(`/programs/${a.phase.program.slug}`);
}

export async function deleteProgramPhaseAssignment(
  assignmentId: string,
): Promise<void> {
  await requireAdmin();
  const a = await prisma.programPhaseAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      submissions: { select: { fileUrl: true } },
      phase: { include: { program: true } },
    },
  });
  if (!a) return;
  for (const s of a.submissions) {
    if (s.fileUrl) await removeAssignmentFileFromDisk(s.fileUrl);
  }
  await prisma.programPhaseAssignment.delete({ where: { id: assignmentId } });
  revalidatePath(`/admin/programs/${a.phase.programId}/phases/${a.phaseId}`);
  revalidatePath(`/programs/${a.phase.program.slug}`);
}

export async function applyToCohortFromProgramPage(
  programSlug: string,
  cohortSlug: string,
  cohortId: string,
): Promise<void> {
  const r = await applyToCohort(cohortId);
  if (r.error) {
    redirect(
      `/programs/${programSlug}?applyError=${encodeURIComponent(r.error)}`,
    );
  }
  redirect(`/programs/${programSlug}/cohorts/${cohortSlug}`);
}

export async function applyToCohort(cohortId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const cohort = await prisma.programCohort.findUnique({
    where: { id: cohortId },
    include: { program: true },
  });
  if (!cohort || !cohort.program.published) {
    return { error: "Cohort not found." };
  }
  if (!cohortApplicationsWindowOpen(cohort)) {
    return { error: "Applications are not open for this cohort." };
  }

  const existing = await prisma.cohortMember.findUnique({
    where: {
      cohortId_userId: { cohortId, userId: user.id },
    },
  });
  if (existing?.status === "ACTIVE") {
    return { error: "You are already in this cohort." };
  }
  if (existing?.status === "APPLIED") {
    return { error: "You already applied." };
  }
  if (existing?.status === "REJECTED" || existing?.status === "WITHDRAWN") {
    await prisma.cohortMember.update({
      where: { id: existing.id },
      data: { status: "APPLIED", appliedAt: new Date(), decidedAt: null },
    });
  } else {
    await prisma.cohortMember.create({
      data: { cohortId, userId: user.id, status: "APPLIED" },
    });
  }
  revalidatePath(`/programs/${cohort.program.slug}`);
  revalidatePath(
    `/programs/${cohort.program.slug}/cohorts/${cohort.slug}`,
  );
  revalidatePath("/dashboard");

  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    select: { id: true },
  });
  const applicantName = user.name?.trim() || user.email;
  await createNotificationsForUsers(
    admins.map((a) => a.id),
    {
      type: NotificationType.COHORT_APPLICATION,
      title: `Cohort application — ${cohort.program.title}`,
      body: `${applicantName} applied to “${cohort.name}”.`,
      linkUrl: `/admin/programs/${cohort.programId}/cohorts/${cohortId}`,
    },
  );
  return {};
}

export async function approveCohortMember(memberId: string): Promise<void> {
  await requireAdmin();
  const m = await prisma.cohortMember.findUnique({
    where: { id: memberId },
    include: { cohort: { include: { program: true } } },
  });
  if (!m || m.status !== "APPLIED") return;
  await prisma.cohortMember.update({
    where: { id: memberId },
    data: { status: "ACTIVE", decidedAt: new Date() },
  });
  await syncProgramCourseEnrollmentsForUser(m.userId, m.cohort.programId);
  await createNotification({
    userId: m.userId,
    type: NotificationType.COHORT_APPROVED,
    title: `You joined ${m.cohort.program.title}`,
    body: `You’re an active member of “${m.cohort.name}”. Continue from your cohort page.`,
    linkUrl: `/programs/${m.cohort.program.slug}/cohorts/${m.cohort.slug}`,
  });
  revalidatePath(`/admin/programs/${m.cohort.programId}`);
  revalidatePath(`/admin/programs/${m.cohort.programId}/cohorts/${m.cohortId}`);
  revalidatePath(`/programs/${m.cohort.program.slug}`);
  revalidatePath(
    `/programs/${m.cohort.program.slug}/cohorts/${m.cohort.slug}`,
  );
  revalidatePath("/dashboard");
}

export async function rejectCohortMember(memberId: string): Promise<void> {
  await requireAdmin();
  const m = await prisma.cohortMember.findUnique({
    where: { id: memberId },
    include: { cohort: { include: { program: true } } },
  });
  if (!m || m.status !== "APPLIED") return;
  await prisma.cohortMember.update({
    where: { id: memberId },
    data: { status: "REJECTED", decidedAt: new Date() },
  });
  await createNotification({
    userId: m.userId,
    type: NotificationType.COHORT_REJECTED,
    title: "Cohort application update",
    body: `Your application to “${m.cohort.name}” (${m.cohort.program.title}) was not approved.`,
    linkUrl: `/programs/${m.cohort.program.slug}`,
  });
  revalidatePath(`/admin/programs/${m.cohort.programId}`);
  revalidatePath(`/admin/programs/${m.cohort.programId}/cohorts/${m.cohortId}`);
  revalidatePath("/dashboard");
}

export async function assignUserToCohortFromForm(
  programId: string,
  cohortId: string,
  formData: FormData,
): Promise<void> {
  const r = await assignUserToCohort(cohortId, formData);
  if (r.error) {
    redirect(
      `/admin/programs/${programId}/cohorts/${cohortId}?assignError=${encodeURIComponent(r.error)}`,
    );
  }
  redirect(`/admin/programs/${programId}/cohorts/${cohortId}`);
}

export async function assignUserToCohort(
  cohortId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const cohort = await prisma.programCohort.findUnique({
    where: { id: cohortId },
    include: { program: true },
  });
  if (!cohort) return { error: "Cohort not found." };

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) return { error: "No user with that email." };

  const existing = await prisma.cohortMember.findUnique({
    where: {
      cohortId_userId: { cohortId, userId: target.id },
    },
  });
  if (existing?.status === "ACTIVE") {
    return { error: "User is already active in this cohort." };
  }
  if (existing) {
    await prisma.cohortMember.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", decidedAt: new Date() },
    });
  } else {
    await prisma.cohortMember.create({
      data: {
        cohortId,
        userId: target.id,
        status: "ACTIVE",
        decidedAt: new Date(),
      },
    });
  }
  await syncProgramCourseEnrollmentsForUser(target.id, cohort.programId);
  await createNotification({
    userId: target.id,
    type: NotificationType.COHORT_ASSIGNED,
    title: `You’ve been added to ${cohort.name}`,
    body: `You’re now an active member of ${cohort.program.title}.`,
    linkUrl: `/programs/${cohort.program.slug}/cohorts/${cohort.slug}`,
  });
  revalidatePath(`/admin/programs/${cohort.programId}/cohorts/${cohortId}`);
  revalidatePath(`/programs/${cohort.program.slug}`);
  revalidatePath(
    `/programs/${cohort.program.slug}/cohorts/${cohort.slug}`,
  );
  revalidatePath("/dashboard");
  return {};
}

export async function removeCohortMember(memberId: string): Promise<void> {
  await requireAdmin();
  const m = await prisma.cohortMember.findUnique({
    where: { id: memberId },
    include: { cohort: { include: { program: true } } },
  });
  if (!m) return;
  await prisma.cohortMember.update({
    where: { id: memberId },
    data: { status: "WITHDRAWN", decidedAt: new Date() },
  });
  revalidatePath(`/admin/programs/${m.cohort.programId}/cohorts/${m.cohortId}`);
  revalidatePath(`/programs/${m.cohort.program.slug}`);
  revalidatePath("/dashboard");
}

export async function submitProgramPhaseAssignmentWork(
  assignmentId: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  const user = await requireUser();
  const assignment = await prisma.programPhaseAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      phase: { include: { program: true } },
    },
  });
  if (!assignment) return { error: "Assignment not found." };

  const member = await prisma.cohortMember.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
      cohort: { programId: assignment.phase.programId },
    },
  });
  if (!member) {
    return {
      error: "You must be an active member of a cohort in this program.",
    };
  }

  const content = String(formData.get("content") ?? "").trim();
  const fileEntry = formData.get("file");

  const existing = await prisma.programPhaseAssignmentSubmission.findUnique({
    where: {
      assignmentId_userId: { assignmentId, userId: user.id },
    },
  });

  if (existing?.reviewStatus === "APPROVED") {
    return {
      error: "This submission was approved and can no longer be changed.",
    };
  }

  if (assignment.responseType === "TEXT") {
    if (!content) return { error: "Please enter your response." };
  } else {
    const hasNewFile = fileEntry instanceof File && fileEntry.size > 0;
    if (!hasNewFile && !existing?.fileUrl) {
      return { error: "Please upload a file." };
    }
    if (hasNewFile && fileEntry instanceof File) {
      const v = validateAssignmentFile(fileEntry);
      if ("error" in v) return { error: v.error };
    }
  }

  const submission = await prisma.programPhaseAssignmentSubmission.upsert({
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
    const prev = await prisma.programPhaseAssignmentSubmission.findUnique({
      where: { id: submission.id },
      select: { fileUrl: true },
    });
    if (prev?.fileUrl) await removeAssignmentFileFromDisk(prev.fileUrl);
    try {
      const saved = await saveAssignmentFile(fileEntry, submission.id);
      await prisma.programPhaseAssignmentSubmission.update({
        where: { id: submission.id },
        data: { fileUrl: saved.url, fileName: saved.fileName },
      });
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Could not save file.",
      };
    }
  }

  const prog = assignment.phase.program;
  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    select: { id: true },
  });
  const submitterLabel = user.name?.trim() || user.email;
  await createNotificationsForUsers(
    admins.map((a) => a.id),
    {
      type: NotificationType.PROGRAM_ASSIGNMENT_SUBMITTED,
      title: "Program assignment submitted",
      body: `${submitterLabel} submitted “${assignment.title}” (${prog.title}).`,
      linkUrl: `/admin/programs/${prog.id}/phases/${assignment.phaseId}`,
    },
  );
  revalidatePath(`/programs/${prog.slug}`);
  revalidatePath(`/admin/programs/${prog.id}/phases/${assignment.phaseId}`);
  return { ok: true };
}

export async function reviewProgramPhaseSubmission(
  submissionId: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const submission = await prisma.programPhaseAssignmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: { phase: { include: { program: true } } },
      },
    },
  });
  if (!submission) return;

  const decision = String(formData.get("decision") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();
  const maxPoints = submission.assignment.maxPoints;
  const program = submission.assignment.phase.program;
  const phaseId = submission.assignment.phaseId;

  if (decision === "approve") {
    const gradeRaw = formData.get("grade");
    const gradeStr = String(gradeRaw ?? "").trim();
    const gradeParsed = Number(gradeStr);
    const grade =
      gradeStr === "" || !Number.isFinite(gradeParsed)
        ? maxPoints
        : Math.min(maxPoints, Math.max(0, Math.round(gradeParsed)));
    await prisma.programPhaseAssignmentSubmission.update({
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
      type: NotificationType.PROGRAM_ASSIGNMENT_REVIEWED,
      title: `Approved: ${submission.assignment.title}`,
      body:
        feedback ||
        `Your submission was approved (${grade}/${maxPoints} pts).`,
      linkUrl: `/programs/${program.slug}`,
    });
  } else if (decision === "reject") {
    await prisma.programPhaseAssignmentSubmission.update({
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
      type: NotificationType.PROGRAM_ASSIGNMENT_REVIEWED,
      title: `Revision needed: ${submission.assignment.title}`,
      body: feedback || "Your submission was reviewed. Please update and resubmit if needed.",
      linkUrl: `/programs/${program.slug}`,
    });
  } else {
    return;
  }

  revalidatePath(`/admin/programs/${program.id}/phases/${phaseId}`);
  revalidatePath(`/programs/${program.slug}`);
}
