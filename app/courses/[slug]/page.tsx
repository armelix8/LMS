import Link from "next/link";
import { notFound } from "next/navigation";
import { enrollInCourse } from "@/app/actions/lms";
import { auth } from "@/auth";
import { CourseFeaturedImage } from "@/components/course-featured-image";
import { isCourseFullyCompletedByUser } from "@/lib/course-completion";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ enrollment?: string }>;
};

export async function generateMetadata({ params }: Props) {
  try {
    const { slug } = await params;
    const course = await prisma.course.findUnique({
      where: { slug },
      select: {
        title: true,
        thumbnail: true,
        published: true,
        instructorId: true,
        id: true,
      },
    });
    if (!course) return { title: "Course" };

    const session = await auth();
    let visible = course.published;
    if (!visible && session?.user) {
      if (
        session.user.role === "ADMIN" ||
        session.user.id === course.instructorId
      ) {
        visible = true;
      } else {
        const e = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId: course.id,
            },
          },
          select: { status: true },
        });
        visible = e?.status === "ACTIVE";
      }
    }
    if (!visible) return { title: "Course" };

    const t = course.title;
    const thumb = course.thumbnail?.trim();
    return {
      title: t,
      ...(thumb
        ? {
            openGraph: {
              images: [{ url: thumb }],
            },
          }
        : {}),
    };
  } catch {
    return { title: "Course" };
  }
}

export default async function CourseDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const session = await auth();

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      instructor: { select: { name: true, email: true } },
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!course) notFound();

  const isInstructorOwner =
    session?.user?.id != null && session.user.id === course.instructorId;
  const isAdmin = session?.user?.role === "ADMIN";

  const enrollment = session?.user
    ? await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId: session.user.id, courseId: course.id },
        },
      })
    : null;

  if (!course.published) {
    const canSeeUnpublished =
      isAdmin ||
      isInstructorOwner ||
      enrollment?.status === "ACTIVE";
    if (!canSeeUnpublished) notFound();
  }

  const allLessonIds = course.modules.flatMap((m) =>
    m.lessons.map((l) => l.id),
  );
  const courseCompleted =
    enrollment?.status === "ACTIVE" &&
    !!session?.user &&
    (await isCourseFullyCompletedByUser(allLessonIds, session.user.id));

  const enroll = enrollInCourse.bind(null, course.id);
  const lessonCount = allLessonIds.length;

  const enrollmentNotice =
    sp.enrollment === "pending"
      ? "pending"
      : sp.enrollment === "rejected"
        ? "rejected"
        : null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      {enrollmentNotice === "pending" && (
        <p
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          Your enrollment is waiting for the instructor to approve it. You will
          get access to lessons once approved.
        </p>
      )}
      {enrollmentNotice === "rejected" && (
        <p
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
          role="status"
        >
          Your enrollment request was not approved. You can submit a new request
          below if the instructor allows it.
        </p>
      )}
      <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
        <div className="max-w-3xl">
          <CourseFeaturedImage
            src={course.thumbnail}
            alt={`${course.title} cover`}
            variant="hero"
            className="mb-6"
          />
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Course
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {course.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isInstructorOwner ? (
              <>
                <span className="font-medium text-violet-700 dark:text-violet-300">
                  You are teaching this course
                </span>
                <span className="text-slate-400"> · </span>
                Catalog preview (learners see this page)
              </>
            ) : (
              <>
                Instructor:{" "}
                {course.instructor.name ?? course.instructor.email}
              </>
            )}
          </p>
          <p className="mt-6 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
            {course.description}
          </p>
        </div>
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 lg:w-80">
          {isInstructorOwner ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                Instructor
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage content, see learners, and review submissions from here.
              </p>
              <Link
                href={`/instructor/courses/${course.id}`}
                className="flex w-full items-center justify-center rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500"
              >
                Edit course
              </Link>
              <Link
                href={`/instructor/courses/${course.id}/students`}
                className="flex w-full items-center justify-center rounded-xl border border-violet-200 bg-violet-50 py-3 text-sm font-semibold text-violet-900 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:bg-violet-950/70"
              >
                Students & progress
              </Link>
              {lessonCount > 0 ? (
                <Link
                  href={`/learn/${course.slug}`}
                  className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Preview as learner
                </Link>
              ) : null}
              {enrollment?.status === "ACTIVE" && (
                <p className="border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  You are also enrolled
                  {courseCompleted ? " · completed" : ""}.{" "}
                  <Link
                    href={`/learn/${course.slug}`}
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Open learner view
                  </Link>
                </p>
              )}
            </div>
          ) : enrollment?.status === "ACTIVE" ? (
            courseCompleted ? (
              <>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  You are enrolled.
                </p>
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white"
                    aria-hidden
                  >
                    ✓
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      Course completed
                    </p>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80">
                      All lessons finished.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/learn/${course.slug}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Review course
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  You are enrolled.
                </p>
                <Link
                  href={`/learn/${course.slug}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Continue learning
                </Link>
              </>
            )
          ) : enrollment?.status === "PENDING" ? (
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Enrollment pending approval
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                The instructor will review your request. Lesson access opens
                after approval.
              </p>
            </div>
          ) : enrollment?.status === "REJECTED" ? (
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Enrollment not approved
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {course.published
                  ? "You can submit a new request if you would like to try again."
                  : "This course is not open for public enrollment."}
              </p>
              {course.published ? (
                <form action={enroll} className="mt-4">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Request enrollment again
                  </button>
                </form>
              ) : null}
            </div>
          ) : session?.user && course.published ? (
            <form action={enroll}>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Request access. Your instructor must approve you before you can
                open lessons.
              </p>
              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Request to enroll
              </button>
            </form>
          ) : session?.user ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This course is not open for public enrollment.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sign in to enroll and save your progress.
              </p>
              <Link
                href={`/auth/signin?callbackUrl=/courses/${slug}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Sign in to enroll
              </Link>
            </>
          )}
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Curriculum
        </h2>
        <ol className="mt-6 space-y-8">
          {course.modules.map((mod, mi) => (
            <li key={mod.id}>
              <h3 className="font-medium text-slate-800 dark:text-slate-200">
                Module {mi + 1}: {mod.title}
              </h3>
              <ul className="mt-3 space-y-2 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                {mod.lessons.map((lesson, li) => (
                  <li
                    key={lesson.id}
                    className="text-sm text-slate-600 dark:text-slate-400"
                  >
                    {li + 1}. {lesson.title}
                    {lesson.durationMin != null && (
                      <span className="ml-2 text-slate-400">
                        · {lesson.durationMin} min
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
