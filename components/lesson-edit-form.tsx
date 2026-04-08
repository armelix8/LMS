"use client";

import { useState } from "react";
import { LessonMarkdownEditor } from "@/components/lesson-markdown-editor";

type Props = {
  action: (formData: FormData) => Promise<void>;
  initialTitle: string;
  initialVideoUrl: string;
  initialContent: string;
};

export function LessonEditForm({
  action,
  initialTitle,
  initialVideoUrl,
  initialContent,
}: Props) {
  const [content, setContent] = useState(initialContent);
  const [contentError, setContentError] = useState<string | null>(null);

  return (
    <form
      action={action}
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        if (!content.trim()) {
          e.preventDefault();
          setContentError("Add some lesson content before saving.");
          return;
        }
        setContentError(null);
      }}
    >
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
          defaultValue={initialTitle}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
      </div>
      <div>
        <label
          htmlFor="videoUrl"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Video embed URL (optional)
        </label>
        <input
          id="videoUrl"
          name="videoUrl"
          type="url"
          placeholder="https://www.youtube.com/embed/..."
          defaultValue={initialVideoUrl}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
      </div>
      <div>
        <span
          id="content-label"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Content
        </span>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Markdown with live preview. Use headings, lists, links, and code blocks
          as needed.
        </p>
        <div className="mt-2">
          <input type="hidden" name="content" value={content} />
          <LessonMarkdownEditor
            value={content}
            onChange={(v) => {
              setContent(v);
              if (contentError) setContentError(null);
            }}
          />
          {contentError ? (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {contentError}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="submit"
        className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Save lesson
      </button>
    </form>
  );
}
