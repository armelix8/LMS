import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { HeroInitialCover } from "@/components/hero-initial-cover";

export const metadata = { title: "Programs" };

const inputFocus =
  "focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:focus:ring-sky-400/30";

export default async function ProgramsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const programs = await prisma.program.findMany({
    where: isAdmin ? undefined : { published: true },
    orderBy: { title: "asc" },
    include: {
      _count: { select: { phases: true, cohorts: true } },
    },
  });

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
              Admin · listing includes unpublished programs
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin/programs/new"
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--brand-600)]"
              >
                + New program
              </Link>
              <Link
                href="/admin/programs"
                className="inline-flex items-center rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--brand-500)]/40 hover:text-[var(--brand-700)] dark:text-slate-200"
              >
                Manage programs
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
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8">
          <nav className="text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="font-medium hover:text-teal-700 dark:hover:text-teal-300">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-slate-300 dark:text-slate-600">
                /
              </li>
              <li className="font-semibold text-slate-800 dark:text-slate-100">
                Programs
              </li>
            </ol>
          </nav>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-teal-800/90 dark:text-teal-300/90">
            UniPod Learn
          </p>
          <h1 className="mt-3 max-w-2xl text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            Programs & cohorts
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Multi-phase learning paths with structured cohorts. Browse offerings
            below, then join a cohort when applications are open or continue
            your progress from the dashboard.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {programs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300/90 bg-white/60 px-8 py-16 text-center dark:border-slate-700 dark:bg-slate-900/30">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              No programs are published yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              When your institution publishes a program, it will appear here
              with cohorts you can apply to.
            </p>
            <Link
              href="/courses"
              className={`mt-8 inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal-700/20 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-800/80 ${inputFocus}`}
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {programs.map((p) => (
              <li key={p.id}>
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_22px_50px_-12px_rgba(15,23,42,0.1)] ring-1 ring-slate-900/[0.04] transition hover:border-teal-800/15 hover:shadow-[0_28px_60px_-12px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-900/50 dark:ring-white/[0.04] dark:hover:border-teal-500/25">
                  <div className="overflow-hidden ring-1 ring-teal-900/5 dark:ring-teal-500/10">
                    <div className="scale-[1.01] transition group-hover:scale-105">
                      <HeroInitialCover
                        title={p.title}
                        imageUrl={p.coverImageUrl}
                        className="!max-h-48 !min-h-[10rem] !rounded-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/programs/${p.slug}`}
                        className="text-lg font-bold text-slate-900 transition group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-300"
                      >
                        {p.title}
                      </Link>
                      {isAdmin && !p.published ? (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                          Draft
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {p.description}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
                      <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900 dark:bg-teal-950/80 dark:text-teal-200">
                        {p._count.phases} phase{p._count.phases === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900 dark:bg-sky-950/60 dark:text-sky-200">
                        {p._count.cohorts} cohort
                        {p._count.cohorts === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/programs/${p.slug}`}
                        className="inline-flex items-center text-sm font-semibold text-sky-700 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300"
                      >
                        View program
                        <span className="ml-1 transition group-hover:translate-x-0.5" aria-hidden>
                          →
                        </span>
                      </Link>
                      {isAdmin ? (
                        <Link
                          href={`/admin/programs/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-700)] underline-offset-4 hover:underline dark:text-[var(--brand-300)]"
                        >
                          <span aria-hidden>⚙</span> Manage
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
