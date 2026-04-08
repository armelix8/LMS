import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createProgramPhaseAssignment,
  deleteProgramPhase,
  deleteProgramPhaseAssignment,
  reviewProgramPhaseSubmission,
  updateProgramPhase,
  updateProgramPhaseAssignment,
} from "@/app/actions/programs";
import { prisma } from "@/lib/prisma";
import { isSubmissionApproved } from "@/lib/assignment-review";
import { submissionReviewLabel } from "@/lib/program-display";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm ring-offset-white transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600 dark:bg-slate-900 dark:ring-offset-slate-950 dark:focus:ring-sky-400/30";

const controlClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm ring-offset-white transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600 dark:bg-slate-900 dark:ring-offset-slate-950 dark:focus:ring-sky-400/30";

const sectionCard =
  "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50";

const dashedPanel =
  "rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/50 p-6 dark:border-slate-600 dark:bg-slate-950/30";

const labelClass =
  "block text-sm font-medium text-slate-800 dark:text-slate-200";

const sectionHeading =
  "text-xs font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-400";

const btnPrimary =
  "inline-flex min-h-10 items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400";

const btnSecondary =
  "inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

const btnDanger =
  "text-sm font-medium text-red-600 transition hover:text-red-700 hover:underline dark:text-red-400 dark:hover:text-red-300";

