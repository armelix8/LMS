import Link from "next/link";
import { notFound } from "next/navigation";
import { enrollInCourse } from "@/app/actions/lms";
import { auth } from "@/auth";
import {
  CourseMetaStat,
  formatCourseDuration,
  IconBook,
  IconClock,
  IconLayers,
} from "@/components/course-detail-meta";
import { CourseFeaturedImage } from "@/components/course-featured-image";
import { HeroInitialCover } from "@/components/hero-initial-cover";
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
  const moduleCount = course.modules.length;
  const totalDurationMin = course.modules.reduce(
    (acc, m) =>
      acc +
      m.lessons.reduce((a, l) => a + (l.durationMin ?? 0), 0),
    0,
  );

  const enrollmentNotice =
    sp.enrollment === "pending"
      ? "pending"
      : sp.enrollment === "rejected"
        ? "rejected"
        : null;

  const instructorName =
    course.instructor.name ?? course.instructor.email ?? "Instructor";

  return (
    <main className="flex-1">
      {enrollmentNotice === "pending" && (
        <div className="border-b border-amber-200/80 bg-amber-50/90 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p
            className="mx-auto max-w-7xl px-4 py-3 text-sm text-amber-950 dark:text-amber-100 sm:px-6 lg:px-8"
            role="status"
          >
            Your enrollment is waiting for the instructor to approve it. You will
            get access to lessons once approved.
          </p>
        </div>
      )}
      {enrollmentNotice === "rejected" && (
        <div className="border-b border-red-200/80 bg-red-50/90 dark:border-red-900/40 dark:bg-red-950/30">
          <p
            className="mx-auto max-w-7xl px-4 py-3 text-sm text-red-950 dark:text-red-100 sm:px-6 lg:px-8"
            role="status"
          >
            Your enrollment request was not approved. You can submit a new request
            below if the instructor allows it.
          </p>
        </div>
      )}

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
                  href="/courses"
                  className="font-medium transition hover:text-teal-700 dark:hover:text-teal-300"
                >
                  Courses
                </Link>
              </li>
              <li aria-hidden className="text-slate-300 dark:text-slate-600">
                /
              </li>
              <li className="max-w-[min(100%,42rem)] truncate font-semibold text-slate-800 dark:text-slate-100">
                {course.title}
              </li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_min(100%,22rem)] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0">
              <div className="overflow-hidden rounded-[1.75rem] shadow-[0_25px_50px_-12px_rgba(15,118,110,0.18)] ring-1 ring-teal-900/10 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] dark:ring-teal-500/20">
                {course.thumbnail?.trim() ? (
                  <CourseFeaturedImage
                    src={course.thumbnail}
                    alt={`${course.title} cover`}
                    variant="hero"
                  />
                ) : (
                  <HeroInitialCover title={course.title} />
                )}
              </div>

              <div className="mt-8 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-teal-200/80 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-900 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200">
                    Course
                  </span>
                  {!course.published && (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                      Draft
                    </span>
                  )}
                </div>

                <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1] dark:text-white">
                  {course.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 py-1 pl-1 pr-3 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900/80 dark:ring-slate-700">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-sky-600 text-xs font-bold text-white">
                      {instructorName.slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      {isInstructorOwner ? (
                        <>
                          <span className="font-semibold text-violet-700 dark:text-violet-300">
                            You teach this course
                          </span>
                          <span className="text-slate-400"> · </span>
                          <span className="text-slate-500">Catalog preview</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-500">Instructor</span>{" "}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {instructorName}
                          </span>
                        </>
                      )}
                    </span>
                  </span>
                </div>

                <div className="prose prose-slate max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-300">
                  <p className="whitespace-pre-wrap text-base">
                    {course.description}
                  </p>
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24">
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_22px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04] dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.35)] dark:ring-white/[0.06]">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Course details
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Key facts before you enroll.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <CourseMetaStat
                    label="Modules"
                    value={String(moduleCount)}
                    icon={<IconLayers />}
                  />
                  <CourseMetaStat
                    label="Lessons"
                    value={String(lessonCount)}
                    icon={<IconBook />}
                  />
                  <CourseMetaStat
                    label="Est. duration"
                    value={formatCourseDuration(totalDurationMin)}
                    icon={<IconClock />}
                  />
                </div>

                <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                  {isInstructorOwner ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                        Instructor
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Manage content, see learners, and review submissions from
                        here.
                      </p>
                      <Link
                        href={`/instructor/courses/${course.id}`}
                        className="flex w-full items-center justify-center rounded-2xl bg-violet-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
                      >
                        Edit course
                      </Link>
                      <Link
                        href={`/instructor/courses/${course.id}/students`}
                        className="flex w-full items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 py-3.5 text-sm font-semibold text-violet-900 transition hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:bg-violet-950/70"
                      >
                        Students & progress
                      </Link>
                      {lessonCount > 0 ? (
                        <Link
                          href={`/learn/${course.slug}`}
                          className="flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
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
                            className="font-medium text-sky-600 hover:underline dark:text-sky-400"
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
                        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white"
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
                          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
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
                          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-teal-500"
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
                        The instructor will review your request. Lesson access
                        opens after approval.
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
                            className="w-full rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-teal-500"
                          >
                            Request enrollment again
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : session?.user && course.published ? (
                    <form action={enroll}>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Request access. Your instructor must approve you before
                        you can open lessons.
                      </p>
                      <button
                        type="submit"
                        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-teal-500"
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
                        className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-teal-500"
                      >
                        Sign in to enroll
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <section aria-labelledby="curriculum-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="curriculum-heading"
                className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Curriculum
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                Structured modules and lessons included in this course.
              </p>
            </div>
          </div>

          <ol className="mt-10 space-y-5">
            {course.modules.map((mod, mi) => (
              <li key={mod.id}>
                <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700 dark:bg-slate-900/40 dark:ring-white/[0.04]">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-teal-50/30 px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-teal-950/20">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      <span className="mr-2 text-sky-600 dark:text-sky-400">
                        {String(mi + 1).padStart(2, "0")}
                      </span>
                      {mod.title}
                    </h3>
                  </div>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mod.lessons.map((lesson, li) => (
                      <li
                        key={lesson.id}
                        className="flex items-start gap-4 px-5 py-3.5 text-sm"
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {li + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {lesson.title}
                          </p>
                          {lesson.durationMin != null && (
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
                              {lesson.durationMin} min
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
