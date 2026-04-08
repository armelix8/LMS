"use client";

import { useMemo, useState } from "react";
import {
  addQuizQuestion,
  createAssignment,
  createQuiz,
  deleteAssignment,
  deleteQuiz,
  deleteQuizQuestion,
  saveQuizQuestion,
  updateAssignment,
  updateQuizMeta,
} from "@/app/actions/assessment";
import { AssignmentSubmissionReviewForm } from "@/components/assignment-submission-review-form";

type QuizOption = { id: string; text: string; isCorrect: boolean; sortOrder: number };
type QuizQuestion = {
  id: string;
  prompt: string;
  sortOrder: number;
  options: QuizOption[];
};
type Quiz = {
  id: string;
  title: string;
  passPercent: number;
  requiredForCompletion: boolean;
  questions: QuizQuestion[];
};

type Submission = {
  id: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  submittedAt: Date;
  grade: number | null;
  feedback: string | null;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  user: { name: string | null; email: string | null };
};

type Assignment = {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
  dueAt: Date | null;
  requiredForCompletion: boolean;
  responseType: "TEXT" | "FILE";
  submissions: Submission[];
};

type Props = {
  lessonId: string;
  quiz: Quiz | null;
  assignments: Assignment[];
};

const OPTION_SLOTS = 6;

function promptPreview(prompt: string, max = 72): string {
  const one = prompt.replace(/\s+/g, " ").trim();
  if (one.length <= max) return one || "—";
  return `${one.slice(0, max).trim()}…`;
}

export function LessonAssessmentEditor({
  lessonId,
  quiz,
  assignments,
}: Props) {
  const [tab, setTab] = useState<"quiz" | "assignments">(() =>
    quiz && quiz.questions.length > 0 ? "quiz" : "assignments",
  );

  const pendingSubs = useMemo(
    () =>
      assignments.reduce(
        (n, a) =>
          n + a.submissions.filter((s) => s.reviewStatus === "PENDING").length,
        0,
      ),
    [assignments],
  );

  return (
    <div className="mt-12 border-t border-slate-200 pt-10 dark:border-slate-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Assessments
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Switch between quiz and assignments. Open a section below to edit;
            long lists stay collapsed until you expand them.
          </p>
        </div>
      </div>

      <div
        className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-px dark:border-slate-700"
        role="tablist"
        aria-label="Assessment type"
      >
        <button
          id="tab-quiz"
          type="button"
          role="tab"
          aria-selected={tab === "quiz"}
          className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === "quiz"
              ? "border border-b-0 border-slate-200 bg-white text-indigo-700 dark:border-slate-600 dark:bg-slate-900 dark:text-indigo-300"
              : "border border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
          }`}
          onClick={() => setTab("quiz")}
        >
          Quiz
          {quiz ? (
            <span className="ml-1.5 tabular-nums text-slate-500 dark:text-slate-400">
              ({quiz.questions.length} question
              {quiz.questions.length === 1 ? "" : "s"})
            </span>
          ) : (
            <span className="ml-1.5 text-slate-400">(none)</span>
          )}
        </button>
        <button
          id="tab-assignments"
          type="button"
          role="tab"
          aria-selected={tab === "assignments"}
          className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === "assignments"
              ? "border border-b-0 border-slate-200 bg-white text-indigo-700 dark:border-slate-600 dark:bg-slate-900 dark:text-indigo-300"
              : "border border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
          }`}
          onClick={() => setTab("assignments")}
        >
          Assignments
          <span className="ml-1.5 tabular-nums text-slate-500 dark:text-slate-400">
            ({assignments.length})
          </span>
          {pendingSubs > 0 ? (
            <span className="ml-1.5 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold uppercase text-white dark:bg-amber-600">
              {pendingSubs} pending
            </span>
          ) : null}
        </button>
      </div>

      <div
        className="rounded-b-xl rounded-tr-xl border border-t-0 border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900/40"
        role="tabpanel"
        id="instructor-assessment-panel"
        aria-labelledby={tab === "quiz" ? "tab-quiz" : "tab-assignments"}
      >
        {tab === "quiz" ? (
          <QuizPanel lessonId={lessonId} quiz={quiz} />
        ) : (
          <AssignmentsPanel lessonId={lessonId} assignments={assignments} />
        )}
      </div>
    </div>
  );
}

