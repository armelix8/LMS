import Link from "next/link";
import { auth } from "@/auth";
import { isDatabaseUnavailableError } from "@/lib/database-error";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Instructor" };

export default async function InstructorHomePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  let courseCount = 0;
  let publishedCount = 0;
  let activeEnrollmentAgg = 0;
  let pendingEnrollmentAgg = 0;
  let databaseUnavailable = false;

  try {
    const results = await Promise.all([
      prisma.course.count({
        where: isAdmin ? {} : { instructorId: userId },
      }),
      prisma.course.count({
        where: {
          published: true,
          ...(isAdmin ? {} : { instructorId: userId }),
        },
      }),
      prisma.enrollment.count({
        where: {
          status: "ACTIVE",
          course: isAdmin ? {} : { instructorId: userId },
        },
      }),
      prisma.enrollment.count({
        where: {
          status: "PENDING",
          course: isAdmin ? {} : { instructorId: userId },
        },
      }),
    ]);
    [courseCount, publishedCount, activeEnrollmentAgg, pendingEnrollmentAgg] =
      results;
  } catch (e) {
    if (isDatabaseUnavailableError(e)) {
      databaseUnavailable = true;
    } else {
      throw e;
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      {databaseUnavailable && (
        <div
          className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          <p className="font-semibold">Could not load dashboard stats</p>
          <p className="mt-2 text-amber-900/90 dark:text-amber-200/90">
            The app cannot reach PostgreSQL (
            <code className="rounded bg-amber-100/80 px-1 font-mono text-xs dark:bg-amber-900/50">
              DATABASE_URL
            </code>
            ). Check VPN or network, confirm the server at your host is up, or
            use a local database for development.
          </p>
          <p className="mt-2 text-xs text-amber-800/90 dark:text-amber-300/80">
            Counts below show “—” until the database is reachable. Refresh this
            page after VPN or network is fixed.
          </p>
        </div>
      )}
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Instructor console
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Build courses, publish when ready, and reach your learners.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Courses</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {databaseUnavailable ? "—" : courseCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Published
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {databaseUnavailable ? "—" : publishedCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Active learners
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {databaseUnavailable ? "—" : activeEnrollmentAgg}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pending enrollment requests
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {databaseUnavailable ? "—" : pendingEnrollmentAgg}
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/instructor/courses"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Manage courses
        </Link>
        <Link
          href="/instructor/courses/new"
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          New course
        </Link>
        {isAdmin ? (
          <Link
            href="/admin/programs"
            className="rounded-xl border border-teal-600/40 bg-teal-50 px-5 py-2.5 text-sm font-semibold text-teal-900 hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-950/40 dark:text-teal-100 dark:hover:bg-teal-950/70"
          >
            Programs & cohorts (admin)
          </Link>
        ) : null}
      </div>
    </main>
  );
}
