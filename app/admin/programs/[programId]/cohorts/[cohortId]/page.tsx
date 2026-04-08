import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  approveCohortMember,
  assignUserToCohortFromForm,
  deleteProgramCohort,
  rejectCohortMember,
  removeCohortMember,
  updateProgramCohort,
} from "@/app/actions/programs";
import { prisma } from "@/lib/prisma";
import { cohortMemberStatusLabel } from "@/lib/program-display";

export const metadata = { title: "Cohort" };

const field =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-sky-400/30";

function memberStatusTone(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
    case "APPLIED":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
    case "REJECTED":
      return "bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-200";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

export default async function AdminCohortPage({
  params,
  searchParams,
}: {
  params: Promise<{ programId: string; cohortId: string }>;
  searchParams: Promise<{ assignError?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { programId, cohortId } = await params;
  const sp = await searchParams;

  const cohort = await prisma.programCohort.findFirst({
    where: { id: cohortId, programId },
    include: {
      program: true,
      members: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { appliedAt: "desc" },
      },
    },
  });
  if (!cohort) notFound();

  const opens = cohort.applicationOpensAt
    ? new Date(cohort.applicationOpensAt).toISOString().slice(0, 16)
    : "";
  const closes = cohort.applicationClosesAt
    ? new Date(cohort.applicationClosesAt).toISOString().slice(0, 16)
    : "";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href={`/admin/programs/${programId}`}
        className="text-sm font-medium text-teal-800 hover:underline dark:text-teal-300"
      >
        ← {cohort.program.title}
      </Link>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-400">
        Cohort
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {cohort.name}
      </h1>

      <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Schedule & applications
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          Control whether learners can self-apply and optional date bounds.
        </p>
        <form action={updateProgramCohort.bind(null, cohortId)} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Cohort name
            </label>
            <input
              name="name"
              required
              defaultValue={cohort.name}
              className={`${field} max-w-md`}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              name="applicationsOpen"
              defaultChecked={cohort.applicationsOpen}
              className="rounded border-slate-300 text-sky-600"
            />
            Accept new applications (subject to dates below)
          </label>
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-500">
                Opens
              </label>
              <input
                type="datetime-local"
                name="applicationOpensAt"
                defaultValue={opens}
                className={field}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-500">
                Closes
              </label>
              <input
                type="datetime-local"
                name="applicationClosesAt"
                defaultValue={closes}
                className={field}
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            Save cohort
          </button>
        </form>
        <form action={deleteProgramCohort.bind(null, cohortId)} className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
          <button
            type="submit"
            className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
          >
            Delete cohort
          </button>
        </form>
      </div>

      <section className="mt-10 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-400">
          Direct enrollment
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Enter a registered user&apos;s email to add or restore them as{" "}
          <strong className="text-slate-800 dark:text-slate-200">active</strong>{" "}
          immediately—no application workflow.
        </p>
        {sp.assignError ? (
          <p
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {sp.assignError}
          </p>
        ) : null}
        <form
          action={assignUserToCohortFromForm.bind(null, programId, cohortId)}
          className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-500">
              Email address
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="user@institution.edu"
              className={field}
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-teal-800 px-5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            Assign
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-400">
          Members
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Approve applications or manage active participants.
        </p>
        <ul className="mt-5 space-y-3">
          {cohort.members.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {m.user.name ?? m.user.email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {m.user.email}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${memberStatusTone(m.status)}`}
                >
                  {cohortMemberStatusLabel(m.status)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {m.status === "APPLIED" ? (
                  <>
                    <form action={approveCohortMember.bind(null, m.id)}>
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={rejectCohortMember.bind(null, m.id)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-600"
                      >
                        Reject
                      </button>
                    </form>
                  </>
                ) : null}
                {m.status === "ACTIVE" ? (
                  <form action={removeCohortMember.bind(null, m.id)}>
                    <button
                      type="submit"
                      className="text-xs text-red-600 hover:underline"
                    >
                      Mark withdrawn
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
