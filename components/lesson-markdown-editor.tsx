"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[450px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
      Loading editor…
    </div>
  ),
});

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Shown when editor is loading (SSR / chunk) */
  "aria-label"?: string;
};

export function LessonMarkdownEditor({
  value,
  onChange,
  "aria-label": ariaLabel = "Lesson content (Markdown)",
}: Props) {
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setColorMode(mq.matches ? "dark" : "light");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div
      className="lesson-md-editor w-full overflow-hidden rounded-xl border border-slate-300 dark:border-slate-600 [&_.w-md-editor]:bg-white [&_.w-md-editor]:dark:bg-slate-950"
      data-color-mode={colorMode}
    >
      <MDEditor
        value={value}
        onChange={(v) => onChange(typeof v === "string" ? v : "")}
        height={480}
        visibleDragbar
        textareaProps={{
          "aria-label": ariaLabel,
          placeholder: "Write lesson content in Markdown…",
        }}
        preview="live"
      />
    </div>
  );
}
