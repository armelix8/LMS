import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createEquipmentBookingAction,
  updateEquipmentBookingStatusAction,
} from "@/app/actions/lab-management";
import {
  formatEquipmentStatus,
  formatBookingStatus,
  formatMaintenanceStatus,
  statusBadgeClass,
} from "@/lib/lab-display";
import { canManageBookings, canManageEquipment } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

type TabKey = "details" | "maintenance";

export default async function EquipmentDetailPage({
  params,
  searchParams,
}: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/labs/equipment");
  const { id } = await params;
  const sp = await searchParams;
  const activeTab: TabKey = sp.tab === "maintenance" ? "maintenance" : "details";

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      lab: {
        include: {
          facilities: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!equipment) notFound();

  const [maintenanceLogs, bookingSummary] = await Promise.all([
    prisma.maintenanceLog.findMany({
      where: { equipmentId: equipment.id },
      orderBy: { createdAt: "desc" },
      include: { reportedBy: { select: { name: true, email: true } } },
    }),
    prisma.equipmentBooking.findMany({
      where: {
        equipmentId: equipment.id,
      },
      orderBy: { startTime: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const openIssue = maintenanceLogs.find(
    (m) => m.maintenanceStatus !== "RESOLVED",
  );
  const canManage = canManageEquipment(session.user.role);
  const canReviewBookings = canManageBookings(session.user.role);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
        <div>
          <Link href="/labs/equipment" className="font-medium text-sky-700 hover:underline dark:text-sky-300">
            Equipment
          </Link>{" "}
          / <span>{equipment.name}</span>
        </div>
        {canManage ? (
          <Link
            href={`/labs/equipment/${equipment.id}/edit`}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
          >
            Edit Equipment
          </Link>
        ) : null}
      </div>

      <section className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          {equipment.featuredImageUrl ? (
            <div
              className="h-24 w-40 rounded-lg border border-slate-200 bg-cover bg-center dark:border-slate-700"
              style={{ backgroundImage: `url(${equipment.featuredImageUrl})` }}
              aria-label={`${equipment.name} featured image`}
            />
          ) : (
            <div className="flex h-24 w-40 items-center justify-center rounded-lg bg-slate-100 text-4xl dark:bg-slate-800">
              ⚙️
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {equipment.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {equipment.lab.name}
            </p>
            <nav className="mt-4 flex gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
              <Link
                href={`/labs/equipment/${equipment.id}?tab=details`}
                className={`rounded px-2 py-1 text-sm font-medium ${
                  activeTab === "details"
                    ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Details
              </Link>
              <Link
                href={`/labs/equipment/${equipment.id}?tab=maintenance`}
                className={`rounded px-2 py-1 text-sm font-medium ${
                  activeTab === "maintenance"
                    ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Maintenance
              </Link>
            </nav>
          </div>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Details
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Category</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200">
                {equipment.category}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Lab</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200">
                {equipment.lab.name}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Status</dt>
              <dd>
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(equipment.status)}`}>
                  {formatEquipmentStatus(equipment.status)}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Serial</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200">
                {equipment.serialNumber ?? "—"}
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      {activeTab === "details" ? (
        <section className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Status and access
              </h3>
              <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(equipment.status)}`}>
                {formatEquipmentStatus(equipment.status)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              Condition: {equipment.condition ?? "Not specified"}
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Brand / Model: {equipment.brand ?? "—"} / {equipment.model ?? "—"}
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Purchase Date:{" "}
              {equipment.purchaseDate
                ? equipment.purchaseDate.toLocaleDateString()
                : "Not recorded"}
            </p>
            {equipment.description ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {equipment.description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/labs/equipment/${equipment.id}?tab=maintenance`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                View Maintenance Logs
              </Link>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Booking Calendar
            </h3>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {bookingSummary.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recent bookings for this equipment
            </p>
            <ul className="mt-3 space-y-2">
              {bookingSummary.slice(0, 3).map((b) => (
                <li key={b.id} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {b.user.name ?? b.user.email}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {b.startTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {b.endTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(b.status)}`}>
                      {formatBookingStatus(b.status)}
                    </span>
                  </p>
                </li>
              ))}
              {bookingSummary.length === 0 ? (
                <li className="text-sm text-slate-500 dark:text-slate-400">
                  No recent bookings.
                </li>
              ) : null}
            </ul>
            <form
              action={createEquipmentBookingAction.bind(null, equipment.id)}
              className="mt-3 space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
            >
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Start
                <input
                  type="datetime-local"
                  name="startTime"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                End
                <input
                  type="datetime-local"
                  name="endTime"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
              </label>
              <button className="w-full rounded-md bg-sky-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-sky-500">
                + Add Booking
              </button>
            </form>
          </article>
        </section>
      ) : null}

      {activeTab === "maintenance" ? (
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Maintenance
          </h3>

          {openIssue ? (
            <article className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Current maintenance issue
              </p>
              <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/90">
                {openIssue.issueDescription}
              </p>
              <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
                Reported by {openIssue.reportedBy.name ?? openIssue.reportedBy.email} ·{" "}
                {openIssue.createdAt.toLocaleDateString()}
              </p>
            </article>
          ) : null}

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60">
                <tr>
                  <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                    Date
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                    Technician
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {maintenanceLogs.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {m.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {m.technician ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {m.issueDescription}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(m.maintenanceStatus)}`}
                      >
                        {formatMaintenanceStatus(m.maintenanceStatus)}
                      </span>
                    </td>
                  </tr>
                ))}
                {maintenanceLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No maintenance history yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "details" && bookingSummary.length > 0 ? (
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Booking history
          </h3>
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60">
                <tr>
                  <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                    User
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                    Time
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookingSummary.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {b.user.name ?? b.user.email}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {b.startTime.toLocaleString()} - {b.endTime.toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(b.status)}`}>
                        {formatBookingStatus(b.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        {canReviewBookings ? (
                          <>
                            <form action={updateEquipmentBookingStatusAction.bind(null, b.id, "approve")}>
                              <button className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                                Approve
                              </button>
                            </form>
                            <form action={updateEquipmentBookingStatusAction.bind(null, b.id, "reject")}>
                              <button className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 dark:border-red-700 dark:text-red-300">
                                Reject
                              </button>
                            </form>
                          </>
                        ) : b.status === "PENDING" || b.status === "APPROVED" ? (
                          <form action={updateEquipmentBookingStatusAction.bind(null, b.id, "cancel")}>
                            <button className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold dark:border-slate-700">
                              Cancel
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
