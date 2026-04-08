"use client";

import { useState } from "react";
import { instructorPrimaryButtonClass } from "@/components/instructor-page-chrome";
import { LessonContentEditor } from "@/components/lesson-content-editor";

type Props = {
  action: (formData: FormData) => Promise<void>;
  lessonId: string;
  initialTitle: string;
  initialVideoUrl: string;
  initialContent: string;
};

export function LessonEditForm({
  action,
  lessonId,
  initialTitle,
  initialVideoUrl,
  initialContent,
}: Props) {
  const [content, setContent] = useState(initialContent);
  const [contentError, setContentError] = useState<string | null>(null);

  return (
    <form
      id="edit-lesson-body"
      action={action}
      className="scroll-mt-28 space-y-8 lg:scroll-mt-32"
      onSubmit={(e) => {
        if (!content.trim()) {
          e.preventDefault();
          setContentError("Add some written content before saving.");
          return;
        }
        setContentError(null);
      }}
    >
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700 dark:bg-slate-900/40 dark:ring-white/[0.04] sm:p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Lesson title
        </h2>
        <label htmlFor="title" className="sr-only">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={initialTitle}
          placeholder="e.g. Introduction to parametric CAD"
          className="mt-3 w-full border-0 border-b-2 border-slate-200 bg-transparent px-0 py-2 text-xl font-semibold text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:text-white dark:focus:border-sky-400"
        />
      </section>

      <LessonContentEditor
        remountKey={lessonId}
        defaultSerialized={initialContent}
        initialVideoUrl={initialVideoUrl}
        content={content}
        onContentChange={(v) => {
          setContent(v);
          if (contentError) setContentError(null);
        }}
        contentError={contentError}
      />

      <div className="flex flex-col gap-4 border-t border-slate-200 pt-8 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Learners see updates after you save. If you add a lesson video URL, it
          appears above the written section on the lesson page.
        </p>
        <button
          type="submit"
          className={`${instructorPrimaryButtonClass} min-h-11 min-w-[10rem] px-8`}
        >
          Save lesson
        </button>
      </div>
    </form>
  );
}
