import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  CourseMetaStat,
  IconLayers,
  IconUsers,
} from "@/components/course-detail-meta";
import { HeroInitialCover } from "@/components/hero-initial-cover";
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
        select: { id: true, title: true, description: true },
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

  const phaseCount = program.phases.length;
  const cohortCount = program.cohorts.length;
  const openCohorts = program.cohorts.filter((c) =>
    cohortApplicationsWindowOpen(c),
  );
  const closedCohorts = program.cohorts.filter(
    (c) => !cohortApplicationsWindowOpen(c),
  );

  return (
    <main className="flex-1">
      {sp.applyError ? (
        <div className="border-b border-red-200/80 bg-red-50/90 dark:border-red-900/40 dark:bg-red-950/30">
          <p
            className="mx-auto max-w-7xl px-4 py-3 text-sm text-red-950 dark:text-red-100 sm:px-6 lg:px-8"
            role="alert"
          >
            {sp.applyError}
          </p>
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
              <li className="max-w-[min(100%,42rem)] truncate font-semibold text-slate-800 dark:text-slate-100">
                {program.title}
              </li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_min(100%,22rem)] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0">
              <div className="overflow-hidden rounded-[1.75rem] shadow-[0_25px_50px_-12px_rgba(15,118,110,0.18)] ring-1 ring-teal-900/10 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] dark:ring-teal-500/20">
                <HeroInitialCover
                  title={program.title}
                  imageUrl={program.coverImageUrl}
                />
              </div>

              <div className="mt-8 space-y-5">
                <span className="inline-flex items-center rounded-full border border-teal-200/80 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-900 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200">
                  Program
                </span>
                <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1] dark:text-white">
                  {program.title}
                </h1>
                <div className="prose prose-slate max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-300">
                  <p className="whitespace-pre-wrap text-base">
                    {program.description}
                  </p>
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24">
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_22px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04] dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.35)] dark:ring-white/[0.06]">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Program details
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Structure and cohorts at a glance.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <CourseMetaStat
                    label="Phases"
                    value={String(phaseCount)}
                    icon={<IconLayers />}
                  />
                  <CourseMetaStat
                    label="Cohorts"
                    value={String(cohortCount)}
                    icon={<IconUsers />}
                  />
                </div>
                <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Cohorts
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Each cohort runs the same program structure. Apply when the
                    window is open, or access your cohort if you have already
                    been enrolled.
                  </p>

                  <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Open cohorts
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Applications are currently open.
                  </p>
                  {openCohorts.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      No open cohorts right now.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {openCohorts.map((c) => {
                        const status = membershipByCohortId.get(c.id);
                        return (
                          <li
                            key={c.id}
                            className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {c.name}
                              </p>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200">
                                Open
                              </span>
                            </div>
                            {status ? (
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Your status: {cohortMemberStatusLabel(status)}
                              </p>
                            ) : null}
                            {status === "ACTIVE" ? (
                              <Link
                                href={`/programs/${program.slug}/cohorts/${c.slug}`}
                                className="mt-2 inline-flex text-xs font-semibold text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200"
                              >
                                Open cohort
                              </Link>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Closed cohorts
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Applications are currently closed.
                  </p>
                  {closedCohorts.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      No closed cohorts.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {closedCohorts.map((c) => {
                        const status = membershipByCohortId.get(c.id);
                        return (
                          <li
                            key={c.id}
                            className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/60"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {c.name}
                              </p>
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                Closed
                              </span>
                            </div>
                            {status ? (
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Your status: {cohortMemberStatusLabel(status)}
                              </p>
                            ) : null}
                            {status === "ACTIVE" ? (
                              <Link
                                href={`/programs/${program.slug}/cohorts/${c.slug}`}
                                className="mt-2 inline-flex text-xs font-semibold text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200"
                              >
                                Open cohort
                              </Link>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  </div>

                  <Link
                    href="/dashboard"
                    className="mt-5 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <section aria-labelledby="path-heading">
          <div className="flex flex-col gap-2">
            <h2
              id="path-heading"
              className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              Curriculum path
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              After you join a cohort, complete each phase in order. Linked
              courses use your enrollments; program assignments are submitted
              from your cohort progress page.
            </p>
          </div>

          {program.phases.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-500">
              Phase details will appear here once configured by an administrator.
            </p>
          ) : (
            <ol className="mt-10 space-y-5">
              {program.phases.map((ph, i) => (
                <li key={ph.id}>
                  <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700 dark:bg-slate-900/40 dark:ring-white/[0.04]">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-teal-50/30 px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-teal-950/20">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        <span className="mr-2 font-bold text-sky-600 dark:text-sky-400">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {ph.title}
                      </h3>
                    </div>
                    {ph.description ? (
                      <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {ph.description}
                        </div>
                      </div>
                    ) : null}
                  </article>
                </li>
              ))}
            </ol>
          )}
        </section>

      </div>
    </main>
  );
}
