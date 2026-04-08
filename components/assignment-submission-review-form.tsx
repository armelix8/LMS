import { reviewAssignmentSubmission } from "@/app/actions/assessment";

type Submission = {
  id: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  submittedAt: Date;
  grade: number | null;
  feedback: string | null;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
};

type Props = {
  submission: Submission;
  assignment: {
    maxPoints: number;
    responseType: "TEXT" | "FILE";
  };
};

export function AssignmentSubmissionReviewForm({
  submission: s,
  assignment,
}: Props) {
  const isPending = s.reviewStatus === "PENDING";
  const isApproved = s.reviewStatus === "APPROVED";
  const isRejected = s.reviewStatus === "REJECTED";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Status:
        </span>
        {isApproved ? (
          <span
            className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm dark:bg-emerald-600"
            role="status"
          >
            Approved
          </span>
        ) : isRejected ? (
          <span
            className="inline-flex items-center rounded-lg border border-red-400 bg-red-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-900 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200"
            role="status"
          >
            Rejected
          </span>
        ) : (
          <span
            className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            Pending review
          </span>
        )}
      </div>
      {assignment.responseType === "TEXT" ? (
        <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
          {s.content || "—"}
        </p>
      ) : (
        <div className="text-sm text-slate-700 dark:text-slate-300">
          {s.fileUrl ? (
            <a
              href={s.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {s.fileName ?? "Download file"}
            </a>
          ) : (
            <span className="text-slate-500">No file yet</span>
          )}
          {s.content?.trim() ? (
            <p className="mt-2 whitespace-pre-wrap text-xs text-slate-500">
              Note: {s.content}
            </p>
          ) : null}
        </div>
      )}
      <form
        action={reviewAssignmentSubmission.bind(null, s.id)}
        className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700"
      >
        <div>
          <label
            htmlFor={`fb-${s.id}`}
            className="block text-xs text-slate-500 dark:text-slate-400"
          >
            Feedback / note to student (optional on approve; recommended on
            reject)
          </label>
          <textarea
            id={`fb-${s.id}`}
            name="feedback"
            rows={2}
            defaultValue={s.feedback ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor={`grade-${s.id}`}
              className="block text-xs text-slate-500 dark:text-slate-400"
            >
              Points (approve; default full)
            </label>
            <input
              id={`grade-${s.id}`}
              name="grade"
              type="number"
              min={0}
              max={assignment.maxPoints}
              placeholder={String(assignment.maxPoints)}
              defaultValue={s.grade ?? ""}
              className="mt-1 w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-5">
            {isPending && (
              <>
                <button
                  type="submit"
                  name="decision"
                  value="approve"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Approve
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="reject"
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
                >
                  Reject
                </button>
              </>
            )}
            {isApproved && (
              <>
                <button
                  type="submit"
                  name="decision"
                  value="approve"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Save grade & feedback
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="reject"
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
                >
                  Reject
                </button>
              </>
            )}
            {isRejected && (
              <>
                <button
                  type="submit"
                  name="decision"
                  value="approve"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Approve
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="reject"
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
                >
                  Update rejection
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
