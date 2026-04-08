import Link from "next/link";
import { auth } from "@/auth";
import { CourseFeaturedImage } from "@/components/course-featured-image";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
    include: {
      instructor: { select: { name: true, email: true } },
      modules: {
        include: { lessons: { select: { id: true } } },
      },
    },
  });

  const courseIds = courses.map((c) => c.id);

  const enrolledRows =
    userId && courseIds.length > 0
      ? await prisma.enrollment.findMany({
          where: { userId, courseId: { in: courseIds } },
          select: { courseId: true, status: true },
        })
      : [];
  const enrollmentStatusByCourseId = new Map(
    enrolledRows.map((e) => [e.courseId, e.status]),
  );

  const allLessonIds = courses.flatMap((c) =>
    c.modules.flatMap((m) => m.lessons.map((l) => l.id)),
  );

  const progressRows =
    userId && allLessonIds.length > 0
      ? await prisma.lessonProgress.findMany({
          where: { userId, lessonId: { in: allLessonIds } },
          select: { lessonId: true },
        })
      : [];
  const completedLessonIds = new Set(progressRows.map((p) => p.lessonId));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Course catalog
      </h1>
      <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
        Published programs open for enrollment. Sign in to join a course and
        track your progress. Your own courses show instructor shortcuts.
      </p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const isOwner = userId && course.instructorId === userId;
          const lessons = course.modules.reduce(
            (n, m) => n + m.lessons.length,
            0,
          );
          const enrollmentStatus = userId
            ? enrollmentStatusByCourseId.get(course.id)
            : undefined;
          const enrolledActive = enrollmentStatus === "ACTIVE";
          const enrolledPending = enrollmentStatus === "PENDING";
          const completedLessons = course.modules.reduce(
            (n, m) =>
              n +
              m.lessons.filter((l) => completedLessonIds.has(l.id)).length,
            0,
          );
          const courseCompleted =
            enrolledActive && lessons > 0 && completedLessons === lessons;

          return (
            <li key={course.id}>
              <div
                className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md dark:bg-slate-900/50 ${
                  isOwner
                    ? "border-violet-200 hover:border-violet-300 dark:border-violet-900 dark:hover:border-violet-800"
                    : "border-slate-200 hover:border-indigo-200 dark:border-slate-800 dark:hover:border-indigo-900"
                }`}
              >
                <CourseFeaturedImage
                  src={course.thumbnail}
                  alt={`${course.title} cover`}
                  variant="card"
                />
                <Link
                  href={`/courses/${course.slug}`}
                  className="group flex flex-1 flex-col p-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                      {course.title}
                    </h2>
                    {isOwner && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-900 dark:bg-violet-950/60 dark:text-violet-200">
                        Your course
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {course.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                    <span>
                      {course.instructor.name ?? course.instructor.email}
                    </span>
                    <span>{lessons} lessons</span>
                  </div>
                </Link>
                {isOwner && (
                  <div className="border-t border-violet-100 px-6 py-3 dark:border-violet-900/50">
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                      <Link
                        href={`/instructor/courses/${course.id}`}
                        className="font-semibold text-violet-700 hover:text-violet-600 dark:text-violet-300 dark:hover:text-violet-200"
                      >
                        Edit course
                      </Link>
                      <Link
                        href={`/instructor/courses/${course.id}/students`}
                        className="font-semibold text-violet-700 hover:text-violet-600 dark:text-violet-300 dark:hover:text-violet-200"
                      >
                        Students
                      </Link>
                    </div>
                  </div>
                )}
                {(enrolledActive || enrolledPending) && (
                  <div className="border-t border-slate-100 px-6 py-3 dark:border-slate-800">
                    {enrolledPending ? (
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Enrollment pending instructor approval
                      </span>
                    ) : courseCompleted ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                        title="All lessons completed"
                      >
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
                          aria-hidden
                        >
                          ✓
                        </span>
                        Completed
                      </span>
                    ) : (
                      <Link
                        href={`/learn/${course.slug}`}
                        className="inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Continue learning →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {courses.length === 0 && (
        <p className="mt-12 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
          No published courses yet. Instructors can create content from the
          instructor console.
        </p>
      )}
    </main>
  );
}
