import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = { title: "Programs (admin)" };

export default async function AdminProgramsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const programs = await prisma.program.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { cohorts: true, phases: true } },
    },
  });

  return (
    <main className="flex-1">
      <section className="border-b border-teal-900/10 bg-gradient-to-b from-slate-50/90 to-transparent dark:border-teal-500/10 dark:from-slate-900/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Programs
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Configure program structure, cohorts, and phases. Phases may link
              to published courses and program-level assignments—without
              altering course content structure.
            </p>
          </div>
          <Link
            href="/admin/programs/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white shadow-md shadow-sky-900/10 transition hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            New program
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <ul className="space-y-4">
          {programs.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-8 py-16 text-center dark:border-slate-700 dark:bg-slate-900/30">
              <p className="font-medium text-slate-900 dark:text-white">
                No programs yet
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">
                Create a program to define phases, then add cohorts for intake
                and assignments.
              </p>
              <Link
                href="/admin/programs/new"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-500"
              >
                Create program
              </Link>
            </li>
          ) : (
            programs.map((p) => (
              <li key={p.id}>
                <article className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-teal-800/15 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-teal-500/20 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/programs/${p.id}`}
                      className="text-lg font-semibold text-slate-900 hover:text-sky-700 dark:text-white dark:hover:text-sky-300"
                    >
                      {p.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.published
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {p.published ? "Published" : "Draft"}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        {p._count.phases} phase{p._count.phases === 1 ? "" : "s"}{" "}
                        · {p._count.cohorts} cohort
                        {p._count.cohorts === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                    <Link
                      href={`/admin/programs/${p.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-teal-800 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500"
                    >
                      Manage
                    </Link>
                    <Link
                      href={`/programs/${p.slug}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Public view
                    </Link>
                  </div>
                </article>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
