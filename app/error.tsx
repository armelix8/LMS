"use client";

import { useEffect } from "react";
import { isDatabaseUnavailableError } from "@/lib/database-error";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dbDown = isDatabaseUnavailableError(error);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
        {dbDown ? "Can’t connect to the database" : "Something went wrong"}
      </h1>
      {dbDown ? (
        <div className="mt-4 space-y-3 text-left text-sm text-slate-600 dark:text-slate-400">
          <p>
            The app could not reach PostgreSQL using{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
              DATABASE_URL
            </code>{" "}
            from your{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
              .env
            </code>{" "}
            file.
          </p>
          <ul className="list-inside list-disc space-y-1 text-slate-600 dark:text-slate-400">
            <li>Confirm the database server is running and reachable.</li>
            <li>
              If the DB is on a private network, connect VPN or use the same
              network as the server.
            </li>
            <li>
              For local development, point{" "}
              <code className="font-mono text-xs">DATABASE_URL</code> at a
              local PostgreSQL instance (e.g. Docker).
            </li>
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Try again in a moment. If the problem continues, contact support.
        </p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-8 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Try again
      </button>
    </main>
  );
}
