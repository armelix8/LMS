import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { auth } from "@/auth";
import { CourseFeaturedImage } from "@/components/course-featured-image";
import {
  InstructorPageShell,
  InstructorPageTitle,
  instructorPrimaryButtonClass,
} from "@/components/instructor-page-chrome";
import { isDatabaseUnavailableError } from "@/lib/database-error";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Courses" };

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

  const pageEyebrow = isAdmin ? "Admin" : "Instructor";
  const pageTitle = isAdmin ? "Manage all courses" : "Manage your courses";
  const pageDescription = isAdmin
    ? "View and edit every course in the system. Create new courses, add lessons and assessments, and review learner work."
    : "Create and publish your courses. Add quizzes and assignments on each lesson, then review learner work from the course or lesson editor.";

  return (
    <InstructorPageShell maxWidthClass="max-w-6xl">
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
      <InstructorPageTitle
        eyebrow={pageEyebrow}
        title={pageTitle}
        description={pageDescription}
        actions={
          <Link href="/instructor/courses/new" className={instructorPrimaryButtonClass}>
            New course
          </Link>
        }
      />

      <ul className="mt-10 divide-y divide-slate-200/90 rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/50 dark:ring-white/[0.04]">
        {courses.map((c) => {
          const pending = pendingByCourseId.get(c.id) ?? 0;
          const enrollmentRequests = enrollmentRequestsByCourseId.get(c.id) ?? 0;
          return (
            <li
              key={c.id}
              className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
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
    </InstructorPageShell>
  );
}
