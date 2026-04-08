"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
      Loading editor…
    </div>
  ),
});

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Shown when editor is loading (SSR / chunk) */
  "aria-label"?: string;
  /**
   * When true, sits flush inside a parent card (no top outer radius, shared border).
   */
  embedded?: boolean;
};

export function LessonMarkdownEditor({
  value,
  onChange,
  "aria-label": ariaLabel = "Lesson content (Markdown)",
  embedded = false,
}: Props) {
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setColorMode(mq.matches ? "dark" : "light");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const shellClass = embedded
    ? "lesson-md-editor mt-1 w-full overflow-hidden rounded-b-xl border border-slate-200 bg-white shadow-inner dark:border-slate-600 dark:bg-slate-950 [&_.w-md-editor]:rounded-b-xl [&_.w-md-editor]:bg-white [&_.w-md-editor]:dark:bg-slate-950"
    : "lesson-md-editor w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-600 dark:bg-slate-950 dark:ring-white/[0.06] [&_.w-md-editor]:bg-white [&_.w-md-editor]:dark:bg-slate-950";

  return (
    <div className={shellClass} data-color-mode={colorMode}>
      <MDEditor
        value={value}
        onChange={(v) => onChange(typeof v === "string" ? v : "")}
        height={embedded ? 520 : 480}
        visibleDragbar
        textareaProps={{
          "aria-label": ariaLabel,
          placeholder:
            "Write the lesson here. Use headings, lists, **bold**, images with ![](url), code fences, …",
        }}
        preview="live"
      />
    </div>
  );
}