function QuizPanel({ lessonId, quiz }: { lessonId: string; quiz: Quiz | null }) {
  if (!quiz) {
    return (
      <form action={createQuiz.bind(null, lessonId)}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No quiz yet. Add one multiple-choice quiz for this lesson.
        </p>
        <button
          type="submit"
          className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Add quiz to this lesson
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <form
        action={updateQuizMeta.bind(null, quiz.id)}
        className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-950/40"
      >
        <div>
          <label
            htmlFor="quiz-title"
            className="block text-xs font-medium text-slate-600 dark:text-slate-400"
          >
            Quiz title
          </label>
          <input
            id="quiz-title"
            name="title"
            defaultValue={quiz.title}
            required
            className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="passPercent"
            className="block text-xs font-medium text-slate-600 dark:text-slate-400"
          >
            Pass at (%)
          </label>
          <input
            id="passPercent"
            name="passPercent"
            type="number"
            min={0}
            max={100}
            defaultValue={quiz.passPercent}
            className="mt-1 w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            name="requiredForCompletion"
            defaultChecked={quiz.requiredForCompletion}
            className="rounded border-slate-300"
          />
          Required to complete lesson
        </label>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Save quiz settings
        </button>
      </form>

      <form action={addQuizQuestion.bind(null, quiz.id)}>
        <button
          type="submit"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          + Add question
        </button>
      </form>

      {quiz.questions.length > 0 && (
        <nav
          className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-950/50"
          aria-label="Jump to question"
        >
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Jump:
          </span>
          {quiz.questions.map((q, qi) => (
            <a
              key={q.id}
              href={`#instructor-quiz-q-${q.id}`}
              className="rounded-md bg-white px-2 py-1 font-medium text-indigo-600 shadow-sm ring-1 ring-slate-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-400 dark:ring-slate-600 dark:hover:bg-slate-800"
            >
              Q{qi + 1}
            </a>
          ))}
        </nav>
      )}

      <ol className="space-y-3">
        {quiz.questions.map((q, qi) => {
          const correctIdx = q.options.findIndex((o) => o.isCorrect);
          const checkedIdx = correctIdx >= 0 ? correctIdx : 0;
          return (
            <li key={q.id} id={`instructor-quiz-q-${q.id}`} className="scroll-mt-24">
              <details
                className="group rounded-xl border border-slate-200 open:bg-white dark:border-slate-700 dark:open:bg-slate-900/60"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 text-left marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 text-sm font-medium text-slate-800 dark:text-slate-200">
                    <span className="text-slate-500 dark:text-slate-400">
                      Q{qi + 1}.{" "}
                    </span>
                    {promptPreview(q.prompt)}
                  </span>
                  <span className="shrink-0 text-slate-400 group-open:rotate-180 dark:text-slate-500">
                    ▼
                  </span>
                </summary>
                <div className="border-t border-slate-100 px-4 pb-4 pt-2 dark:border-slate-700">
                  <div className="mb-3 flex justify-end">
                    <form action={deleteQuizQuestion.bind(null, q.id)}>
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:text-red-500 dark:text-red-400"
                      >
                        Remove question
                      </button>
                    </form>
                  </div>
                  <form
                    action={saveQuizQuestion.bind(null, q.id)}
                    className="space-y-3"
                  >
                    <textarea
                      name="prompt"
                      required
                      rows={3}
                      defaultValue={q.prompt}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Options (at least 2). Mark the correct answer.
                    </p>
                    {Array.from({ length: OPTION_SLOTS }, (_, i) => {
                      const opt = q.options[i];
                      return (
                        <div
                          key={i}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input
                            type="radio"
                            name="correctIndex"
                            value={i}
                            defaultChecked={i === checkedIdx}
                            className="shrink-0"
                          />
                          <input
                            type="text"
                            name="optionText"
                            defaultValue={opt?.text ?? ""}
                            placeholder={`Option ${i + 1}`}
                            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                      );
                    })}
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                    >
                      Save question
                    </button>
                  </form>
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      <form action={deleteQuiz.bind(null, quiz.id)}>
        <button
          type="submit"
          className="text-sm text-red-600 hover:text-red-500 dark:text-red-400"
        >
          Remove entire quiz from this lesson
        </button>
      </form>
    </div>
  );
}

function AssignmentsPanel({
  lessonId,
  assignments,
}: {
  lessonId: string;
  assignments: Assignment[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Each assignment opens in its own section. Submission reviews stay inside
        the same block with scrolling when there are many students.
      </p>

      {assignments.length > 0 && (
        <nav
          className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-950/50"
          aria-label="Jump to assignment"
        >
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Jump:
          </span>
          {assignments.map((a, index) => (
            <a
              key={a.id}
              href={`#instructor-asmt-${a.id}`}
              className="max-w-[12rem] truncate rounded-md bg-white px-2 py-1 font-medium text-indigo-600 shadow-sm ring-1 ring-slate-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-400 dark:ring-slate-600 dark:hover:bg-slate-800"
              title={a.title}
            >
              {index + 1}. {a.title}
            </a>
          ))}
        </nav>
      )}

      <div className="space-y-3">
        {assignments.map((assignment, index) => (
          <details
            key={assignment.id}
            id={`instructor-asmt-${assignment.id}`}
            className="group scroll-mt-24 rounded-xl border border-slate-200 open:bg-white dark:border-slate-700 dark:open:bg-slate-900/50"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-left marker:content-none [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Assignment {index + 1}
                </p>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {assignment.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {assignment.responseType === "FILE" ? "File" : "Text"} ·{" "}
                  {assignment.maxPoints} pts
                  {assignment.requiredForCompletion ? " · required" : ""}
                  {assignment.submissions.length > 0
                    ? ` · ${assignment.submissions.length} submission${
                        assignment.submissions.length === 1 ? "" : "s"
                      }`
                    : ""}
                </p>
              </div>
              <span className="shrink-0 text-slate-400 group-open:rotate-180 dark:text-slate-500">
                ▼
              </span>
            </summary>

            <div className="border-t border-slate-100 px-4 pb-4 pt-4 dark:border-slate-700">
              <form
                action={updateAssignment.bind(null, assignment.id)}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor={`asmt-title-${assignment.id}`}
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Title
                  </label>
                  <input
                    id={`asmt-title-${assignment.id}`}
                    name="title"
                    required
                    defaultValue={assignment.title}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`asmt-desc-${assignment.id}`}
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Instructions
                  </label>
                  <textarea
                    id={`asmt-desc-${assignment.id}`}
                    name="description"
                    required
                    rows={4}
                    defaultValue={assignment.description}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label
                      htmlFor={`maxPoints-${assignment.id}`}
                      className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                    >
                      Max points
                    </label>
                    <input
                      id={`maxPoints-${assignment.id}`}
                      name="maxPoints"
                      type="number"
                      min={1}
                      max={1000}
                      defaultValue={assignment.maxPoints}
                      className="mt-1 w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`dueAt-${assignment.id}`}
                      className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                    >
                      Due (optional)
                    </label>
                    <input
                      id={`dueAt-${assignment.id}`}
                      name="dueAt"
                      type="datetime-local"
                      defaultValue={
                        assignment.dueAt
                          ? toDatetimeLocal(assignment.dueAt)
                          : ""
                      }
                      className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <fieldset className="space-y-2">
                  <legend className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Response type
                  </legend>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="responseType"
                      value="TEXT"
                      defaultChecked={assignment.responseType !== "FILE"}
                      className="border-slate-300"
                    />
                    Text answer (typed response)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="responseType"
                      value="FILE"
                      defaultChecked={assignment.responseType === "FILE"}
                      className="border-slate-300"
                    />
                    File upload
                  </label>
                </fieldset>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    name="requiredForCompletion"
                    defaultChecked={assignment.requiredForCompletion}
                    className="rounded border-slate-300"
                  />
                  Required to complete lesson
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Save assignment
                </button>
              </form>

              <form
                action={deleteAssignment.bind(null, assignment.id)}
                className="mt-3"
              >
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Remove this assignment
                </button>
              </form>

              {assignment.submissions.length > 0 && (
                <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Submissions
                  </h3>
                  <div className="mt-3 max-h-[min(28rem,55vh)] space-y-4 overflow-y-auto overscroll-contain pr-1">
                    {assignment.submissions.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-950/40"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {s.user.name ?? s.user.email}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {s.submittedAt.toLocaleString()}
                          </p>
                        </div>
                        <div className="mt-3">
                          <AssignmentSubmissionReviewForm
                            submission={s}
                            assignment={{
                              maxPoints: assignment.maxPoints,
                              responseType: assignment.responseType,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>

      <form action={createAssignment.bind(null, lessonId)} className="pt-2">
        <button
          type="submit"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          + Add assignment
        </button>
      </form>
    </div>
  );
}

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}
