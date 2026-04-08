import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { applyToCohortFromProgramPage } from "@/app/actions/programs";
import { cohortApplicationsWindowOpen } from "@/lib/cohort-applications";
import { cohortMemberStatusLabel } from "@/lib/program-display";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await prisma.program.findUnique({
    where: { slug, published: true },
    select: { title: true },
  });
  return { title: p?.title ?? "Program" };
}

const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white shadow-md shadow-sky-900/10 transition hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] dark:bg-sky-500 dark:hover:bg-sky-400";
const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300/90 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal-700/20 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-teal-500/30 dark:hover:bg-slate-800/90";

export default async function ProgramPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ applyError?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const session = await auth();

  const program = await prisma.program.findFirst({
    where: { slug, published: true },
    include: {
      cohorts: { orderBy: { name: "asc" } },
      phases: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, title: true },
      },
    },
  });
  if (!program) notFound();

  const membershipByCohortId = session?.user?.id
    ? new Map(
        (
          await prisma.cohortMember.findMany({
            where: {
              userId: session.user.id,
              cohortId: { in: program.cohorts.map((c) => c.id) },
            },
            select: { cohortId: true, status: true },
          })
        ).map((m) => [m.cohortId, m.status]),
      )
    : new Map<string, string>();

  return (
    <main className="flex-1">
      <section className="border-b border-teal-900/[0.08] bg-gradient-to-b from-sky-50/80 via-white to-transparent dark:border-teal-500/10 dark:from-sky-950/20 dark:via-transparent dark:to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <Link
            href="/programs"
            className="text-sm font-medium text-teal-800 hover:text-teal-900 hover:underline dark:text-teal-300 dark:hover:text-teal-200"
          >
            ← All programs
          </Link>
          <h1 className="mt-5 max-w-3xl text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {program.title}
          </h1>
          <div className="mt-6 max-w-3xl rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-5 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {program.description}
            </p>
          </div>

          {sp.applyError ? (
            <div
              className="mt-6 max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
              role="alert"
            >
              {sp.applyError}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-400">
            Curriculum path
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            After you join a cohort, complete each phase in order. Linked
            courses (one or more per phase) use your enrollments; program
            assignments are submitted from your cohort progress page.
          </p>
          {program.phases.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-500">
              Phase details will appear here once configured by an
              administrator.
            </p>
          ) : (
            <ol className="relative mt-8 space-y-0 border-l border-teal-200 pl-8 dark:border-teal-800/80">
              {program.phases.map((ph, i) => (
                <li key={ph.id} className="relative pb-10 last:pb-0">
                  <span
                    className="absolute -left-[39px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-sky-600 text-xs font-bold text-white shadow-sm dark:border-slate-900 dark:bg-sky-500"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {ph.title}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-400">
            Cohorts
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Each cohort runs the same program structure. Apply when the window
            is open, or access your cohort if you have already been enrolled.
          </p>
          <ul className="mt-8 space-y-5">
            {program.cohorts.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                No cohorts are available for this program yet.
              </li>
            ) : (
              program.cohorts.map((c) => {
                const open = cohortApplicationsWindowOpen(c);
                const status = membershipByCohortId.get(c.id);
                return (
                  <li
                    key={c.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {c.name}
                          </h3>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              open
                                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {open ? "Accepting applications" : "Closed"}
                          </span>
                        </div>
                        {status ? (
                          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="text-slate-500 dark:text-slate-500">
                              Your status:{" "}
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {cohortMemberStatusLabel(status)}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                        {status === "ACTIVE" ? (
                          <Link
                            href={`/programs/${program.slug}/cohorts/${c.slug}`}
                            className={btnPrimary}
                          >
                            Cohort progress
                          </Link>
                        ) : null}
                        {session?.user && status === "APPLIED" ? (
                          <span className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                            Application under review
                          </span>
                        ) : null}
                        {session?.user &&
                        open &&
                        (status == null ||
                          status === "REJECTED" ||
                          status === "WITHDRAWN") ? (
                          <form
                            action={applyToCohortFromProgramPage.bind(
                              null,
                              program.slug,
                              c.slug,
                              c.id,
                            )}
                          >
                            <button type="submit" className={`w-full ${btnSecondary}`}>
                              {status === "REJECTED" || status === "WITHDRAWN"
                                ? "Apply again"
                                : "Request to join"}
                            </button>
                          </form>
                        ) : null}
                        {!session?.user && open ? (
                          <Link
                            href={`/auth/signin?callbackUrl=/programs/${program.slug}`}
                            className={`text-center ${btnSecondary}`}
                          >
                            Sign in to apply
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
