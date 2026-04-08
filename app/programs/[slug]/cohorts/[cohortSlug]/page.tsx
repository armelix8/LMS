import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProgramPhaseAssignmentForm } from "@/components/program-phase-assignment-form";
import {
  getCourseLessonProgressForUser,
  isProgramPhaseCompleteForUser,
} from "@/lib/program-progress";
import { submissionReviewLabel } from "@/lib/program-display";
import { LearnerCourseProgressBar } from "@/components/learner-course-progress-bar";
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

  const member = await prisma.cohortMember.findUnique({
    where: {
      cohortId_userId: { cohortId: cohort.id, userId: session.user.id },
    },
  });
  if (!member || member.status !== "ACTIVE") {
    return (
      <main className="mx-auto flex-1 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            Cohort access
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            You do not have active enrollment in this cohort. If you recently
            applied, please wait for an administrator to approve your request.
          </p>
          <Link
            href={`/programs/${slug}`}
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-6 text-sm font-semibold text-white hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            Back to program
          </Link>
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

  return (
    <main className="flex-1">
      <section className="border-b border-teal-900/[0.08] bg-gradient-to-b from-teal-50/40 via-white to-transparent dark:border-teal-500/10 dark:from-teal-950/25 dark:via-transparent">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <Link
            href={`/programs/${slug}`}
            className="text-sm font-medium text-teal-800 hover:underline dark:text-teal-300"
          >
            ← {cohort.program.title}
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-400">
            Cohort
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {cohort.name}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Work through each phase in order. Course requirements use your
            existing course enrollments; program assignments are reviewed by
            administrators.
          </p>

          {totalPhases > 0 ? (
            <div className="mt-8 max-w-md rounded-2xl border border-slate-200/90 bg-white/90 px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900 dark:text-white">
                  Overall progress
                </span>
                <span className="tabular-nums text-slate-600 dark:text-slate-400">
                  {doneCount} / {totalPhases} phases · {progressPct}%
                </span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
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
            </div>
          ) : null}

          {allDone ? (
            <div className="mt-6 max-w-2xl rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-5 py-4 text-sm font-medium text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-100">
              You have completed every phase in this cohort. Thank you for
              finishing the program path.
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <ol className="space-y-8">
          {phasesWithStatus.map((ph, idx) => (
            <li
              key={ph.id}
              className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_0_rgba(15,118,110,0.04)] dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none"
            >
              <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                      Phase {idx + 1} of {totalPhases || 1}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                      {ph.title}
                    </h2>
                    {ph.description ? (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {ph.description}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
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
                  <div className="rounded-xl border border-teal-900/10 bg-gradient-to-br from-teal-50/80 to-sky-50/30 p-5 dark:border-teal-500/15 dark:from-teal-950/40 dark:to-sky-950/20">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Course requirements
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      Complete all lessons in each linked course (below) with an
                      active enrollment.
                    </p>
                    <ul className="mt-4 space-y-4">
                      {ph.phaseCourses.map((pc) => {
                        const c = pc.course;
                        const prog = ph.courseProgressById[c.id];
                        const done = prog?.isComplete ?? false;
                        return (
                          <li
                            key={pc.id}
                            className="rounded-lg border border-teal-900/10 bg-white/60 px-4 py-3 dark:border-teal-500/10 dark:bg-slate-900/40"
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
                            <div className="mt-3 flex flex-wrap gap-3">
                              <Link
                                href={`/courses/${c.slug}`}
                                className="inline-flex min-h-9 items-center rounded-lg border border-teal-800/15 bg-white/90 px-3 text-sm font-semibold text-teal-900 shadow-sm hover:bg-white dark:border-teal-500/20 dark:bg-slate-900/80 dark:text-teal-100 dark:hover:bg-slate-900"
                              >
                                Course overview
                              </Link>
                              <Link
                                href={`/learn/${c.slug}`}
                                className="inline-flex min-h-9 items-center rounded-lg bg-sky-600 px-3 text-sm font-semibold text-white hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
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
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
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
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
