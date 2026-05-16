import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";

function IconRoles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function IconStructure({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function IconProgress({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  );
}

const trustItems = [
  "Programs & courses",
  "Labs & equipment",
  "Community & mentorship",
];

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-teal-900/[0.08] dark:border-teal-400/10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.18),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.12),transparent)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-32 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-500/5"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-1/4 top-0 h-48 w-48 rounded-full bg-[var(--brand-accent)]/15 blur-3xl dark:bg-[var(--brand-accent)]/8"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_minmax(0,20rem)] lg:items-center lg:gap-16 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ur-700)] dark:text-[var(--ur-300)]">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-400)]"
              />
              UR UniPod · University of Rwanda
            </p>
            <h1 className="mt-4 max-w-2xl text-balance text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[2.75rem] lg:leading-[1.12]">
              Where ideas become prototypes — and innovators meet
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
              UR UniPod is the University of Rwanda&apos;s innovation
              community. Join programs, take courses, book labs and
              makerspaces, and collaborate with peers, mentors, and staff.
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-500">
              {trustItems.map((label) => (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 dark:bg-sky-400"
                    aria-hidden
                  />
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/programs"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--brand-500)] px-6 text-sm font-semibold text-white shadow-md shadow-[var(--brand-900)]/15 transition hover:bg-[var(--brand-600)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-400)]"
              >
                Explore programs
              </Link>
              {session ? (
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--surface)]/80 px-6 text-sm font-semibold text-slate-800 backdrop-blur-sm transition hover:border-[var(--brand-500)]/40 hover:bg-[var(--surface)] dark:text-slate-100"
                >
                  Go to dashboard
                </Link>
              ) : (
                <Link
                  href="/auth/signup"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--surface)]/80 px-6 text-sm font-semibold text-slate-800 backdrop-blur-sm transition hover:border-[var(--brand-500)]/40 hover:bg-[var(--surface)] dark:text-slate-100"
                >
                  Join the community
                </Link>
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 shadow-[0_1px_0_rgba(2,132,199,0.06),0_24px_48px_-12px_rgba(15,23,42,0.15)] backdrop-blur-sm">
              <div className="h-1 w-full bg-gradient-to-r from-[var(--brand-500)] via-[var(--accent-400)] to-[var(--ur-600)]" />
              <div className="p-6">
                <div className="relative mx-auto aspect-[5/2] w-full max-w-[280px]">
                  <Image
                    src="/brand/unipod-logo.png"
                    alt="UR UniPod — University of Rwanda"
                    fill
                    className="object-contain object-left"
                    sizes="280px"
                    priority
                  />
                </div>
                <p className="mt-5 border-t border-[var(--border)] pt-5 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  Official innovation community platform for the University of
                  Rwanda — programs, courses, labs, and people, in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="max-w-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-700)] dark:text-[var(--brand-300)]">
            What UR UniPod offers
          </h2>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            One platform for learning, building, and belonging
          </p>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Programs, courses, labs, and community — connected through a
            single account so members can move from idea to prototype to
            launch.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {[
            {
              Icon: IconRoles,
              title: "Community & roles",
              body: "Students, instructors, lab technicians, mentors and staff each get the right access — connected through one UR UniPod identity.",
            },
            {
              Icon: IconStructure,
              title: "Programs & courses",
              body: "Structured innovation programs like the Prototype Development Program, plus modular courses for skills you build along the way.",
            },
            {
              Icon: IconProgress,
              title: "Labs & equipment",
              body: "Discover UR UniPod labs and workshops, book makerspace time, reserve equipment, and track maintenance — all in one place.",
            },
          ].map(({ Icon, title, body }) => (
            <article
              key={title}
              className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition hover:border-[var(--brand-500)]/40 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)] dark:bg-[var(--brand-950)] dark:text-[var(--brand-300)]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-[var(--border)] bg-gradient-to-b from-[var(--surface-muted)] to-transparent px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            Ready to build something at UR UniPod?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted-foreground)]">
            Browse programs and courses, or sign in to continue with your
            workspace.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/programs"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--brand-500)] px-6 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--brand-600)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-400)]"
            >
              Explore programs
            </Link>
            {!session && (
              <Link
                href="/auth/signin"
                className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold text-[var(--brand-700)] underline-offset-4 hover:underline dark:text-[var(--brand-300)]"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
