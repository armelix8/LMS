import { AuthWelcomeSide } from "@/components/auth-welcome-side";
import { BrandLogo } from "@/components/brand-logo";
import { SignUpForm } from "./sign-up-form";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <main className="grid flex-1 lg:grid-cols-[1.1fr_minmax(360px,1fr)]">
      <AuthWelcomeSide
        heading="Join the UR UniPod innovation community"
        body="Apply to programs like the Prototype Development Program, take courses, reserve makerspace time, and collaborate with peers, mentors, and instructors."
      />

      <section className="relative flex items-center justify-center px-4 py-12 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(14,165,233,0.14),transparent_60%)] lg:hidden"
        />
        <div className="w-full max-w-md">
          <div className="flex justify-center pb-6 lg:hidden">
            <BrandLogo href="/" size="lg" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_1px_0_rgba(2,132,199,0.06),0_30px_60px_-30px_rgba(15,23,42,0.25)]">
            <div className="h-1 w-full bg-gradient-to-r from-[var(--brand-500)] via-[var(--accent-400)] to-[var(--ur-600)]" />
            <div className="p-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Get a UR UniPod account to access programs, courses, and labs.
              </p>
              <div className="mt-8">
                <SignUpForm />
              </div>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
            UR UniPod · University of Rwanda ·{" "}
            <a
              href="https://unipod.ur.ac.rw"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              unipod.ur.ac.rw
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
