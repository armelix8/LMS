import Link from "next/link";
import { auth } from "@/auth";
import { isCohortFinishedForUser } from "@/lib/program-progress";
import { prisma } from "@/lib/prisma";
import { getUserProfileSnapshot } from "@/lib/user-display";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { name: displayName, headline: profileHeadline } =
    await getUserProfileSnapshot(session.user.id);

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: { select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE");
  const pendingEnrollments = enrollments.filter((e) => e.status === "PENDING");
  const rejectedEnrollments = enrollments.filter((e) => e.status === "REJECTED");

  const progressCounts = await prisma.lessonProgress.groupBy({
    by: ["lessonId"],
    where: { userId: session.user.id },
    _count: true,
  });
  const completedSet = new Set(progressCounts.map((p) => p.lessonId));

  const cohortRows = await prisma.cohortMember.findMany({
    where: { userId: session.user.id },
    include: {
      cohort: {
        include: { program: { select: { title: true, slug: true } } },
      },
    },
    orderBy: { appliedAt: "desc" },
  });

  const cohortFinished = await Promise.all(
    cohortRows.map(async (m) => ({
      memberId: m.id,
      finished:
        m.status === "ACTIVE"
          ? await isCohortFinishedForUser(session.user.id, m.cohort.programId)
          : false,
    })),
  );
  const finishedByMemberId = new Map(
    cohortFinished.map((x) => [x.memberId, x.finished]),
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back{displayName ? `, ${displayName}` : ""}
          </h1>
          {profileHeadline ? (
            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              {profileHeadline}
            </p>
          ) : null}
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Continue where you left off.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/programs"
            className="text-sm font-medium text-sky-700 hover:text-sky-600 dark:text-sky-400"
          >
            Programs →
          </Link>
          <Link
            href="/courses"
            className="text-sm font-medium text-sky-700 hover:text-sky-600 dark:text-sky-400"
          >
            Courses →
          </Link>
        </div>
      </div>

      {cohortRows.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            My program cohorts
          </h2>
          <ul className="mt-4 space-y-3">
            {cohortRows.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {m.cohort.program.title}
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {m.cohort.name}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                      {m.status}
                    </p>
                  </div>
                  {m.status === "ACTIVE" ? (
                    <div className="flex flex-col items-end gap-1">
                      {finishedByMemberId.get(m.id) ? (
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          Cohort complete
                        </span>
                      ) : null}
                      <Link
                        href={`/programs/${m.cohort.program.slug}/cohorts/${m.cohort.slug}`}
                        className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300"
                      >
                        View progress
                      </Link>
                    </div>
                  ) : m.status === "APPLIED" ? (
                    <span className="text-xs text-amber-700 dark:text-amber-300">
                      Pending approval
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          My courses
        </h2>
        {activeEnrollments.length === 0 &&
        pendingEnrollments.length === 0 &&
        rejectedEnrollments.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
            You have not enrolled yet.{" "}
            <Link href="/courses" className="font-medium text-indigo-600 dark:text-indigo-400">
              Explore courses
            </Link>
          </p>
        ) : null}
        {activeEnrollments.length > 0 ? (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {activeEnrollments.map(({ course }) => {
              const totalLessons = course.modules.reduce(
                (n, m) => n + m.lessons.length,
                0,
              );
              const completed = course.modules.reduce(
                (n, m) =>
                  n +
                  m.lessons.filter((l) => completedSet.has(l.id)).length,
                0,
              );
              const pct =
                totalLessons === 0
                  ? 0
                  : Math.round((completed / totalLessons) * 100);
              const courseDone =
                totalLessons > 0 && completed === totalLessons;

              return (
                <li
                  key={course.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/learn/${course.slug}`}
                      className="text-lg font-semibold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                    >
                      {course.title}
                    </Link>
                    {courseDone && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200"
                        title="All lessons completed"
                      >
                        <span aria-hidden>✓</span> Completed
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {completed} / {totalLessons} lessons · {pct}%
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
        {pendingEnrollments.length > 0 && (
          <div className="mt-10">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Awaiting instructor approval
            </h3>
            <ul className="mt-3 space-y-3">
              {pendingEnrollments.map(({ course }) => (
                <li
                  key={course.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30"
                >
                  <Link
                    href={`/courses/${course.slug}`}
                    className="font-medium text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                  >
                    {course.title}
                  </Link>
                  <p className="mt-1 text-xs text-amber-900 dark:text-amber-200/90">
                    You will get access after the instructor approves your
                    enrollment.
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {rejectedEnrollments.length > 0 && (
          <div className="mt-10">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Not approved
            </h3>
            <ul className="mt-3 space-y-3">
              {rejectedEnrollments.map(({ course }) => (
                <li
                  key={course.id}
                  className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30"
                >
                  <Link
                    href={`/courses/${course.slug}`}
                    className="font-medium text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                  >
                    {course.title}
                  </Link>
                  <p className="mt-1 text-xs text-red-900 dark:text-red-200/90">
                    You can open the course page to request enrollment again.
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
