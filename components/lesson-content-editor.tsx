"use client";

import dynamic from "next/dynamic";

const BlockNoteLoading = () => (
  <div className="flex min-h-[540px] items-center justify-center rounded-b-xl border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
    Loading block editor…
  </div>
);

/** SSR off — BlockNote is client-only. */
const LessonBlockNoteEditorDynamic = dynamic(
  () =>
    import("@/components/lesson-block-note-editor").then((m) => m.LessonBlockNoteEditor),
  { ssr: false, loading: () => <BlockNoteLoading /> },
);

type Props = {
  /** Server snapshot for first editor mount (do not pass live edited string). */
  defaultSerialized: string;
  initialVideoUrl: string;
  content: string;
  onContentChange: (value: string) => void;
  contentError: string | null;
  remountKey: string;
};

/**
 * Gutenberg-style block editor (BlockNote): slash menu, + inserter, video/image blocks.
 * Serialized document is stored in `Lesson.content` with `__BN1__` prefix.
 */
export function LessonContentEditor({
  defaultSerialized,
  initialVideoUrl,
  content,
  onContentChange,
  contentError,
  remountKey,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.04] dark:border-slate-700 dark:bg-slate-900/35 dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.25)] dark:ring-white/[0.05]">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/95 via-white to-teal-50/40 px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/95 dark:to-teal-950/25 sm:px-6">
        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
          Lesson content
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Block editor — type{" "}
          <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
            /
          </kbd>{" "}
          for headings, lists, images, video, quotes, and more. Use the{" "}
          <span className="font-medium text-slate-700 dark:text-slate-200">+</span>{" "}
          beside a block to insert. In a video block, paste a YouTube, Vimeo,
          Loom, or Google Drive link, another https embed URL, or a direct file
          URL (for example{" "}
          <span className="font-mono text-xs">.mp4</span>).
        </p>
      </div>

      <div className="px-5 pb-5 pt-4 sm:px-6">
        <input type="hidden" name="content" value={content} />
        <LessonBlockNoteEditorDynamic
          key={remountKey}
          initialRaw={defaultSerialized}
          initialVideoUrl={initialVideoUrl}
          onSerializedChange={onContentChange}
        />
        {contentError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {contentError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
