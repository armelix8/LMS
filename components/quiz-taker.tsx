"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitQuizAttempt } from "@/app/actions/assessment";

type Option = { id: string; text: string };

type Question = {
  id: string;
  prompt: string;
  options: Option[];
};

type Props = {
  quizId: string;
  passPercent: number;
  questions: Question[];
  lastScore: number | null;
  lastPassed: boolean | null;
};

export function QuizTaker({
  quizId,
  passPercent,
  questions,
  lastScore,
  lastPassed,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);

  if (questions.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Quiz has no questions yet.
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await submitQuizAttempt(quizId, fd);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setResult({ score: res.score, passed: res.passed });
    router.refresh();
  }

  if (result) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/50">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Submitted
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Score: {result.score}%
        </p>
        <p
          className={
            result.passed
              ? "mt-1 text-emerald-600 dark:text-emerald-400"
              : "mt-1 text-amber-700 dark:text-amber-300"
          }
        >
          {result.passed
            ? `Passed (required ${passPercent}%)`
            : `Not passed (required ${passPercent}%)`}
        </p>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Take again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {lastScore != null && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/60">
          Last attempt:{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            {lastScore}%
          </span>
          {lastPassed != null && (
            <span className="ml-2 text-slate-600 dark:text-slate-400">
              {lastPassed ? "Passed" : "Not passed"}
            </span>
          )}
        </div>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      {questions.map((q) => (
        <fieldset
          key={q.id}
          className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
        >
          <legend className="px-1 text-sm font-medium text-slate-900 dark:text-white">
            {q.prompt}
          </legend>
          <div className="mt-3 space-y-2">
            {q.options.map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  value={o.id}
                  required
                  className="mt-1"
                />
                <span>{o.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button
        type="submit"
        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Submit quiz
      </button>
    </form>
  );
}
