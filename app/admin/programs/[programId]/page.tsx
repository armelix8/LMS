import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createProgramCohort,
  createProgramPhase,
  deleteProgram,
  updateProgram,
} from "@/app/actions/programs";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Edit program" };

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm ring-offset-white transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600 dark:bg-slate-900 dark:ring-offset-slate-950 dark:focus:ring-sky-400/30";

const controlClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm ring-offset-white transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600 dark:bg-slate-900 dark:ring-offset-slate-950 dark:focus:ring-sky-400/30";

const sectionCard =
  "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50";

const dashedPanel =
  "rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/50 p-5 dark:border-slate-600 dark:bg-slate-950/30";

export default async function AdminProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { programId } = await params;
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      phases: { orderBy: { sortOrder: "asc" } },
      cohorts: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!program) notFound();

  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, published: true },
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href="/admin/programs"
        className="text-sm font-medium text-teal-800 hover:underline dark:text-teal-300"
      >
        ← Programs
      </Link>

      <div className={`mt-8 ${sectionCard}`}>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Program details
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Identity and visibility on the public programs directory.
            </p>
          </div>
          <Link
            href={`/programs/${program.slug}`}
            className="text-sm font-semibold text-sky-700 hover:underline dark:text-sky-400"
          >
            View public page →
          </Link>
        </div>
        <form
          action={updateProgram.bind(null, programId)}
          className="mt-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Title
            </label>
            <input
              name="title"
              required
              defaultValue={program.title}
              className={`${inputClass} max-w-xl`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Description
            </label>
            <textarea
              name="description"
              required
              rows={5}
              defaultValue={program.description}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Cover image URL (optional)
            </label>
            <input
              name="coverImageUrl"
              type="url"
              placeholder="/images/programs/your-cover.png"
              defaultValue={program.coverImageUrl ?? ""}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Site path starting with <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">/</code> or HTTPS. Leave blank for the gradient initial.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="published"
              defaultChecked={program.published}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Published (visible on /programs)
            </span>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            Save program
          </button>
        </form>
        <form action={deleteProgram.bind(null, programId)} className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
          <button
            type="submit"
            className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline dark:text-red-400"
            formNoValidate
          >
            Delete entire program
          </button>
        </form>
      </div>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-400">
            Phases
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Order defines the learner journey. Each phase can link one or more
            courses (all lessons in each must be completed for progress) and
            program assignments on the phase page. Draft courses are allowed;
            active cohort members are enrolled automatically.
          </p>
        </div>
        <ul className="space-y-2">
          {program.phases.map((ph) => (
            <li
              key={ph.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
            >
              <span className="font-medium text-slate-900 dark:text-white">
                <span className="mr-2 tabular-nums text-slate-400 dark:text-slate-500">
                  {ph.sortOrder + 1}.
                </span>
                {ph.title}
              </span>
              <Link
                href={`/admin/programs/${programId}/phases/${ph.id}`}
                className="text-sm font-semibold text-sky-700 hover:underline dark:text-sky-400"
              >
                Manage phase →
              </Link>
            </li>
          ))}
        </ul>
        <form
          action={createProgramPhase.bind(null, programId)}
          className={`mt-6 grid gap-3 ${dashedPanel}`}
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Add phase
          </p>
          <input
            name="title"
            placeholder="Phase title"
            required
            className={controlClass}
          />
          <textarea
            name="description"
            placeholder="Optional description"
            rows={2}
            className={controlClass}
          />
          <div>
            <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Link courses (optional)
            </span>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
              Select any courses learners must complete for this phase.
            </p>
            <fieldset className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-900/40">
              <legend className="sr-only">Courses</legend>
              {courses.length === 0 ? (
                <p className="text-sm text-slate-500">No courses yet.</p>
              ) : (
                <ul className="space-y-2">
                  {courses.map((c) => (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          name="courseIds"
                          value={c.id}
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
          <button
            type="submit"
            className="w-fit rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            Add phase
          </button>
        </form>
      </section>

      <section className="mt-12">
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-400">
            Cohorts
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Each cohort shares the same phase template. Control applications and
            assign members from the cohort admin page.
          </p>
        </div>
        <ul className="space-y-2">
          {program.cohorts.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
            >
              <span className="font-medium text-slate-900 dark:text-white">
                {c.name}
              </span>
              <Link
                href={`/admin/programs/${programId}/cohorts/${c.id}`}
                className="text-sm font-semibold text-sky-700 hover:underline dark:text-sky-400"
              >
                Members & settings →
              </Link>
            </li>
          ))}
        </ul>
        <form
          action={createProgramCohort.bind(null, programId)}
          className={`mt-6 space-y-4 ${dashedPanel}`}
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            New cohort
          </p>
          <input
            name="name"
            placeholder="Cohort name (e.g. 2026 Spring)"
            required
            className={`max-w-md ${controlClass}`}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" name="applicationsOpen" className="rounded border-slate-300 text-sky-600" />
            Open for applications
          </label>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-500">
                Opens (optional)
              </label>
              <input
                type="datetime-local"
                name="applicationOpensAt"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-500">
                Closes (optional)
              </label>
              <input
                type="datetime-local"
                name="applicationClosesAt"
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            Create cohort
          </button>
        </form>
      </section>
    </main>
  );
}
