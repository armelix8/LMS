"use client";

import { useMemo } from "react";
import { BlockNoteView } from "@blocknote/ariakit";
import { useCreateBlockNote } from "@blocknote/react";
import { useEditorChange } from "@blocknote/react";
import { usePrefersColorScheme } from "@blocknote/react";
import type { Block } from "@blocknote/core";
import "@blocknote/ariakit/style.css";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/react/style.css";
import {
  isBlockNoteContent,
  legacyLessonToBlocks,
  parseBlockNoteDocument,
  serializeBlockNoteDocument,
} from "@/lib/lesson-blocknote";
import { UNIPOD_BLOCKNOTE_SCHEMA } from "@/lib/unipod-blocknote-schema";

type Props = {
  /** Full stored `Lesson.content` (block JSON or legacy Markdown). */
  initialRaw: string;
  /** Legacy top-level video URL merged into initial blocks when not BlockNote. */
  initialVideoUrl: string;
  onSerializedChange: (serialized: string) => void;
};

export function LessonBlockNoteEditor({
  initialRaw,
  initialVideoUrl,
  onSerializedChange,
}: Props) {
  const scheme = usePrefersColorScheme();

  const initialContent = useMemo(() => {
    if (isBlockNoteContent(initialRaw)) {
      return parseBlockNoteDocument(initialRaw) ?? undefined;
    }
    return legacyLessonToBlocks(initialRaw, initialVideoUrl);
  }, [initialRaw, initialVideoUrl]);

  const editor = useCreateBlockNote(
    {
      schema: UNIPOD_BLOCKNOTE_SCHEMA,
      initialContent,
    },
    [initialRaw, initialVideoUrl],
  );

  useEditorChange(
    (ed) => {
      onSerializedChange(serializeBlockNoteDocument(ed.document as Block[]));
    },
    editor,
  );

  const theme = scheme === "dark" ? "dark" : "light";

  return (
    <div className="bn-editor-shell rounded-b-xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-950">
      <BlockNoteView editor={editor} theme={theme} />
    </div>
  );
}
