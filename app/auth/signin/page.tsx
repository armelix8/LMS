import Link from "next/link";
import { Suspense } from "react";
import { googleAuthEnabled } from "@/lib/config";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Access your courses and dashboard.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
            <SignInForm googleEnabled={googleAuthEnabled} />
          </Suspense>
        </div>
        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          No account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
