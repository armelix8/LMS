import Link from "next/link";
import { redirect } from "next/navigation";
import { changePassword, updateProfile } from "@/app/actions/profile";
import { auth } from "@/auth";
import { ProfileRoleBadge } from "@/components/profile-role-badge";
import { loadUserForProfilePage } from "@/lib/user-profile-db";

export const metadata = { title: "Profile" };

type Props = {
  searchParams: Promise<{
    error?: string;
    ok?: string;
    notice?: string;
    reason?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "name-required": "Full name is required.",
  "headline-too-long": "Professional headline must be 140 characters or fewer.",
  "bio-too-long": "Bio must be 2,000 characters or fewer.",
  "invalid-image-url": "Photo URL must be a valid https address, or leave it blank.",
  "wrong-current-password": "Current password is incorrect.",
  "password-mismatch": "New password and confirmation do not match.",
  "password-short": "New password must be at least 8 characters.",
  "no-password-account":
    "This account uses Google sign-in only—there is no password to change.",
};

const okMessages: Record<string, string> = {
  profile: "Your profile has been saved.",
  password: "Your password has been updated.",
};

const noticeMessages: Record<string, string> = {
  "headline-bio-requires-schema":
    "Your name and photo were saved. Headline and bio need newer database columns—run `npx prisma db push` (or apply migrations) on the server, then save again.",
};

export default async function ProfilePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/profile");

  const params = await searchParams;
  const err =
    params.error === "invalid-avatar-image"
      ? params.reason === "size"
        ? "Profile photo must be 5 MB or smaller."
        : "Profile photo must be PNG, JPG, WebP, or GIF."
      : params.error
        ? (errorMessages[params.error] ?? null)
        : null;
  const ok = params.ok ? okMessages[params.ok] : null;
  const notice = params.notice ? noticeMessages[params.notice] : null;

  const user = await loadUserForProfilePage(session.user.id);

  if (!user) redirect("/auth/signin");

  const hasPassword = Boolean(user.password);
  const displayName = user.name ?? "";
  const headline = user.headline ?? "";
  const bio = user.bio ?? "";
  const avatarUrl = user.image?.trim() ?? "";
  const initials = (displayName || user.email)
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <nav className="text-sm text-slate-500 dark:text-slate-400">
        <Link
          href="/dashboard"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Dashboard
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-700 dark:text-slate-300">Profile</span>
      </nav>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
        <div className="h-36 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 sm:h-40" />
        <div className="relative px-6 pb-6 sm:px-8">
          <div className="-mt-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-lg dark:border-slate-900 dark:bg-slate-800">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-xl font-bold text-slate-600 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300"
                    aria-hidden
                  >
                    {initials}
                  </div>
                )}
              </div>
              <div className="text-center sm:mb-1 sm:pb-0 sm:text-left">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {displayName || "Your name"}
                </h1>
                {headline ? (
                  <p className="mt-1 max-w-xl text-sm font-medium text-slate-600 dark:text-slate-300">
                    {headline}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Add a professional headline below.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <ProfileRoleBadge role={user.role} />
                  {user.emailVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-500/30">
                      <span aria-hidden>✓</span> Email verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {err && (
        <p
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          {err}
        </p>
      )}
      {ok && (
        <p
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
          role="status"
        >
          {ok}
        </p>
      )}
      {notice && (
        <p
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          {notice}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none sm:p-8">
            <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Professional profile
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                How you appear to instructors and peers across UNIPOD Learn.
              </p>
            </div>
            <form action={updateProfile} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={displayName}
                  autoComplete="name"
                  placeholder="Jane Doe"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label
                  htmlFor="headline"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Professional headline
                </label>
                <input
                  id="headline"
                  name="headline"
                  defaultValue={headline}
                  maxLength={140}
                  placeholder="e.g. Product designer · Digital fabrication"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  One line under your name. Max 140 characters.
                </p>
              </div>
              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={5}
                  defaultValue={bio}
                  maxLength={2000}
                  placeholder="Background, interests, or learning goals—optional."
                  className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Up to 2,000 characters. Visible where your profile is shown.
                </p>
              </div>
              <div>
                <label
                  htmlFor="avatarFile"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Profile photo from computer
                </label>
                <input
                  id="avatarFile"
                  name="avatarFile"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-950/50 dark:file:text-indigo-200"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  PNG, JPG, WebP, or GIF — max 5 MB. Uploading replaces the current
                  photo.
                </p>
              </div>
              <div>
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Or photo URL
                </label>
                <input
                  id="image"
                  name="image"
                  type="url"
                  placeholder="https://…"
                  defaultValue={
                    avatarUrl.startsWith("/uploads/") ? "" : avatarUrl
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 shadow-sm placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Use a photo hosted elsewhere, or leave blank to keep your current
                  photo when editing other fields.
                </p>
              </div>
              {avatarUrl ? (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    name="removeImage"
                    className="rounded border-slate-300"
                  />
                  Remove profile photo
                </label>
              ) : null}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                >
                  Save profile
                </button>
              </div>
            </form>
          </section>

          {hasPassword ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none sm:p-8">
              <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Security
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Change the password you use to sign in with email.
                </p>
              </div>
              <form action={changePassword} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Current password
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      New password
                    </label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Confirm new password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Minimum 8 characters. Use a unique password you do not reuse elsewhere.
                </p>
                <button
                  type="submit"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
                >
                  Update password
                </button>
              </form>
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 dark:border-slate-600 dark:bg-slate-900/30 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Security
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                This account signs in with Google (or another provider). There is
                no password stored on UNIPOD Learn. To use email and password,
                create a separate account or contact your administrator.
              </p>
            </section>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-900/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Account
              </h3>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-medium text-slate-500 dark:text-slate-400">
                    Email
                  </dt>
                  <dd className="mt-0.5 break-all font-medium text-slate-900 dark:text-white">
                    {user.email}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500 dark:text-slate-400">
                    Member since
                  </dt>
                  <dd className="mt-0.5 text-slate-900 dark:text-white">
                    {user.createdAt.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500 dark:text-slate-400">
                    Last profile update
                  </dt>
                  <dd className="mt-0.5 text-slate-900 dark:text-white">
                    {user.updatedAt.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Your name, headline, and bio may appear on course rosters, messages,
              and instructor tools. Email is not shown to other learners unless
              your program policy says otherwise.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
