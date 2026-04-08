import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { auth } from "@/auth";
import { CourseFeaturedImage } from "@/components/course-featured-image";
import { isDatabaseUnavailableError } from "@/lib/database-error";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "My courses" };

const courseListInclude = {
  _count: {
    select: {
      enrollments: { where: { status: "ACTIVE" as const } },
    },
  },
} satisfies Prisma.CourseInclude;

type InstructorCourseRow = Prisma.CourseGetPayload<{
  include: typeof courseListInclude;
}>;

export default async function InstructorCoursesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const isAdmin = session.user.role === "ADMIN";

  let courses: InstructorCourseRow[] = [];
  const enrollmentRequestsByCourseId = new Map<string, number>();
  const pendingByCourseId = new Map<string, number>();
  let databaseUnavailable = false;

  try {
    courses = await prisma.course.findMany({
      where: isAdmin ? {} : { instructorId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: courseListInclude,
    });

    const courseIds = courses.map((c) => c.id);
    const enrollmentRequestRows =
      courseIds.length > 0
        ? await prisma.enrollment.groupBy({
            by: ["courseId"],
            where: {
              status: "PENDING",
              courseId: { in: courseIds },
            },
            _count: { _all: true },
          })
        : [];
    for (const r of enrollmentRequestRows) {
      enrollmentRequestsByCourseId.set(r.courseId, r._count._all);
    }

    if (courseIds.length > 0) {
      const pendingRows = await prisma.assignmentSubmission.findMany({
        where: {
          reviewStatus: "PENDING",
          assignment: {
            lesson: { module: { courseId: { in: courseIds } } },
          },
        },
        select: {
          assignment: {
            select: {
              lesson: { select: { module: { select: { courseId: true } } } },
            },
          },
        },
      });
      for (const row of pendingRows) {
        const cid = row.assignment.lesson.module.courseId;
        pendingByCourseId.set(cid, (pendingByCourseId.get(cid) ?? 0) + 1);
      }
    }
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
          <p className="font-semibold">Could not load courses</p>
          <p className="mt-2 text-amber-900/90 dark:text-amber-200/90">
            The database connection was lost or PostgreSQL is unreachable (
            <code className="rounded bg-amber-100/80 px-1 font-mono text-xs dark:bg-amber-900/50">
              DATABASE_URL
            </code>
            ). Check VPN, network stability, and that the server is still
            accepting connections.
          </p>
          <p className="mt-2 text-xs text-amber-800/90 dark:text-amber-300/80">
            Refresh after connectivity is restored.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Courses
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Draft and publish courses. Configure quizzes and assignments (text or
            file) on each lesson, then review submissions.
          </p>
        </div>
        <Link
          href="/instructor/courses/new"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          New course
        </Link>
      </div>

      <ul className="mt-10 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/50">
        {courses.map((c) => {
          const pending = pendingByCourseId.get(c.id) ?? 0;
          const enrollmentRequests = enrollmentRequestsByCourseId.get(c.id) ?? 0;
          return (
            <li
              key={c.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-1 gap-4">
                <CourseFeaturedImage
                  src={c.thumbnail}
                  alt={`${c.title} cover`}
                  variant="list"
                  className="self-start sm:self-center"
                />
                <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/instructor/courses/${c.id}`}
                    className="text-lg font-semibold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                  >
                    {c.title}
                  </Link>
                  {pending > 0 && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                      {pending} to review
                    </span>
                  )}
                  {enrollmentRequests > 0 && (
                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-900 dark:bg-sky-950/60 dark:text-sky-200">
                      {enrollmentRequests} enrollment request
                      {enrollmentRequests === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {c.published ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Published
                    </span>
                  ) : (
                    <span>Draft</span>
                  )}
                  {" · "}
                  {c._count.enrollments} active learner
                  {c._count.enrollments === 1 ? "" : "s"}
                  {c.published && (
                    <>
                      {" · "}
                      <Link
                        href={`/courses/${c.slug}`}
                        className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        View in catalog
                      </Link>
                    </>
                  )}
                </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <Link
                  href={`/instructor/courses/${c.id}/students`}
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Students
                </Link>
                <Link
                  href={`/instructor/courses/${c.id}`}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
                >
                  Edit →
                </Link>
              </div>
            </li>
          );
        })}
        {courses.length === 0 && databaseUnavailable && (
          <li className="px-5 py-12 text-center text-slate-600 dark:text-slate-400">
            Course list is unavailable until the database responds.
          </li>
        )}
        {courses.length === 0 && !databaseUnavailable && (
          <li className="px-5 py-12 text-center text-slate-600 dark:text-slate-400">
            No courses yet.{" "}
            <Link
              href="/instructor/courses/new"
              className="font-medium text-indigo-600 dark:text-indigo-400"
            >
              Create your first course
            </Link>
          </li>
        )}
      </ul>
    </main>
  );
}
