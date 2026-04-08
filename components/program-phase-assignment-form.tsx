"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitProgramPhaseAssignmentWork } from "@/app/actions/programs";

type Props = {
  assignmentId: string;
  responseType: "TEXT" | "FILE";
  existingContent: string;
  hasExistingFile: boolean;
  reviewStatus: string;
};

export function ProgramPhaseAssignmentForm({
  assignmentId,
  responseType,
  existingContent,
  hasExistingFile,
  reviewStatus,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const locked = reviewStatus === "APPROVED";

  return (
    <form
      className="mt-4 space-y-3 border-t border-slate-200/80 pt-4 dark:border-slate-700/80"
      action={(fd) => {
        setError(null);
        startTransition(() => {
          void (async () => {
            const r = await submitProgramPhaseAssignmentWork(
              assignmentId,
              fd,
            );
            if (r.error) setError(r.error);
            else router.refresh();
          })();
        });
      }}
    >
      {responseType === "TEXT" ? (
        <textarea
          name="content"
          rows={4}
          defaultValue={existingContent}
          disabled={locked || pending}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm ring-offset-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600 dark:bg-slate-900 dark:ring-offset-slate-950"
          placeholder="Your response"
        />
      ) : (
        <div className="space-y-2">
          {hasExistingFile ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A file is already uploaded. Choose a new file to replace it.
            </p>
          ) : null}
          <input
            type="file"
            name="file"
            disabled={locked || pending}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sm file:font-medium dark:text-slate-300 dark:file:bg-sky-950/50"
          />
        </div>
      )}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {locked ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          This submission was approved and cannot be changed.
        </p>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-10 items-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] dark:bg-sky-500 dark:hover:bg-sky-400"
        >
          {pending ? "Saving…" : "Submit"}
        </button>
      )}
    </form>
  );
}
