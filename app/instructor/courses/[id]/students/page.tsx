import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { InstructorStudentDetail } from "@/components/instructor-student-detail";
import type { InstructorRosterItem } from "@/components/instructor-student-roster";
import { InstructorStudentRoster } from "@/components/instructor-student-roster";
import { countUnreadMessagesFromStudentForInstructor } from "@/lib/course-message-unread";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
};

export async function generateMetadata({ params }: Props) {
  try {
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      select: { title: true },
    });
    return { title: course ? `Students · ${course.title}` : "Students" };
  } catch {
    return { title: "Students" };
  }
}

export default async function CourseStudentsPage({ params, searchParams }: Props) {
  const { id: courseId } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: {
              quiz: { select: { id: true, title: true } },
              assignments: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  title: true,
                  maxPoints: true,
                  responseType: true,
                  sortOrder: true,
                },
              },
            },
          },
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        orderBy: { enrolledAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!course) notFound();
  if (
    session.user.role !== "ADMIN" &&
    course.instructorId !== session.user.id
  ) {
    notFound();
  }

  const pendingEnrollmentCount = await prisma.enrollment.count({
    where: { courseId, status: "PENDING" },
  });

  type LessonRow = {
    lessonId: string;
    lessonTitle: string;
    sortKey: number;
    quizId: string | null;
    quizTitle: string | null;
  };

  const lessonRows: LessonRow[] = [];
  let sortKey = 0;
  for (const mod of course.modules) {
    for (const les of mod.lessons) {
      lessonRows.push({
        lessonId: les.id,
        lessonTitle: les.title,
        sortKey,
        quizId: les.quiz?.id ?? null,
        quizTitle: les.quiz?.title ?? null,
      });
      sortKey += 1;
    }
  }

  const lessonIds = lessonRows.map((r) => r.lessonId);
  const totalLessons = lessonIds.length;
  const quizIds = lessonRows
    .map((r) => r.quizId)
    .filter((id): id is string => id != null);
  const assignmentMeta = new Map<
    string,
    {
      title: string;
      lessonTitle: string;
      sortKey: number;
      assignmentSortOrder: number;
      maxPoints: number;
      responseType: "TEXT" | "FILE";
    }
  >();
  for (const mod of course.modules) {
    for (const les of mod.lessons) {
      const row = lessonRows.find((x) => x.lessonId === les.id);
      const sk = row?.sortKey ?? 0;
      const lt = les.title;
      for (const a of les.assignments) {
        assignmentMeta.set(a.id, {
          title: a.title,
          lessonTitle: lt,
          sortKey: sk,
          assignmentSortOrder: a.sortOrder,
          maxPoints: a.maxPoints,
          responseType: a.responseType,
        });
      }
    }
  }

  const userIds = course.enrollments.map((e) => e.userId);

  const [progressRows, quizAttempts, submissions] = await Promise.all([
    userIds.length && lessonIds.length
      ? prisma.lessonProgress.findMany({
          where: {
            userId: { in: userIds },
            lessonId: { in: lessonIds },
          },
          select: { userId: true, lessonId: true },
        })
      : Promise.resolve([]),
    userIds.length && quizIds.length
      ? prisma.quizAttempt.findMany({
          where: { userId: { in: userIds }, quizId: { in: quizIds } },
          orderBy: { createdAt: "desc" },
          select: {
            userId: true,
            quizId: true,
            score: true,
            passed: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    userIds.length && lessonIds.length
      ? prisma.assignmentSubmission.findMany({
          where: {
            userId: { in: userIds },
            assignment: { lessonId: { in: lessonIds } },
          },
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                maxPoints: true,
                responseType: true,
                lessonId: true,
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const completedByUser = new Map<string, number>();
  for (const row of progressRows) {
    completedByUser.set(
      row.userId,
      (completedByUser.get(row.userId) ?? 0) + 1,
    );
  }

  const latestQuizByUser = new Map<
    string,
    { score: number; passed: boolean }
  >();
  for (const q of quizAttempts) {
    const key = `${q.userId}:${q.quizId}`;
    if (!latestQuizByUser.has(key)) {
      latestQuizByUser.set(key, { score: q.score, passed: q.passed });
    }
  }

  const submissionsByUser = new Map<string, typeof submissions>();
  for (const sub of submissions) {
    const list = submissionsByUser.get(sub.userId) ?? [];
    list.push(sub);
    submissionsByUser.set(sub.userId, list);
  }

  const pendingByUser = new Map<string, number>();
  for (const sub of submissions) {
    if (sub.reviewStatus === "PENDING") {
      pendingByUser.set(
        sub.userId,
        (pendingByUser.get(sub.userId) ?? 0) + 1,
      );
    }
  }

  let pendingReviews = 0;
  for (const sub of submissions) {
    if (sub.reviewStatus === "PENDING") pendingReviews += 1;
  }

  const enrollmentIds = course.enrollments.map((e) => e.id);
  const chatRows =
    enrollmentIds.length > 0
      ? await prisma.courseMessage.findMany({
          where: { enrollmentId: { in: enrollmentIds } },
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { name: true, email: true } },
          },
        })
      : [];
  const messagesByEnrollment = new Map<string, typeof chatRows>();
  for (const m of chatRows) {
    const list = messagesByEnrollment.get(m.enrollmentId) ?? [];
    list.push(m);
    messagesByEnrollment.set(m.enrollmentId, list);
  }

  const enrollmentIdSet = new Set(course.enrollments.map((e) => e.id));
  const requestedParam =
    typeof sp.e === "string" && sp.e.length > 0 ? sp.e : null;

  if (course.enrollments.length > 0) {
    if (!requestedParam || !enrollmentIdSet.has(requestedParam)) {
      redirect(
        `/instructor/courses/${courseId}/students?e=${course.enrollments[0].id}`,
      );
    }
  }

  const unreadFromStudentRows = await Promise.all(
    course.enrollments.map(async (en) => {
      const n = await countUnreadMessagesFromStudentForInstructor(
        en.id,
        en.userId,
        en.instructorMessagesReadAt,
      );
      return { enrollmentId: en.id, n };
    }),
  );
  const unreadFromStudentMap = new Map(
    unreadFromStudentRows.map((r) => [r.enrollmentId, r.n]),
  );

  const rosterItems: InstructorRosterItem[] = course.enrollments.map(
    (en) => {
      const u = en.user;
      const done = completedByUser.get(u.id) ?? 0;
      const pct =
        totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;
      const rawUnread = unreadFromStudentMap.get(en.id) ?? 0;
      const viewingThis = requestedParam === en.id;
      return {
        enrollmentId: en.id,
        displayName: u.name?.trim() || u.email.split("@")[0] || u.email,
        email: u.email,
        progressPct: pct,
        pendingReviews: pendingByUser.get(u.id) ?? 0,
        courseComplete: totalLessons > 0 && done >= totalLessons,
        unreadFromStudent: viewingThis ? 0 : rawUnread,
      };
    },
  );

  const selectedEnrollment =
    course.enrollments.length > 0
      ? course.enrollments.find((en) => en.id === requestedParam)!
      : null;

  let detailBlock: ReactNode = null;
  if (selectedEnrollment) {
    const en = selectedEnrollment;
    const user = en.user;
    const done = completedByUser.get(user.id) ?? 0;
    const pct =
      totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;
    const courseComplete = totalLessons > 0 && done >= totalLessons;
    const userSubs = submissionsByUser.get(user.id) ?? [];
    const sortedSubs = [...userSubs].sort((a, b) => {
      const ma = assignmentMeta.get(a.assignmentId);
      const mb = assignmentMeta.get(b.assignmentId);
      const aKey = ma?.sortKey ?? 0;
      const bKey = mb?.sortKey ?? 0;
      if (aKey !== bKey) return aKey - bKey;
      const ao = ma?.assignmentSortOrder ?? 0;
      const bo = mb?.assignmentSortOrder ?? 0;
      if (ao !== bo) return ao - bo;
      return a.assignmentId.localeCompare(b.assignmentId);
    });

    detailBlock = (
      <InstructorStudentDetail
        enrollment={{
          id: en.id,
          enrolledAt: en.enrolledAt,
          user: user,
        }}
        totalLessons={totalLessons}
        lessonDone={done}
        progressPct={pct}
        courseComplete={courseComplete}
        lessonRows={lessonRows}
        latestQuizByUser={latestQuizByUser}
        sortedSubs={sortedSubs}
        assignmentMeta={assignmentMeta}
        chatMessageRows={messagesByEnrollment.get(en.id) ?? []}
        chatUnreadFromStudent={unreadFromStudentMap.get(en.id) ?? 0}
      />
    );
  }

  if (selectedEnrollment) {
    await prisma.enrollment.update({
      where: { id: selectedEnrollment.id },
      data: { instructorMessagesReadAt: new Date() },
    });
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link
          href="/instructor/courses"
          className="hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          Courses
        </Link>
        <span>/</span>
        <Link
          href={`/instructor/courses/${courseId}`}
          className="hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          {course.title}
        </Link>
        <span>/</span>
        <span>Students</span>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Students
        </h1>
        <Link
          href={`/instructor/courses/${courseId}`}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
        >
          ← Back to course
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span>
          <strong className="text-slate-900 dark:text-slate-200">
            {course.enrollments.length}
          </strong>{" "}
          enrolled
        </span>
        <span aria-hidden>·</span>
        <span>
          <strong className="text-slate-900 dark:text-slate-200">
            {pendingReviews}
          </strong>{" "}
          submission{pendingReviews === 1 ? "" : "s"} awaiting review
        </span>
        <span aria-hidden>·</span>
        <span>
          <strong className="text-slate-900 dark:text-slate-200">
            {totalLessons}
          </strong>{" "}
          lessons
        </span>
      </div>

      <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
        Pick a student in the list to review progress, quizzes, assignment
        submissions, and chat. Use search to filter when you have many
        enrollments.
      </p>

      {course.enrollments.length === 0 ? (
        <p className="mt-10 text-center text-slate-500 dark:text-slate-400">
          No approved learners yet.
          {pendingEnrollmentCount > 0 ? (
            <>
              {" "}
              You have{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {pendingEnrollmentCount}
              </strong>{" "}
              enrollment request
              {pendingEnrollmentCount === 1 ? "" : "s"} to review on the{" "}
              <Link
                href={`/instructor/courses/${courseId}`}
                className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                course page
              </Link>
              .
            </>
          ) : (
            <>
              {" "}
              When learners enroll from the catalog and you approve them, they
              will appear here.
            </>
          )}
        </p>
      ) : (
        <div className="mt-8 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/30 lg:min-h-[min(85vh,920px)] lg:flex-row">
          <div className="lg:w-[min(100%,380px)] lg:shrink-0">
            <InstructorStudentRoster
              courseId={courseId}
              selectedEnrollmentId={selectedEnrollment!.id}
              items={rosterItems}
            />
          </div>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto border-t border-slate-200 bg-slate-50/80 p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-950/40">
            {detailBlock}
          </div>
        </div>
      )}
    </main>
  );
}
