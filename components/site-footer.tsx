import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-teal-900/10 bg-white py-10 dark:border-teal-500/15 dark:bg-teal-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Image
            src="/brand/unipod-logo.png"
            alt="UniPod"
            width={180}
            height={42}
            className="h-9 w-auto object-contain object-left opacity-90"
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} UniPod Learn · University of Rwanda
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm font-medium">
          <Link
            href="/courses"
            className="text-teal-800 transition hover:text-sky-600 dark:text-teal-200 dark:hover:text-sky-400"
          >
            Catalog
          </Link>
          <Link
            href="/auth/signin"
            className="text-teal-800 transition hover:text-sky-600 dark:text-teal-200 dark:hover:text-sky-400"
          >
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
