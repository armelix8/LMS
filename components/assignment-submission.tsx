"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitAssignmentWork } from "@/app/actions/assessment";

type Props = {
  assignmentId: string;
  maxPoints: number;
  dueAt: Date | null;
  responseType: "TEXT" | "FILE";
  initialContent: string;
  initialFileUrl: string | null;
  initialFileName: string | null;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  grade: number | null;
  feedback: string | null;
};

export function AssignmentSubmission({
  assignmentId,
  maxPoints,
  dueAt,
  responseType,
  initialContent,
  initialFileUrl,
  initialFileName,
  reviewStatus,
  grade,
  feedback,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const approvedLocked = reviewStatus === "APPROVED";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    const res = await submitAssignmentWork(assignmentId, fd);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {dueAt && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Due: {dueAt.toLocaleString()}
        </p>
      )}

      {!approvedLocked && (
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {responseType === "TEXT"
            ? "Submit your answer in the text box below."
            : "Upload a file (max 15 MB). You can add an optional note."}
        </p>
      )}

      {reviewStatus === "PENDING" &&
        (initialFileUrl || initialContent.trim()) && (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
              role="status"
            >
              Pending review
            </span>
            <span className="text-sm text-amber-900 dark:text-amber-100/90">
              Awaiting instructor review.
            </span>
          </div>
        )}

      {approvedLocked && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm dark:bg-emerald-600"
              role="status"
            >
              Approved
            </span>
            {grade != null ? (
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                {grade} / {maxPoints}
              </span>
            ) : null}
          </div>
          {feedback && (
            <p className="mt-1 text-emerald-800 dark:text-emerald-300">
              Feedback: {feedback}
            </p>
          )}
          <p className="mt-2 text-xs text-emerald-800/90 dark:text-emerald-300/90">
            Your submission is final and cannot be edited.
          </p>
        </div>
      )}

      {reviewStatus === "REJECTED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm dark:border-red-900/50 dark:bg-red-950/40">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-lg border border-red-400 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-900 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200"
              role="status"
            >
              Rejected
            </span>
            <p className="font-semibold text-red-900 dark:text-red-200">
              Not accepted — please revise and submit again.
            </p>
          </div>
          {feedback && (
            <p className="mt-1 text-red-800 dark:text-red-300">
              {feedback}
            </p>
          )}
        </div>
      )}

      {approvedLocked ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
            Your submission
          </p>
          {responseType === "TEXT" ? (
            <div className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
              {initialContent.trim() ? initialContent : "—"}
            </div>
          ) : (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {initialFileUrl ? (
                <p>
                  File:{" "}
                  <a
                    href={initialFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {initialFileName ?? "Download"}
                  </a>
                </p>
              ) : (
                <p className="text-slate-500">No file on record.</p>
              )}
              {initialContent.trim() ? (
                <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                  Note: {initialContent}
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          encType="multipart/form-data"
          className="space-y-3"
        >
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}
          {saved && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Submission saved.
            </p>
          )}

          {responseType === "TEXT" ? (
            <textarea
              name="content"
              required
              rows={10}
              defaultValue={initialContent}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              placeholder="Write your response…"
            />
          ) : (
            <>
              {initialFileUrl && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Current file:{" "}
                  <a
                    href={initialFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {initialFileName ?? "Download"}
                  </a>
                </p>
              )}
              <div>
                <label
                  htmlFor={`assignment-file-${assignmentId}`}
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  {initialFileUrl ? "Replace file" : "Upload file"}
                </label>
                <input
                  id={`assignment-file-${assignmentId}`}
                  name="file"
                  type="file"
                  required={!initialFileUrl}
                  className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-950 dark:file:text-indigo-200"
                />
              </div>
              <div>
                <label
                  htmlFor={`assignment-note-${assignmentId}`}
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Optional note
                </label>
                <textarea
                  id={`assignment-note-${assignmentId}`}
                  name="content"
                  rows={3}
                  defaultValue={initialContent}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  placeholder="Comments for your instructor (optional)"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {reviewStatus === "REJECTED"
              ? "Submit again"
              : initialFileUrl || initialContent
                ? "Update submission"
                : "Submit assignment"}
          </button>
        </form>
      )}
    </div>
  );
}
