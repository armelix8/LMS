"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)]/30 dark:text-white";

const labelClass =
  "block text-sm font-medium text-slate-700 dark:text-slate-300";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setPending(false);
      setError(data.error ?? "Registration failed.");
      return;
    }
    const sign = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    setPending(false);
    if (sign?.error) {
      setError("Account created but sign-in failed. Try signing in manually.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="name" className={labelClass}>
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Password (min 8 characters)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--brand-500)] py-3 text-sm font-semibold text-white shadow-sm shadow-[var(--brand-900)]/20 transition hover:bg-[var(--brand-600)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-400)] disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link
          href="/auth/signin"
          className="font-semibold text-[var(--brand-700)] hover:text-[var(--brand-600)] dark:text-[var(--brand-300)]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
