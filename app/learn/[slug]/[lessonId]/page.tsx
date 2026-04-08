import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sendCourseMessage } from "@/app/actions/course-messages";
import { AssignmentSubmission } from "@/components/assignment-submission";
import { CourseCompletedBanner } from "@/components/course-completed-banner";
import {
  LessonAutoCompleteWhenLast,
  LessonNavigationBar,
} from "@/components/lesson-navigation";
import { CourseFeaturedImage } from "@/components/course-featured-image";
import { LessonBlockNoteViewLoader } from "@/components/lesson-block-note-view-loader";
import { LessonVideoEmbed } from "@/components/lesson-video-embed";
import { MarkdownContent } from "@/components/markdown-content";
import { isBlockNoteContent } from "@/lib/lesson-blocknote";
import { QuizTaker } from "@/components/quiz-taker";
import { LearnerCourseProgressBar } from "@/components/learner-course-progress-bar";
import { LessonMessagesChat } from "@/components/lesson-messages-chat";
import { auth } from "@/auth";
import { toCourseChatMessageVMs } from "@/lib/course-chat";
import { countUnreadMessagesForStudent } from "@/lib/course-message-unread";
import { isCourseFullyCompletedByUser } from "@/lib/course-completion";
import { getLessonCompletionBlockers } from "@/lib/lesson-completion";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string; lessonId: string }> };

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/auth/signin?callbackUrl=/learn/${slug}/${lessonId}`);

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: course.id },
    },
  });

  const isStaff =
    session.user.role === "ADMIN" ||
    session.user.id === course.instructorId;

  if (!isStaff) {
    if (!enrollment) {
      if (course.published) redirect(`/courses/${slug}`);
      notFound();
    }
    if (enrollment.status !== "ACTIVE") {
      redirect(
        `/courses/${slug}?enrollment=${
          enrollment.status === "PENDING" ? "pending" : "rejected"
        }`,
      );
    }
  }

  const unreadMessagesCount =
    enrollment != null
      ? await countUnreadMessagesForStudent(
          enrollment.id,
          session.user.id,
          enrollment.studentMessagesReadAt,
        )
      : 0;

  const lessonChatRows =
    enrollment != null
      ? await prisma.courseMessage.findMany({
          where: { enrollmentId: enrollment.id },
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { name: true, email: true } },
          },
        })
      : [];
  const lessonChatMessages = toCourseChatMessageVMs(lessonChatRows);

  const lesson = course.modules
    .flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })))
    .find((l) => l.id === lessonId);

  if (!lesson) notFound();

  const progress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: { userId: session.user.id, lessonId },
    },
  });

  const quizForLearner = await prisma.quiz.findUnique({
    where: { lessonId },
    include: {
      questions: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, text: true },
          },
        },
      },
    },
  });

  const lastQuizAttempt = quizForLearner
    ? await prisma.quizAttempt.findFirst({
        where: { userId: session.user.id, quizId: quizForLearner.id },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const assignmentsForLesson = await prisma.assignment.findMany({
    where: { lessonId },
    orderBy: { sortOrder: "asc" },
  });
  const assignmentIds = assignmentsForLesson.map((a) => a.id);
  const mySubmissionsForLesson =
    assignmentIds.length > 0
      ? await prisma.assignmentSubmission.findMany({
          where: {
            userId: session.user.id,
            assignmentId: { in: assignmentIds },
          },
        })
      : [];
  const submissionByAssignmentId = new Map(
    mySubmissionsForLesson.map((s) => [s.assignmentId, s]),
  );

  const flatLessons = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      moduleTitle: m.title,
    })),
  );
  const idx = flatLessons.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? flatLessons[idx - 1] : null;
  const nextL = idx < flatLessons.length - 1 ? flatLessons[idx + 1] : null;

  const completionBlockers = progress
    ? []
    : await getLessonCompletionBlockers(lessonId, session.user.id);
  const eligibleToComplete =
    !progress && completionBlockers.length === 0;

  const allLessonIds = course.modules.flatMap((m) =>
    m.lessons.map((l) => l.id),
  );

  const completedLessonRows = await prisma.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      lessonId: { in: allLessonIds },
    },
    select: { lessonId: true },
  });
  const completedLessonIds = new Set(
    completedLessonRows.map((r) => r.lessonId),
  );
  const courseCompleted = await isCourseFullyCompletedByUser(
    allLessonIds,
    session.user.id,
  );

  const totalLessons = allLessonIds.length;
  const completedLessonCount = completedLessonIds.size;

  const isInstructorOwner = session.user.id === course.instructorId;

  const isLastLesson = !nextL;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:py-10">
      {!isInstructorOwner && (
        <LessonAutoCompleteWhenLast
          lessonId={lessonId}
          isLastLesson={isLastLesson}
          isCompleted={!!progress}
          isInstructorOwner={isInstructorOwner}
          eligibleToComplete={eligibleToComplete}
        />
      )}
      {isInstructorOwner && (
        <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-900 dark:bg-violet-950/40">
          <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
            You are viewing as the instructor (learner preview).
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link
              href={`/instructor/courses/${course.id}/lessons/${lessonId}`}
              className="font-semibold text-violet-800 underline-offset-2 hover:underline dark:text-violet-200"
            >
              Edit this lesson
            </Link>
            <Link
              href={`/instructor/courses/${course.id}/students`}
              className="font-semibold text-violet-800 underline-offset-2 hover:underline dark:text-violet-200"
            >
              Students & progress
            </Link>
            <Link
              href={`/instructor/courses/${course.id}`}
              className="font-semibold text-violet-800 underline-offset-2 hover:underline dark:text-violet-200"
            >
              Course settings
            </Link>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="lg:w-64 lg:shrink-0">
        <Link
          href={`/courses/${slug}`}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          ← {isInstructorOwner ? "Catalog preview" : "Back to course"}
        </Link>
        <CourseFeaturedImage
          src={course.thumbnail}
          alt={`${course.title} cover`}
          variant="sidebar"
          className="mt-3"
        />
        <div className="mt-4 flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Lessons
          </h2>
          {!isInstructorOwner && enrollment != null && (
            <LessonMessagesChat
              slug={slug}
              courseTitle={course.title}
              enrollmentId={enrollment.id}
              studentUserId={session.user.id}
              messages={lessonChatMessages}
              sendMessage={sendCourseMessage.bind(null, enrollment.id)}
              unreadCount={unreadMessagesCount}
            />
          )}
        </div>
        <LearnerCourseProgressBar
          completedCount={completedLessonCount}
          totalLessons={totalLessons}
          className="mt-4"
        />
        {courseCompleted && (
          <p
            className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-center text-xs font-semibold text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
            role="status"
          >
            Course completed
          </p>
        )}
        <nav className="mt-3 space-y-4 text-sm">
          {course.modules.map((mod) => (
            <div key={mod.id}>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {mod.title}
              </p>
              <ul className="mt-1 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-700">
                {mod.lessons.map((l) => {
                  const active = l.id === lessonId;
                  const done = completedLessonIds.has(l.id);
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/learn/${slug}/${l.id}`}
                        className={`flex items-start gap-2 py-0.5 ${
                          active
                            ? "font-semibold text-indigo-600 dark:text-indigo-400"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        }`}
                      >
                        <span
                          className="mt-0.5 inline-flex w-4 shrink-0 justify-center text-sm leading-none text-emerald-600 dark:text-emerald-400"
                          aria-hidden
                        >
                          {done ? "✓" : ""}
                        </span>
                        <span className="min-w-0 flex-1">{l.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <article className="min-w-0 flex-1">
        {courseCompleted && (
          <div className="mb-8">
            <CourseCompletedBanner courseTitle={course.title} />
          </div>
        )}
        <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
          {lesson.moduleTitle}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
          {lesson.title}
        </h1>

        {isBlockNoteContent(lesson.content) ? (
          <LessonBlockNoteViewLoader raw={lesson.content} />
        ) : (
          <>
            {lesson.videoUrl ? (
              <LessonVideoEmbed videoUrl={lesson.videoUrl} />
            ) : null}
            <div className="mt-8">
              <MarkdownContent content={lesson.content} />
            </div>
          </>
        )}

        {quizForLearner && (
          <section className="mt-12 border-t border-slate-200 pt-10 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Quiz
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Pass at {quizForLearner.passPercent}% — multiple choice.
              {quizForLearner.requiredForCompletion && (
                <span className="ml-2 font-medium text-amber-800 dark:text-amber-200/90">
                  · Required to complete lesson
                </span>
              )}
            </p>
            <div className="mt-4">
              <QuizTaker
                quizId={quizForLearner.id}
                passPercent={quizForLearner.passPercent}
                questions={quizForLearner.questions}
                lastScore={lastQuizAttempt?.score ?? null}
                lastPassed={lastQuizAttempt?.passed ?? null}
              />
            </div>
          </section>
        )}

        {assignmentsForLesson.map((assignmentRow) => {
          const mySubmission = submissionByAssignmentId.get(assignmentRow.id);
          return (
            <section
              key={assignmentRow.id}
              className="mt-12 border-t border-slate-200 pt-10 dark:border-slate-800"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Assignment: {assignmentRow.title}
              </h2>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                {assignmentRow.description}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Max points: {assignmentRow.maxPoints}
                <span className="ml-2">
                  ·{" "}
                  {assignmentRow.responseType === "FILE"
                    ? "File upload"
                    : "Text response"}
                </span>
                {assignmentRow.requiredForCompletion && (
                  <span className="ml-2 font-medium text-amber-800 dark:text-amber-200/90">
                    · Required to complete lesson
                  </span>
                )}
              </p>
              <div className="mt-4">
                <AssignmentSubmission
                  assignmentId={assignmentRow.id}
                  maxPoints={assignmentRow.maxPoints}
                  dueAt={assignmentRow.dueAt}
                  responseType={assignmentRow.responseType}
                  initialContent={mySubmission?.content ?? ""}
                  initialFileUrl={mySubmission?.fileUrl ?? null}
                  initialFileName={mySubmission?.fileName ?? null}
                  reviewStatus={mySubmission?.reviewStatus ?? "PENDING"}
                  grade={mySubmission?.grade ?? null}
                  feedback={mySubmission?.feedback ?? null}
                />
              </div>
            </section>
          );
        })}

        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-8 dark:border-slate-800">
          <LessonNavigationBar
            slug={slug}
            lessonId={lessonId}
            prevLesson={prev}
            nextLesson={nextL}
            isCompleted={!!progress}
            isInstructorOwner={isInstructorOwner}
          />
        </div>
      </article>
      </div>
    </div>
  );
}
