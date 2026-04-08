"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

export type CourseChatMessageVM = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  senderLabel: string;
};

type Props = {
  enrollmentId: string;
  studentUserId: string;
  messages: CourseChatMessageVM[];
  sendMessage: (
    formData: FormData,
  ) => Promise<{ ok?: true; error?: string } | void>;
  /** Poll server for new messages (ms). 0 = off. Default 5000. */
  livePollMs?: number;
};

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
    >
      {pending ? "Sending…" : "Send"}
    </button>
  );
}

const DEFAULT_POLL_MS = 5000;

export function CourseChatPanel({
  enrollmentId,
  studentUserId,
  messages,
  sendMessage,
  livePollMs = DEFAULT_POLL_MS,
}: Props) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!livePollMs || livePollMs <= 0) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      router.refresh();
    };
    const id = setInterval(tick, livePollMs);
    return () => clearInterval(id);
  }, [router, livePollMs, enrollmentId]);

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40">
      <div
        ref={listRef}
        className="max-h-72 min-h-[12rem] space-y-3 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-4"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            No messages yet. Say hello to start the conversation.
          </p>
        ) : (
          messages.map((m) => {
            const fromStudent = m.senderId === studentUserId;
            return (
              <div
                key={m.id}
                className={`flex w-full ${fromStudent ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    fromStudent
                      ? "rounded-tl-sm border border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      : "rounded-tr-sm bg-indigo-600 text-white dark:bg-indigo-500"
                  }`}
                >
                  <p className="text-xs font-medium opacity-80">
                    {fromStudent ? "Student" : "Instructor"} · {m.senderLabel}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`mt-1 text-[10px] opacity-70 ${
                      fromStudent ? "text-slate-500" : "text-indigo-100"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form
        action={async (formData) => {
          setSendError(null);
          const res = await sendMessage(formData);
          if (res && typeof res === "object" && "error" in res && res.error) {
            setSendError(res.error);
            return;
          }
          router.refresh();
        }}
        className="flex flex-col gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60"
      >
        {sendError && (
          <p className="text-sm text-red-600 dark:text-red-400">{sendError}</p>
        )}
        <div className="flex gap-2">
          <label htmlFor={`chat-${enrollmentId}`} className="sr-only">
            Message
          </label>
          <textarea
            id={`chat-${enrollmentId}`}
            name="body"
            rows={2}
            required
            placeholder="Type a message…"
            className="min-w-0 flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
          <SendButton />
        </div>
      </form>
    </div>
  );
}
