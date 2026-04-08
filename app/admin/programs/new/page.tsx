import Link from "next/link";
import { auth } from "@/auth";
import { createProgram } from "@/app/actions/programs";
import { redirect } from "next/navigation";

export const metadata = { title: "New program" };

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm ring-offset-white transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600 dark:bg-slate-900 dark:ring-offset-slate-950 dark:focus:ring-sky-400/30";

export default async function NewProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  const sp = await searchParams;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href="/admin/programs"
        className="text-sm font-medium text-teal-800 hover:underline dark:text-teal-300"
      >
        ← Programs
      </Link>
      <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          New program
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Add a title and description. You can publish when cohorts and phases
          are ready.
        </p>
        {sp.error === "required" ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            Title and description are required.
          </p>
        ) : null}
        <form action={createProgram} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              className={inputClass}
              placeholder="e.g. Innovation fellowship"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              className={inputClass}
              placeholder="Who the program is for, duration, expectations…"
            />
          </div>
          <div>
            <label
              htmlFor="coverImageUrl"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Cover image URL (optional)
            </label>
            <input
              id="coverImageUrl"
              name="coverImageUrl"
              type="url"
              className={inputClass}
              placeholder="/images/programs/example.png"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Public path under <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">/public</code> or HTTPS.
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/40">
            <input
              type="checkbox"
              name="published"
              className="mt-1 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-medium text-slate-900 dark:text-white">
                Published
              </span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-500">
                Visible on the public programs directory
              </span>
            </span>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] sm:w-auto dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            Create program
          </button>
        </form>
      </div>
    </main>
  );
}
