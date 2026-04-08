import { createCourse } from "@/app/actions/lms";
import {
  InstructorBreadcrumbs,
  InstructorPageShell,
  InstructorPageTitle,
  instructorCardClass,
  instructorFileInputClass,
  instructorHintClass,
  instructorInputClass,
  instructorLabelClass,
  instructorPrimaryButtonClass,
  instructorTextareaClass,
} from "@/components/instructor-page-chrome";

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
    <InstructorPageShell maxWidthClass="max-w-2xl">
      <InstructorBreadcrumbs
        items={[
          { href: "/instructor/courses", label: "Courses" },
          { label: "New course" },
        ]}
      />

      <div className="mt-6">
        <InstructorPageTitle
          eyebrow="Create"
          title="New course"
          description="Name your course and add a short description. You will add modules, lessons, quizzes, and assignments after this step."
        />
      </div>

      {errorMessage && (
        <p
          className="mt-6 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <form action={createCourse} className="mt-8 space-y-6">
        <div className={instructorCardClass}>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Basics
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            This information appears in the course catalog when the course is
            published.
          </p>
          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="title" className={instructorLabelClass}>
                Course title
              </label>
              <input
                id="title"
                name="title"
                required
                autoComplete="off"
                placeholder="e.g. Introduction to additive manufacturing"
                className={instructorInputClass}
              />
            </div>
            <div>
              <label htmlFor="description" className={instructorLabelClass}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={6}
                placeholder="Summarize outcomes, audience, and what learners will build or submit."
                className={instructorTextareaClass}
              />
            </div>
          </div>
        </div>

        <div className={instructorCardClass}>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Cover image
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Optional. A strong cover improves discovery in the catalog.
          </p>
          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="thumbnailFile" className={instructorLabelClass}>
                Upload from your computer
              </label>
              <input
                id="thumbnailFile"
                name="thumbnailFile"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className={instructorFileInputClass}
              />
              <p className={instructorHintClass}>
                PNG, JPG, WebP, or GIF — max 10 MB. Uploading replaces any URL
                below.
              </p>
            </div>
            <div>
              <label htmlFor="thumbnail" className={instructorLabelClass}>
                Or image URL
              </label>
              <input
                id="thumbnail"
                name="thumbnail"
                type="url"
                placeholder="https://example.com/course-cover.jpg"
                className={`${instructorInputClass} font-mono text-[13px]`}
              />
              <p className={instructorHintClass}>
                HTTPS link only. Leave both empty if you do not want a cover
                yet.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 pt-8 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You can edit all of this later from course settings.
          </p>
          <button type="submit" className={instructorPrimaryButtonClass}>
            Create course
          </button>
        </div>
      </form>
    </InstructorPageShell>
  );
}