type PageProps = { params: Promise<{ programId: string; phaseId: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { programId, phaseId } = await params;
  const phase = await prisma.programPhase.findFirst({
    where: { id: phaseId, programId },
    select: { title: true },
  });
  return {
    title: phase ? `${phase.title} · Phase` : "Program phase",
  };
}

export default async function AdminPhasePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { programId, phaseId } = await params;
  const phase = await prisma.programPhase.findFirst({
    where: { id: phaseId, programId },
    include: {
      program: true,
      phaseCourses: {
        orderBy: { sortOrder: "asc" },
        select: { courseId: true },
      },
      assignments: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!phase) notFound();

  const selectedCourseIds = new Set(phase.phaseCourses.map((pc) => pc.courseId));

  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, published: true },
  });

  const submissions = await prisma.programPhaseAssignmentSubmission.findMany({
    where: { assignmentId: { in: phase.assignments.map((a) => a.id) } },
    include: {
      user: { select: { name: true, email: true } },
      assignment: { select: { title: true, maxPoints: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <nav
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400"
        aria-label="Breadcrumb"
      >
        <Link
          href="/admin/programs"
          className="font-medium text-teal-800 hover:text-teal-700 hover:underline dark:text-teal-300"
        >
          Programs
        </Link>
        <span aria-hidden className="text-slate-400">
          /
        </span>
        <Link
          href={`/admin/programs/${programId}`}
          className="min-w-0 truncate font-medium text-teal-800 hover:underline dark:text-teal-300"
        >
          {phase.program.title}
        </Link>
        <span aria-hidden className="text-slate-400">
          /
        </span>
        <span className="min-w-0 truncate font-medium text-slate-700 dark:text-slate-300">
          {phase.title}
        </span>
      </nav>

      <header className="mt-8 border-b border-slate-200/80 pb-8 dark:border-slate-800">
        <p className={sectionHeading}>Phase</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {phase.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Configure how this step appears in the program journey, link one or
          more LMS courses for progress, and manage phase-level assignments and
          reviews.
        </p>
      </header>

      <div className={`mt-10 ${sectionCard}`}>
        <div className="border-b border-slate-100 pb-5 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Phase details
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Title and description appear on the learner program view. The linked
            courses gate phase completion when every lesson in each course is
            done.
          </p>
        </div>
        <form
          action={updateProgramPhase.bind(null, phaseId)}
          className="mt-6 space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <label htmlFor="phase-title" className={labelClass}>
                Phase title
              </label>
              <input
                id="phase-title"
                name="title"
                required
                autoComplete="off"
                defaultValue={phase.title}
                className={inputClass}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="phase-description" className={labelClass}>
                Description
              </label>
              <textarea
                id="phase-description"
                name="description"
                rows={4}
                placeholder="What learners should focus on in this phase…"
                defaultValue={phase.description ?? ""}
                className={inputClass}
              />
            </div>
            <div className="lg:col-span-2">
              <span className={labelClass}>Linked courses</span>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
                Optional. Learners must complete all lessons in each selected
                course. Draft courses are allowed; active cohort members are
                enrolled automatically.
              </p>
              <fieldset className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-950/30">
                <legend className="sr-only">Courses to link</legend>
                {courses.length === 0 ? (
                  <p className="text-sm text-slate-500">No courses in the system.</p>
                ) : (
                  <ul className="space-y-2">
                    {courses.map((c) => (
                      <li key={c.id}>
                        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                          <input
                            type="checkbox"
                            name="courseIds"
                            value={c.id}
                            defaultChecked={selectedCourseIds.has(c.id)}
                            className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                          <span>
                            {c.title}
                            {!c.published ? (
                              <span className="text-slate-500"> (draft)</span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </fieldset>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
            <button type="submit" className={btnPrimary}>
              Save changes
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Danger zone
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Deleting removes this phase and its program assignments. Submissions
            may be removed according to database rules.
          </p>
          <form
            action={deleteProgramPhase.bind(null, phaseId)}
            className="mt-4"
          >
            <button type="submit" className={btnDanger} formNoValidate>
              Delete this phase
            </button>
          </form>
        </div>
      </div>

      <section className="mt-12">
        <div className="mb-6">
          <h2 className={sectionHeading}>Program assignments</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Tasks defined for this phase only—they are not stored inside course
            lessons. Learners submit from their program cohort view.
          </p>
        </div>
        <ul className="space-y-6">
          {phase.assignments.map((a, index) => (
            <li
              key={a.id}
              className={`${sectionCard} border-slate-200/90 p-0 dark:border-slate-800`}
            >
              <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Assignment {index + 1}
                </p>
              </div>
              <form
                action={updateProgramPhaseAssignment.bind(null, a.id)}
                className="space-y-4 p-6"
              >
                <div>
                  <label className={labelClass} htmlFor={`asg-title-${a.id}`}>
                    Title
                  </label>
                  <input
                    id={`asg-title-${a.id}`}
                    name="title"
                    defaultValue={a.title}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label
                    className={labelClass}
                    htmlFor={`asg-desc-${a.id}`}
                  >
                    Instructions
                  </label>
                  <textarea
                    id={`asg-desc-${a.id}`}
                    name="description"
                    rows={3}
                    defaultValue={a.description}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label
                      className={labelClass}
                      htmlFor={`asg-points-${a.id}`}
                    >
                      Max points
                    </label>
                    <input
                      id={`asg-points-${a.id}`}
                      name="maxPoints"
                      type="number"
                      min={0}
                      defaultValue={a.maxPoints}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <span className={labelClass}>Response type</span>
                    <select
                      name="responseType"
                      defaultValue={a.responseType}
                      className={`${controlClass} mt-1`}
                    >
                      <option value="TEXT">Text</option>
                      <option value="FILE">File upload</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                      <input
                        type="checkbox"
                        name="requiredForCompletion"
                        defaultChecked={a.requiredForCompletion}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      Required to complete phase
                    </label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button type="submit" className={btnPrimary}>
                    Save assignment
                  </button>
                  <button
                    type="submit"
                    formAction={deleteProgramPhaseAssignment.bind(null, a.id)}
                    className={`${btnSecondary} border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40`}
                  >
                    Delete
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ul>

        <form
          action={createProgramPhaseAssignment.bind(null, phaseId)}
          className={`mt-8 ${dashedPanel} space-y-4`}
        >
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Add assignment
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Create another task for this phase.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="new-asg-title">
                Title
              </label>
              <input
                id="new-asg-title"
                name="title"
                placeholder="e.g. Capstone reflection"
                required
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="new-asg-desc">
                Instructions
              </label>
              <textarea
                id="new-asg-desc"
                name="description"
                placeholder="What should learners submit?"
                required
                rows={3}
                className={inputClass}
              />
            </div>
            <div>
              <span className={labelClass}>Response type</span>
              <select name="responseType" className={`${controlClass} mt-1`}>
                <option value="TEXT">Text</option>
                <option value="FILE">File upload</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  name="requiredForCompletion"
                  defaultChecked
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                Required to complete phase
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center rounded-lg bg-teal-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            Add assignment
          </button>
        </form>
      </section>

      <section className="mt-14">
        <div className="mb-6">
          <h2 className={sectionHeading}>Submissions</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Review learner work submitted for assignments in this phase. Approve
            or reject with optional grade and feedback.
          </p>
        </div>
        <ul className="space-y-5">
          {submissions.length === 0 ? (
            <li
              className={`rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-950/30`}
            >
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                No submissions yet
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                Submissions will appear here when learners turn in work for this
                phase&apos;s assignments.
              </p>
            </li>
          ) : (
            submissions.map((s) => (
              <li
                key={s.id}
                className={`${sectionCard} overflow-hidden p-0`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {s.assignment.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {s.user.name ?? s.user.email}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500 dark:text-slate-500">
                    <time dateTime={s.submittedAt.toISOString()}>
                      {s.submittedAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                </div>
                <div className="space-y-3 px-6 py-5">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {submissionReviewLabel(s.reviewStatus)}
                    {isSubmissionApproved(s) ? (
                      <span className="font-normal text-slate-500 dark:text-slate-500">
                        {" "}
                        · Counts toward phase completion
                      </span>
                    ) : null}
                  </p>
                  {s.content ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/50">
                      <pre className="max-h-48 overflow-auto p-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                        {s.content}
                      </pre>
                    </div>
                  ) : null}
                  {s.fileUrl ? (
                    <p>
                      <a
                        href={s.fileUrl}
                        className="text-sm font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {s.fileName ?? "Download attachment"}
                      </a>
                    </p>
                  ) : null}
                  {s.reviewStatus === "PENDING" || s.reviewStatus === "REJECTED" ? (
                    <form
                      action={reviewProgramPhaseSubmission.bind(null, s.id)}
                      className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:flex-wrap sm:items-end"
                    >
                      <div className="min-w-[8rem] flex-1">
                        <label
                          className="text-xs font-medium text-slate-600 dark:text-slate-400"
                          htmlFor={`grade-${s.id}`}
                        >
                          Grade (optional)
                        </label>
                        <input
                          id={`grade-${s.id}`}
                          name="grade"
                          type="number"
                          placeholder={`Max ${s.assignment.maxPoints}`}
                          className={`${inputClass} mt-1`}
                        />
                      </div>
                      <div className="min-w-[12rem] flex-[2]">
                        <label
                          className="text-xs font-medium text-slate-600 dark:text-slate-400"
                          htmlFor={`fb-${s.id}`}
                        >
                          Feedback
                        </label>
                        <input
                          id={`fb-${s.id}`}
                          name="feedback"
                          placeholder="Notes for the learner"
                          className={`${inputClass} mt-1`}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 sm:pb-0.5">
                        <button
                          type="submit"
                          name="decision"
                          value="approve"
                          className="inline-flex min-h-10 items-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
                        >
                          Approve
                        </button>
                        <button
                          type="submit"
                          name="decision"
                          value="reject"
                          className={btnSecondary}
                        >
                          Reject
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
