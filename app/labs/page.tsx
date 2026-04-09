import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  formatLabStatus,
  formatLabType,
  statusBadgeClass,
} from "@/lib/lab-display";
import { canManageLabs } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Labs Dashboard" };

type Props = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 8;

export default async function LabsDashboardPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/labs");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const typeFilter = (sp.type ?? "ALL").trim();
  const statusFilter = (sp.status ?? "ALL").trim();
  const page = Math.max(1, Math.round(Number(sp.page) || 1));

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { location: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(typeFilter !== "ALL"
      ? {
          labType:
            typeFilter === "ELECTRONICS" ||
            typeFilter === "WOODWORKING" ||
            typeFilter === "THREE_D_PRINTING" ||
            typeFilter === "CNC" ||
            typeFilter === "LASER" ||
            typeFilter === "GENERAL"
              ? typeFilter
              : undefined,
        }
      : {}),
    ...(statusFilter !== "ALL"
      ? {
          status:
            statusFilter === "ACTIVE" ||
            statusFilter === "MAINTENANCE" ||
            statusFilter === "CLOSED"
              ? statusFilter
              : undefined,
        }
      : {}),
  };

  const [labs, totalLabs, equipmentCount, activeBookings, maintenanceIssues] =
    await Promise.all([
      prisma.lab.findMany({
        where,
        orderBy: { name: "asc" },
        include: { _count: { select: { equipment: true, facilities: true } } },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.lab.count({ where }),
      prisma.equipment.count(),
      prisma.labBooking.count({
        where: { status: { in: ["PENDING", "APPROVED"] } },
      }),
      prisma.maintenanceLog.count({
        where: { maintenanceStatus: { in: ["REPORTED", "IN_PROGRESS"] } },
      }),
    ]);

  const canManage = canManageLabs(session.user.role);
  const totalPages = Math.max(1, Math.ceil(totalLabs / PAGE_SIZE));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Lab Overview
          </h1>
        </div>
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Labs</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{totalLabs}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Equipment</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{equipmentCount}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Bookings</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{activeBookings}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Maintenance Issues</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{maintenanceIssues}</p>
        </article>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form method="get" className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Filter:</span>
            <input type="hidden" name="q" value={q} />
            <button
              name="type"
              value="ALL"
              className={`rounded px-2 py-1 ${typeFilter === "ALL" ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200" : "text-slate-600 dark:text-slate-400"}`}
            >
              All Types
            </button>
            <button
              name="status"
              value="ALL"
              className={`rounded px-2 py-1 ${statusFilter === "ALL" ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200" : "text-slate-600 dark:text-slate-400"}`}
            >
              All Statuses
            </button>
          </form>
          <form method="get" className="flex w-full max-w-xs items-center gap-2 sm:w-auto">
            <input type="hidden" name="type" value={typeFilter} />
            <input type="hidden" name="status" value={statusFilter} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search labs..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">
              Search
            </button>
          </form>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Lab Name</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Type</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Location</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Capacity</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300"></th>
              </tr>
            </thead>
            <tbody>
              {labs.map((lab) => (
                <tr key={lab.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/labs/${lab.id}`}
                      className="text-sky-700 hover:underline dark:text-sky-300"
                    >
                      {lab.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatLabType(lab.labType)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{lab.location}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{lab.capacity}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(lab.status)}`}>
                      {formatLabStatus(lab.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <Link
                        href={`/labs/${lab.id}/edit`}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                      >
                        Edit
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
              {labs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No labs found for the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <Link
            href={`/labs?q=${encodeURIComponent(q)}&type=${typeFilter}&status=${statusFilter}&page=${Math.max(1, page - 1)}`}
            className={`rounded-md border px-3 py-1.5 ${page <= 1 ? "pointer-events-none border-slate-200 text-slate-400 dark:border-slate-800" : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"}`}
          >
            Prev
          </Link>
          <span className="px-2 text-slate-600 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/labs?q=${encodeURIComponent(q)}&type=${typeFilter}&status=${statusFilter}&page=${Math.min(totalPages, page + 1)}`}
            className={`rounded-md border px-3 py-1.5 ${page >= totalPages ? "pointer-events-none border-slate-200 text-slate-400 dark:border-slate-800" : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"}`}
          >
            Next
          </Link>
        </div>
      </section>

    </main>
  );
}
