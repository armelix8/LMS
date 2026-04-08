"use client";

import { useMemo } from "react";
import { BlockNoteView } from "@blocknote/ariakit";
import { useCreateBlockNote } from "@blocknote/react";
import { usePrefersColorScheme } from "@blocknote/react";
import "@blocknote/ariakit/style.css";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/react/style.css";
import { parseBlockNoteDocument } from "@/lib/lesson-blocknote";
import { UNIPOD_BLOCKNOTE_SCHEMA } from "@/lib/unipod-blocknote-schema";

type Props = {
  /** `Lesson.content` including `__BN1__` prefix. */
  raw: string;
};

export function LessonBlockNoteView({ raw }: Props) {
  const scheme = usePrefersColorScheme();

  const initialContent = useMemo(
    () => parseBlockNoteDocument(raw) ?? undefined,
    [raw],
  );

  const editor = useCreateBlockNote(
    {
      schema: UNIPOD_BLOCKNOTE_SCHEMA,
      initialContent,
    },
    [],
  );

  const theme = scheme === "dark" ? "dark" : "light";

  return (
    <div className="lesson-bn-readonly mt-8 rounded-2xl border border-slate-200/90 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
      <BlockNoteView editor={editor} editable={false} theme={theme} />
    </div>
  );
}
