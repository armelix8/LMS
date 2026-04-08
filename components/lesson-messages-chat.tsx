"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { markStudentMessagesOpened } from "@/app/actions/course-messages";
import {
  CourseChatPanel,
  type CourseChatMessageVM,
} from "@/components/course-chat-panel";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
  courseTitle: string;
  enrollmentId: string;
  studentUserId: string;
  messages: CourseChatMessageVM[];
  sendMessage: (
    formData: FormData,
  ) => Promise<{ ok?: true; error?: string } | void>;
  unreadCount: number;
};

export function LessonMessagesChat({
  slug,
  courseTitle,
  enrollmentId,
  studentUserId,
  messages,
  sendMessage,
  unreadCount,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    void markStudentMessagesOpened(enrollmentId).then(() => router.refresh());
  }, [open, enrollmentId, router]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-wrap items-center gap-2 text-left text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        <span>Messages with instructor</span>
        {unreadCount > 0 ? (
          <span
            className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-amber-600"
            title={`${unreadCount} unread message${unreadCount === 1 ? "" : "s"} from your instructor`}
          >
            {unreadCount > 99 ? "99+" : unreadCount} new
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-messages-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"
            aria-label="Close messages"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:max-h-[85vh] sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <div className="min-w-0">
                <h2
                  id="lesson-messages-title"
                  className="truncate text-base font-semibold text-slate-900 dark:text-white"
                >
                  Messages
                </h2>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {courseTitle}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/learn/${slug}/messages`}
                  className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  onClick={() => setOpen(false)}
                >
                  Full page
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              <CourseChatPanel
                enrollmentId={enrollmentId}
                studentUserId={studentUserId}
                messages={messages}
                sendMessage={sendMessage}
                livePollMs={5000}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
