import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Programs" };

const inputFocus =
  "focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:focus:ring-sky-400/30";

export default async function ProgramsPage() {
  const programs = await prisma.program.findMany({
    where: { published: true },
    orderBy: { title: "asc" },
    include: {
      _count: { select: { phases: true, cohorts: true } },
    },
  });

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-teal-900/[0.08] dark:border-teal-400/10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.14),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.1),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800/90 dark:text-teal-300/90">
            UniPod Learn
          </p>
          <h1 className="mt-3 max-w-2xl text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Programs & cohorts
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Multi-phase learning paths with structured cohorts. Browse offerings
            below, then join a cohort when applications are open or continue
            your progress from the dashboard.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {programs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300/90 bg-white/60 px-8 py-16 text-center dark:border-slate-700 dark:bg-slate-900/30">
            <p className="text-lg font-medium text-slate-900 dark:text-white">
              No programs are published yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              When your institution publishes a program, it will appear here
              with cohorts you can apply to.
            </p>
            <Link
              href="/courses"
              className={`mt-8 inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal-700/20 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-800/80 ${inputFocus}`}
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2">
            {programs.map((p) => (
              <li key={p.id}>
                <article className="group flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_0_rgba(15,118,110,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)] transition hover:border-teal-800/15 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-teal-500/20">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      href={`/programs/${p.slug}`}
                      className="text-lg font-semibold text-slate-900 transition group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-300"
                    >
                      {p.title}
                    </Link>
                  </div>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {p.description}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                    <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-900 dark:bg-teal-950/80 dark:text-teal-200">
                      {p._count.phases} phase{p._count.phases === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-900 dark:bg-sky-950/60 dark:text-sky-200">
                      {p._count.cohorts} cohort
                      {p._count.cohorts === 1 ? "" : "s"}
                    </span>
                  </div>
                  <Link
                    href={`/programs/${p.slug}`}
                    className="mt-4 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300"
                  >
                    View program →
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
