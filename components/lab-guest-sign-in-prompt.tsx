import Link from "next/link";

export function LabGuestSignInPrompt({
  title,
  body,
  callbackPath,
}: {
  title: string;
  body: string;
  callbackPath: string;
}) {
  const q = encodeURIComponent(callbackPath);
  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-8 text-center dark:border-slate-800 dark:bg-slate-900/40">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        {body}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          href={`/auth/signin?callbackUrl=${q}`}
          className="inline-flex rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
        >
          Sign in
        </Link>
        <Link
          href={`/auth/signup?callbackUrl=${q}`}
          className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Create account
        </Link>
      </div>
    </section>
  );
}
