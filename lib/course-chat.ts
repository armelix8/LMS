import type { CourseChatMessageVM } from "@/components/course-chat-panel";

type Row = {
  id: string;
  body: string;
  createdAt: Date;
  senderId: string;
  sender: { name: string | null; email: string | null };
};

export function toCourseChatMessageVMs(rows: Row[]): CourseChatMessageVM[] {
  return rows.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    senderId: m.senderId,
    senderLabel: m.sender.name?.trim() || m.sender.email || "User",
  }));
}
