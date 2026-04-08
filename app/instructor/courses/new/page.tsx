import { createCourse } from "@/app/actions/lms";

export const metadata = { title: "New course" };

type Props = {
  searchParams: Promise<{ error?: string; reason?: string }>;
};

const errors: Record<string, string> = {
  required: "Title and description are required.",
  "invalid-thumbnail":
    "Featured image URL must be valid https, or leave the URL field blank.",
};

export default async function NewCoursePage({ searchParams }: Props) {
  const { error, reason } = await searchParams;
  const errorMessage =
    error === "invalid-course-image"
      ? reason === "size"
        ? "Cover image must be 10 MB or smaller."
        : "Cover image must be PNG, JPG, WebP, or GIF."
      : error
        ? (errors[error] ?? null)
        : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        New course
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        You can add modules and lessons after saving the basics.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {errorMessage}
        </p>
      )}

      <form action={createCourse} className="mt-8 space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="thumbnailFile"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Featured image from computer
          </label>
          <input
            id="thumbnailFile"
            name="thumbnailFile"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-950/50 dark:file:text-indigo-200"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            PNG, JPG, WebP, or GIF — max 10 MB. Upload overrides the URL below.
          </p>
        </div>
        <div>
          <label
            htmlFor="thumbnail"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Or featured image URL
          </label>
          <input
            id="thumbnail"
            name="thumbnail"
            type="url"
            placeholder="https://…"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Optional. Leave both blank for no cover image.
          </p>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Create and continue
        </button>
      </form>
    </main>
  );
}
