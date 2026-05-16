import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProgramPhaseAssignmentForm } from "@/components/program-phase-assignment-form";
import { HeroInitialCover } from "@/components/hero-initial-cover";
import { LearnerCourseProgressBar } from "@/components/learner-course-progress-bar";
import {
  getCourseLessonProgressForUser,
  isProgramPhaseCompleteForUser,
} from "@/lib/program-progress";
import { submissionReviewLabel } from "@/lib/program-display";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; cohortSlug: string }>;
}) {
  const { slug, cohortSlug } = await params;
  const cohort = await prisma.programCohort.findFirst({
    where: { slug: cohortSlug, program: { slug, published: true } },
    select: { name: true },
  });
  return { title: cohort?.name ?? "Cohort" };
}

export default async function LearnerCohortPage({
  params,
}: {
  params: Promise<{ slug: string; cohortSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { slug, cohortSlug } = await params;
  const cohort = await prisma.programCohort.findFirst({
    where: { slug: cohortSlug, program: { slug, published: true } },
    include: {
      program: {
        include: {
          phases: {
            orderBy: { sortOrder: "asc" },
            include: {
              phaseCourses: {
                orderBy: { sortOrder: "asc" },
                include: {
                  course: { select: { id: true, title: true, slug: true } },
                },
              },
              assignments: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!cohort) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const member = await prisma.cohortMember.findUnique({
    where: {
      cohortId_userId: { cohortId: cohort.id, userId: session.user.id },
    },
  });
  if (!isAdmin && (!member || member.status !== "ACTIVE")) {
    return (
      <main className="flex-1 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_22px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04] dark:border-slate-800 dark:bg-slate-900/80 dark:ring-white/[0.06]">
          <div className="h-2 bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500" aria-hidden />
          <div className="px-8 py-10 text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Cohort access
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              You do not have active enrollment in this cohort. If you recently
              applied, please wait for an administrator to approve your request.
            </p>
            <Link
              href={`/programs/${slug}`}
              className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 px-6 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-teal-500 sm:w-auto"
            >
              Back to program
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const userId = session.user.id;
  const phasesWithStatus = await Promise.all(
    cohort.program.phases.map(async (ph) => {
      const courseProgressById: Record<
        string,
        Awaited<ReturnType<typeof getCourseLessonProgressForUser>>
      > = {};
      const courseCompleteById: Record<string, boolean> = {};
      for (const pc of ph.phaseCourses) {
        const p = await getCourseLessonProgressForUser(userId, pc.courseId);
        courseProgressById[pc.courseId] = p;
        courseCompleteById[pc.courseId] = p.isComplete;
      }
      return {
        ...ph,
        complete: await isProgramPhaseCompleteForUser(userId, ph, {
          courseCompleteById,
        }),
        courseProgressById,
      };
    }),
  );

  const totalPhases = phasesWithStatus.length;
  const doneCount = phasesWithStatus.filter((p) => p.complete).length;
  const allDone = totalPhases > 0 && doneCount === totalPhases;
  const progressPct =
    totalPhases === 0 ? 0 : Math.round((doneCount / totalPhases) * 100);

  const submissions = await prisma.programPhaseAssignmentSubmission.findMany({
    where: {
      userId,
      assignmentId: {
        in: cohort.program.phases.flatMap((p) => p.assignments.map((a) => a.id)),
      },
    },
  });
  const subByAssignmentId = new Map(submissions.map((s) => [s.assignmentId, s]));

  const programTitle = cohort.program.title;
  const isAdminViewer = isAdmin && (!member || member.status !== "ACTIVE");

  return (
    <main className="flex-1">
      {isAdmin ? (
        <div className="border-b border-[var(--brand-500)]/20 bg-gradient-to-r from-[var(--brand-50)] to-[var(--accent-400)]/10 dark:from-[var(--brand-950)] dark:to-transparent">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--brand-700)] dark:text-[var(--brand-300)]">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-400)]"
              />
              {isAdminViewer
                ? "Admin · read-only preview (you are not a cohort member)"
                : "Admin view"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/programs/${cohort.program.id}/cohorts/${cohort.id}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--brand-600)]"
              >
                <span aria-hidden>⚙</span> Manage cohort
              </Link>
              <Link
                href={`/admin/programs/${cohort.program.id}`}
                className="inline-flex items-center rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--brand-500)]/40 hover:text-[var(--brand-700)] dark:text-slate-200"
              >
                Manage program
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      <div className="relative border-b border-teal-900/[0.06] bg-gradient-to-b from-teal-50/60 via-white to-[var(--background)] dark:from-teal-950/25 dark:via-slate-950 dark:to-[var(--background)]">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/10" />
          <div className="absolute -right-20 top-32 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl dark:bg-teal-500/10" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
          <nav className="mb-8 text-sm" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
              <li>
                <Link
                  href="/programs"
                  className="font-medium transition hover:text-teal-700 dark:hover:text-teal-300"
                >
                  Programs
                </Link>
              </li>
              <li aria-hidden className="text-slate-300 dark:text-slate-600">
                /
              </li>
              <li className="min-w-0 max-w-[12rem] truncate sm:max-w-none">
                <Link
                  href={`/programs/${slug}`}
                  className="font-medium transition hover:text-teal-700 dark:hover:text-teal-300"
                >
                  {programTitle}
                </Link>
              </li>
              <li aria-hidden className="text-slate-300 dark:text-slate-600">
                /
              </li>
              <li className="max-w-[min(100%,20rem)] truncate font-semibold text-slate-800 dark:text-slate-100">
                {cohort.name}
              </li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_min(100%,22rem)] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0">
              <div className="overflow-hidden rounded-[1.75rem] shadow-[0_25px_50px_-12px_rgba(15,118,110,0.18)] ring-1 ring-teal-900/10 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] dark:ring-teal-500/20">
                <HeroInitialCover title={cohort.name} />
              </div>
              <div className="mt-8 space-y-4">
                <span className="inline-flex items-center rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
                  Cohort
                </span>
                <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight dark:text-white">
                  {cohort.name}
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
                  Work through each phase in order. Course requirements use your
                  existing course enrollments; program assignments are reviewed by
                  administrators.
                </p>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24">
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_22px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04] dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.35)] dark:ring-white/[0.06]">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Your progress
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Phases completed in this cohort.
                </p>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Program
                  </p>
                  <p className="mt-1 line-clamp-3 text-sm font-semibold leading-snug text-slate-900 dark:text-white">
                    {programTitle}
                  </p>
                </div>

                {totalPhases > 0 ? (
                  <>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900 dark:text-white">
                        Overall
                      </span>
                      <span className="tabular-nums text-slate-600 dark:text-slate-400">
                        {doneCount} / {totalPhases} · {progressPct}%
                      </span>
                    </div>
                    <div
                      className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                      role="progressbar"
                      aria-valuenow={progressPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-600 transition-all dark:from-sky-400 dark:to-teal-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
                    No phases configured yet.
                  </p>
                )}

                <Link
                  href={`/programs/${slug}`}
                  className="mt-6 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Program overview
                </Link>
              </div>
            </aside>
          </div>

          {allDone ? (
            <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-emerald-200/90 bg-emerald-50/90 px-5 py-4 text-sm font-medium text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-100">
              You have completed every phase in this cohort. Thank you for
              finishing the program path.
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <ol className="space-y-8">
          {phasesWithStatus.map((ph, idx) => (
            <li key={ph.id}>
              <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700 dark:bg-slate-900/40 dark:ring-white/[0.04]">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-teal-50/30 px-6 py-5 dark:border-slate-800 dark:from-slate-900 dark:to-teal-950/20">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                        Phase {idx + 1} of {totalPhases || 1}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                        {ph.title}
                      </h2>
                      {ph.description ? (
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          {ph.description}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        ph.complete
                          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
                          : "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                      }`}
                    >
                      {ph.complete ? "Complete" : "In progress"}
                    </span>
                  </div>
                </div>

                <div className="space-y-6 px-6 py-6">
                  {ph.phaseCourses.length > 0 ? (
                    <div className="rounded-2xl border border-teal-900/10 bg-gradient-to-br from-teal-50/80 to-sky-50/30 p-5 dark:border-teal-500/15 dark:from-teal-950/40 dark:to-sky-950/20">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Course requirements
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        Complete all lessons in each linked course with an active
                        enrollment.
                      </p>
                      <ul className="mt-4 space-y-4">
                        {ph.phaseCourses.map((pc) => {
                          const c = pc.course;
                          const prog = ph.courseProgressById[c.id];
                          const done = prog?.isComplete ?? false;
                          return (
                            <li
                              key={pc.id}
                              className="rounded-xl border border-teal-900/10 bg-white/70 px-4 py-4 dark:border-teal-500/10 dark:bg-slate-900/50"
                            >
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {c.title}
                              </p>
                              {prog && prog.totalLessons > 0 ? (
                                <LearnerCourseProgressBar
                                  completedCount={prog.completedCount}
                                  totalLessons={prog.totalLessons}
                                  className="mt-3 border-teal-900/10 bg-white/90 dark:border-teal-500/15 dark:bg-slate-900/60"
                                />
                              ) : prog ? (
                                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                                  {done
                                    ? "This course has no lessons — requirement is satisfied."
                                    : "No lessons published yet."}
                                </p>
                              ) : null}
                              <div className="mt-4 flex flex-wrap gap-3">
                                <Link
                                  href={`/courses/${c.slug}`}
                                  className="inline-flex min-h-9 items-center rounded-xl border border-teal-800/15 bg-white/90 px-3 text-sm font-semibold text-teal-900 shadow-sm hover:bg-white dark:border-teal-500/20 dark:bg-slate-900/80 dark:text-teal-100 dark:hover:bg-slate-900"
                                >
                                  Course overview
                                </Link>
                                <Link
                                  href={`/learn/${c.slug}`}
                                  className="inline-flex min-h-9 items-center rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 px-3 text-sm font-semibold text-white shadow-sm hover:from-sky-500 hover:to-teal-500"
                                >
                                  Continue learning
                                </Link>
                              </div>
                              {prog && prog.totalLessons > 0 ? (
                                <p
                                  className={`mt-2 text-xs font-medium ${
                                    done
                                      ? "text-emerald-800 dark:text-emerald-300"
                                      : "text-slate-600 dark:text-slate-400"
                                  }`}
                                >
                                  {done
                                    ? "All lessons in this course are complete."
                                    : "Complete every lesson to satisfy this requirement."}
                                </p>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}

                  {ph.assignments.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Program assignments
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                        Submitted here; separate from lesson-based course work.
                      </p>
                      <ul className="mt-4 space-y-5">
                        {ph.assignments.map((a) => {
                          const sub = subByAssignmentId.get(a.id);
                          return (
                            <li
                              key={a.id}
                              className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/30"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                  {a.title}
                                </h4>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                    a.requiredForCompletion
                                      ? "bg-slate-200/80 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                                      : "border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                                  }`}
                                >
                                  {a.requiredForCompletion
                                    ? "Required"
                                    : "Optional"}
                                </span>
                              </div>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {a.description}
                              </p>
                              {sub ? (
                                <p className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                                  {submissionReviewLabel(sub.reviewStatus)}
                                  {sub.reviewStatus === "APPROVED"
                                    ? " — counts toward this phase"
                                    : ""}
                                </p>
                              ) : null}
                              <ProgramPhaseAssignmentForm
                                assignmentId={a.id}
                                responseType={a.responseType}
                                existingContent={sub?.content ?? ""}
                                hasExistingFile={Boolean(sub?.fileUrl)}
                                reviewStatus={sub?.reviewStatus ?? "PENDING"}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
