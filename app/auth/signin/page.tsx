import Link from "next/link";
import { Suspense } from "react";
import { AuthWelcomeSide } from "@/components/auth-welcome-side";
import { BrandLogo } from "@/components/brand-logo";
import { googleAuthEnabled } from "@/lib/config";
import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="grid flex-1 lg:grid-cols-[1.1fr_minmax(360px,1fr)]">
      <AuthWelcomeSide
        heading="Welcome back to the UR UniPod community"
        body="Sign in to access programs, courses, makerspaces, and a network of innovators building real prototypes at the University of Rwanda."
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
                Sign in
              </h1>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Continue with your UR UniPod account.
              </p>
              <div className="mt-8">
                <Suspense
                  fallback={
                    <div className="h-48 animate-pulse rounded-lg bg-[var(--surface-subtle)]" />
                  }
                >
                  <SignInForm googleEnabled={googleAuthEnabled} />
                </Suspense>
              </div>
              <p className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
                New to UR UniPod?{" "}
                <Link
                  href="/auth/signup"
                  className="font-semibold text-[var(--brand-700)] hover:text-[var(--brand-600)] dark:text-[var(--brand-300)]"
                >
                  Create an account
                </Link>
              </p>
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
