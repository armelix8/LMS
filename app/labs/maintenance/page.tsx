import { redirect } from "next/navigation";
import {
  reportMaintenanceAction,
  updateMaintenanceStatusAction,
} from "@/app/actions/lab-management";
import { auth } from "@/auth";
import { formatMaintenanceStatus, statusBadgeClass } from "@/lib/lab-display";
import { canManageMaintenance } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";

export const metadata = { title: "Maintenance Panel" };

export default async function MaintenancePanelPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/labs/maintenance");

  const [equipment, logs] = await Promise.all([
    prisma.equipment.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, status: true },
    }),
    prisma.maintenanceLog.findMany({
      where: canManageMaintenance(session.user.role)
        ? {}
        : { reportedById: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        equipment: { select: { name: true } },
        reportedBy: { select: { name: true, email: true } },
      },
    }),
  ]);

  const canManage = canManageMaintenance(session.user.role);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Maintenance panel
      </h1>

      <form
        action={reportMaintenanceAction}
        className="mt-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Report equipment issue
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Equipment
            <select name="equipmentId" required className={inputClass}>
              <option value="">Select equipment</option>
              {equipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.status})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            Issue description
            <textarea
              name="issueDescription"
              required
              rows={3}
              className={inputClass}
            />
          </label>
        </div>
        <button className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
          Submit maintenance report
        </button>
      </form>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Maintenance history
        </h2>
        <ul className="mt-4 space-y-3">
          {logs.map((log) => (
            <li
              key={log.id}
              className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
            >
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {log.equipment.name}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                {log.issueDescription}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Reported by{" "}
                {log.reportedBy.name ?? log.reportedBy.email}
              </p>
              <p className="mt-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(log.maintenanceStatus)}`}
                >
                  {formatMaintenanceStatus(log.maintenanceStatus)}
                </span>
              </p>
              {canManage ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <form
                    action={updateMaintenanceStatusAction.bind(
                      null,
                      log.id,
                      "IN_PROGRESS",
                    )}
                  >
                    <button className="rounded-md border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-700 dark:border-amber-700 dark:text-amber-300">
                      In progress
                    </button>
                  </form>
                  <form
                    action={updateMaintenanceStatusAction.bind(
                      null,
                      log.id,
                      "RESOLVED",
                    )}
                  >
                    <button className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                      Resolve
                    </button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
          {logs.length === 0 ? (
            <li className="text-sm text-slate-500 dark:text-slate-400">
              No maintenance logs yet.
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
