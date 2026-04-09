import type { Role } from "@prisma/client";

const styles: Record<Role, string> = {
  STUDENT:
    "bg-slate-100 text-slate-800 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-400/20",
  INSTRUCTOR:
    "bg-indigo-50 text-indigo-900 ring-indigo-600/20 dark:bg-indigo-950/80 dark:text-indigo-100 dark:ring-indigo-400/30",
  ADMIN:
    "bg-violet-50 text-violet-900 ring-violet-600/20 dark:bg-violet-950/80 dark:text-violet-100 dark:ring-violet-400/30",
  LAB_TECHNICIAN:
    "bg-amber-50 text-amber-900 ring-amber-600/20 dark:bg-amber-950/80 dark:text-amber-100 dark:ring-amber-400/30",
};

const labels: Record<Role, string> = {
  STUDENT: "Learner",
  INSTRUCTOR: "Instructor",
  ADMIN: "Administrator",
  LAB_TECHNICIAN: "Lab Technician",
};

export function ProfileRoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${styles[role]}`}
    >
      {labels[role]}
    </span>
  );
}
