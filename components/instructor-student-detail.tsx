import { sendCourseMessage } from "@/app/actions/course-messages";
import { AssignmentSubmissionReviewForm } from "@/components/assignment-submission-review-form";
import { InstructorStudentMessagesChat } from "@/components/instructor-student-messages-chat";
import { toCourseChatMessageVMs } from "@/lib/course-chat";
import type { Prisma } from "@prisma/client";

type LessonRow = {
  lessonId: string;
  lessonTitle: string;
  sortKey: number;
  quizId: string | null;
  quizTitle: string | null;
};

type SubmissionRow = Prisma.AssignmentSubmissionGetPayload<{
  include: {
    assignment: {
      select: {
        id: true;
        title: true;
        maxPoints: true;
        responseType: true;
        lessonId: true;
      };
    };
  };
}>;

type AssignmentMeta = {
  title: string;
  lessonTitle: string;
  sortKey: number;
  assignmentSortOrder: number;
  maxPoints: number;
  responseType: "TEXT" | "FILE";
};

type ChatRow = Prisma.CourseMessageGetPayload<{
  include: { sender: { select: { name: true; email: true } } };
}>;

type Props = {
  enrollment: {
    id: string;
    enrolledAt: Date;
    user: { id: string; name: string | null; email: string | null };
  };
  totalLessons: number;
  lessonDone: number;
  progressPct: number;
  courseComplete: boolean;
  lessonRows: LessonRow[];
  latestQuizByUser: Map<string, { score: number; passed: boolean }>;
  sortedSubs: SubmissionRow[];
  assignmentMeta: Map<string, AssignmentMeta>;
  chatMessageRows: ChatRow[];
  /** Unread messages from this student (for chat button badge). */
  chatUnreadFromStudent: number;
};

export function InstructorStudentDetail({
  enrollment,
  totalLessons,
  lessonDone,
  progressPct,
  courseComplete,
  lessonRows,
  latestQuizByUser,
  sortedSubs,
  assignmentMeta,
  chatMessageRows,
  chatUnreadFromStudent,
}: Props) {
  const user = enrollment.user;
  const chatMessages = toCourseChatMessageVMs(chatMessageRows);

  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {user.name ?? user.email}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {user.email}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Enrolled {enrollment.enrolledAt.toLocaleString()}
          </p>
        </div>
        {courseComplete ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
            Course completed
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Progress
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>
            Lessons completed:{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {lessonDone} / {totalLessons}
            </span>
          </span>
          <span className="text-xs tabular-nums">{progressPct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-indigo-600 transition-[width] dark:bg-indigo-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {lessonRows.some((r) => r.quizId) ? (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Quizzes (latest attempt)
          </h3>
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            {lessonRows
              .filter((r) => r.quizId)
              .map((r) => {
                const key = `${user.id}:${r.quizId}`;
                const att = latestQuizByUser.get(key);
                return (
                  <li
                    key={r.quizId!}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <span className="text-slate-700 dark:text-slate-300">
                      {r.lessonTitle}
                      <span className="text-slate-500 dark:text-slate-400">
                        {" "}
                        · {r.quizTitle}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {att ? (
                        <>
                          <span
                            className={
                              att.passed
                                ? "font-medium text-emerald-700 dark:text-emerald-400"
                                : "font-medium text-amber-800 dark:text-amber-300"
                            }
                          >
                            {att.score}%
                          </span>
                          {att.passed ? " passed" : " not passed"}
                        </>
                      ) : (
                        "No attempt yet"
                      )}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      ) : null}

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Assignments
        </h3>
        {sortedSubs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No submissions yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-6">
            {sortedSubs.map((sub) => {
              const meta = assignmentMeta.get(sub.assignmentId);
              return (
                <li
                  key={sub.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {meta?.title ?? sub.assignment.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {sub.submittedAt.toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Lesson: {meta?.lessonTitle ?? "—"}
                  </p>
                  <div className="mt-3">
                    <AssignmentSubmissionReviewForm
                      submission={{
                        id: sub.id,
                        content: sub.content,
                        fileUrl: sub.fileUrl,
                        fileName: sub.fileName,
                        submittedAt: sub.submittedAt,
                        grade: sub.grade,
                        feedback: sub.feedback,
                        reviewStatus: sub.reviewStatus,
                      }}
                      assignment={{
                        maxPoints: sub.assignment.maxPoints,
                        responseType: sub.assignment.responseType,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Chat
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Same thread the learner sees under course messages.
        </p>
        <div className="mt-3">
          <InstructorStudentMessagesChat
            studentName={
              user.name?.trim() ||
              (user.email ? user.email.split("@")[0] : null) ||
              user.email ||
              "Student"
            }
            studentEmail={user.email ?? ""}
            enrollmentId={enrollment.id}
            studentUserId={user.id}
            messages={chatMessages}
            sendMessage={sendCourseMessage.bind(null, enrollment.id)}
            unreadCount={chatUnreadFromStudent}
          />
        </div>
      </div>
    </div>
  );
}
