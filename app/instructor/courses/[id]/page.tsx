import Link from "next/link";
import { notFound } from "next/navigation";
import {
  approveEnrollment,
  createLesson,
  createModule,
  deleteCourse,
  rejectEnrollment,
  updateCourse,
} from "@/app/actions/lms";
import { CourseFeaturedImage } from "@/components/course-featured-image";
import { DeleteCourseForm } from "./delete-course-form";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; reason?: string }>;
};

export async function generateMetadata({ params }: Props) {
  try {
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      select: { title: true },
    });
    return { title: course ? `Edit · ${course.title}` : "Course" };
  } catch {
    return { title: "Course" };
  }
}

export default async function EditCoursePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, reason } = await searchParams;
  const courseImageError =
    error === "invalid-course-image"
      ? reason === "size"
        ? "Cover image must be 10 MB or smaller."
        : "Cover image must be PNG, JPG, WebP, or GIF."
      : error === "invalid-thumbnail"
        ? "Featured image URL must be valid https, or leave the field blank to keep the current image."
        : null;
  const session = await auth();
  if (!session?.user?.id) return null;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: {
              quiz: {
                select: {
                  id: true,
                  requiredForCompletion: true,
                  _count: { select: { questions: true } },
                },
              },
              assignments: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  title: true,
                  responseType: true,
                  requiredForCompletion: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

  const pendingSubmissions = await prisma.assignmentSubmission.findMany({
    where: {
      reviewStatus: "PENDING",
      assignment: { lessonId: { in: lessonIds } },
    },
    select: { assignmentId: true },
  });
  const pendingByAssignment = new Map<string, number>();
  for (const row of pendingSubmissions) {
    pendingByAssignment.set(
      row.assignmentId,
      (pendingByAssignment.get(row.assignmentId) ?? 0) + 1,
    );
  }

  let lessonCount = 0;
  let quizCount = 0;
  let assignmentCount = 0;
  let pendingReviewTotal = 0;
  for (const mod of course.modules) {
    for (const les of mod.lessons) {
      lessonCount += 1;
      if (les.quiz) quizCount += 1;
      for (const a of les.assignments) {
        assignmentCount += 1;
        pendingReviewTotal += pendingByAssignment.get(a.id) ?? 0;
      }
    }
  }
  if (
    session.user.role !== "ADMIN" &&
    course.instructorId !== session.user.id
  ) {
    notFound();
  }

  const pendingEnrollments = await prisma.enrollment.findMany({
    where: { courseId: id, status: "PENDING" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { enrolledAt: "asc" },
  });

  async function saveCourse(formData: FormData) {
    "use server";
    await updateCourse(id, formData);
  }

  async function addModule(formData: FormData) {
    "use server";
    const title = String(formData.get("title") ?? "");
    await createModule(id, title);
  }

  async function addLesson(moduleId: string, formData: FormData) {
    "use server";
    const title = String(formData.get("title") ?? "");
    await createLesson(moduleId, title);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/instructor/courses" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Courses
        </Link>
        <span>/</span>
        <span>Edit</span>
      </div>

      {courseImageError && (
        <p
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          {courseImageError}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
          <CourseFeaturedImage
            src={course.thumbnail}
            alt={`${course.title} cover`}
            variant="list"
            className="sm:mt-1"
          />
          <h1 className="min-w-0 text-3xl font-bold text-slate-900 dark:text-white">
            {course.title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/instructor/courses/${id}/students`}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-950"
          >
            Students & progress
          </Link>
          {course.published && (
            <>
              <Link
                href={`/courses/${course.slug}`}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Catalog preview
              </Link>
              {lessonCount > 0 && (
                <Link
                  href={`/learn/${course.slug}`}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-950"
                >
                  Learner view
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
            Structure
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {course.modules.length} modules · {lessonCount} lessons
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
            Quizzes
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {quizCount} configured
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
            Assignments
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {assignmentCount} configured
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
            Reviews
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {pendingReviewTotal} submission
            {pendingReviewTotal === 1 ? "" : "s"} pending
          </p>
        </div>
      </div>

      {pendingEnrollments.length > 0 && (
        <section
          className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/90 px-5 py-4 dark:border-amber-900/50 dark:bg-amber-950/30"
          aria-labelledby="pending-enrollments-heading"
        >
          <h2
            id="pending-enrollments-heading"
            className="text-lg font-semibold text-amber-950 dark:text-amber-100"
          >
            Enrollment requests ({pendingEnrollments.length})
          </h2>
          <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/80">
            Approve learners to grant access to lessons and course messages.
          </p>
          <ul className="mt-4 divide-y divide-amber-200/80 dark:divide-amber-900/50">
            {pendingEnrollments.map((en) => {
              const approve = approveEnrollment.bind(null, en.id);
              const reject = rejectEnrollment.bind(null, en.id);
              const label = en.user.name?.trim() || en.user.email;
              return (
                <li
                  key={en.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {label}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {en.user.email} · Requested{" "}
                      {en.enrolledAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={approve}>
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={reject}>
                      <button
                        type="submit"
                        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
        <span className="font-medium text-slate-800 dark:text-slate-200">
          On each lesson
        </span>{" "}
        you can add a multiple-choice quiz (optional pass threshold, required for
        completion), one or more assignments as{" "}
        <strong className="font-medium">text</strong> or{" "}
        <strong className="font-medium">file upload</strong>, and approve or reject
        submissions. Open a lesson below to edit content and assessments.
      </p>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Course details
        </h2>
        <form action={saveCourse} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={course.title}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              defaultValue={course.description}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="thumbnailFile"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Featured image from computer
            </label>
            <input
              id="thumbnailFile"
              name="thumbnailFile"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-950/50 dark:file:text-indigo-200"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              PNG, JPG, WebP, or GIF — max 10 MB. Replaces the current cover.
            </p>
          </div>
          <div>
            <label
              htmlFor="thumbnail"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Or featured image URL
            </label>
            <input
              id="thumbnail"
              name="thumbnail"
              type="url"
              placeholder="https://…"
              defaultValue={
                course.thumbnail?.startsWith("/uploads/")
                  ? ""
                  : (course.thumbnail ?? "")
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              External image link. Leave blank to keep the current image when
              editing other fields.
            </p>
          </div>
          {course.thumbnail ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                name="removeThumbnail"
                className="rounded border-slate-300"
              />
              Remove featured image
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              name="published"
              defaultChecked={course.published}
              className="rounded border-slate-300"
            />
            Published (visible in catalog)
          </label>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Save changes
          </button>
        </form>

        <div className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
            Danger zone
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Permanently remove this course, all of its content, learner
            enrollments, and every submission. This action cannot be undone.
          </p>
          <DeleteCourseForm
            deleteAction={deleteCourse.bind(null, id)}
            courseTitle={course.title}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Modules & lessons
        </h2>

        <form action={addModule} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="modTitle" className="sr-only">
              New module title
            </label>
            <input
              id="modTitle"
              name="title"
              placeholder="New module title"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            Add module
          </button>
        </form>

        <ol className="mt-8 space-y-8">
          {course.modules.map((mod, mi) => (
            <li
              key={mod.id}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <p className="font-semibold text-slate-900 dark:text-white">
                Module {mi + 1}: {mod.title}
              </p>
              <ul className="mt-3 space-y-3">
                {mod.lessons.map((lesson) => {
                  const pend = lesson.assignments.reduce(
                    (sum, a) =>
                      sum + (pendingByAssignment.get(a.id) ?? 0),
                    0,
                  );
                  return (
                    <li
                      key={lesson.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/30"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/instructor/courses/${id}/lessons/${lesson.id}`}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                          >
                            {lesson.title}
                          </Link>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {lesson.quiz ? (
                              <span className="inline-flex items-center rounded-md bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900 dark:bg-violet-950/60 dark:text-violet-200">
                                Quiz · {lesson.quiz._count.questions} Q
                                {lesson.quiz.requiredForCompletion
                                  ? " · req."
                                  : ""}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                No quiz
                              </span>
                            )}
                            {lesson.assignments.length > 0 ? (
                              <span className="inline-flex flex-wrap items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                                {lesson.assignments.length} assignment
                                {lesson.assignments.length === 1 ? "" : "s"}
                                {lesson.assignments.some(
                                  (a) => a.requiredForCompletion,
                                )
                                  ? " · req."
                                  : ""}
                                {pend ? (
                                  <span className="font-semibold text-amber-950 dark:text-amber-100">
                                    · {pend} to review
                                  </span>
                                ) : null}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                No assignments
                              </span>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/instructor/courses/${id}/lessons/${lesson.id}`}
                          className="shrink-0 text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                        >
                          Edit lesson →
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <form
                action={addLesson.bind(null, mod.id)}
                className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <label htmlFor={`lesson-${mod.id}`} className="sr-only">
                    Lesson title
                  </label>
                  <input
                    id={`lesson-${mod.id}`}
                    name="title"
                    placeholder="New lesson title"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Add lesson
                </button>
              </form>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
