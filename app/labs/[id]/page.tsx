import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  formatBookingStatus,
  formatEquipmentStatus,
  formatLabStatus,
  formatLabType,
  formatMaintenanceStatus,
  statusBadgeClass,
} from "@/lib/lab-display";
import { canManageLabs } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; week?: string }>;
};

type TabKey = "overview" | "equipment" | "bookings" | "maintenance";

function weekStartMonday(d: Date): Date {
  const c = new Date(d);
  const day = c.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  c.setDate(c.getDate() + diff);
  c.setHours(0, 0, 0, 0);
  return c;
}

function parseWeekStart(value: string | undefined): Date {
  if (!value) return weekStartMonday(new Date());
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return weekStartMonday(new Date());
  return weekStartMonday(parsed);
}

function shortDayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function hourLabel(h: number): string {
  return h >= 12 ? `${h === 12 ? 12 : h - 12}pm` : `${h}am`;
}

export default async function LabDetailPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/labs");

  const { id } = await params;
  const sp = await searchParams;
  const tab = (sp.tab ?? "overview") as TabKey;
  const start = parseWeekStart(sp.week);
  const previousWeek = new Date(start);
  previousWeek.setDate(previousWeek.getDate() - 7);
  const nextWeek = new Date(start);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const activeTab: TabKey =
    tab === "equipment" || tab === "bookings" || tab === "maintenance"
      ? tab
      : "overview";

  const lab = await prisma.lab.findUnique({
    where: { id },
    include: {
      equipment: { orderBy: { name: "asc" } },
      facilities: { orderBy: { name: "asc" } },
    },
  });
  if (!lab) notFound();

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const [bookings, maintenanceLogs] = await Promise.all([
    prisma.labBooking.findMany({
      where: {
        labId: lab.id,
        startTime: { gte: start, lt: end },
      },
      orderBy: { startTime: "asc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.maintenanceLog.findMany({
      where: { equipment: { labId: lab.id } },
      orderBy: { createdAt: "desc" },
      include: {
        equipment: { select: { name: true } },
        reportedBy: { select: { name: true, email: true } },
      },
    }),
  ]);

  const canManage = canManageLabs(session.user.role);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
        <div>
          <Link href="/labs" className="font-medium text-sky-700 hover:underline dark:text-sky-300">
            Labs
          </Link>{" "}
          / <span>{lab.name}</span>
        </div>
        {canManage ? (
          <Link
            href={`/labs/${lab.id}/edit`}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
          >
            Edit Lab
          </Link>
        ) : null}
      </div>

      <section className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          {lab.featuredImageUrl ? (
            <div
              className="h-20 w-20 rounded-xl border border-slate-200 bg-cover bg-center dark:border-slate-700"
              style={{ backgroundImage: `url(${lab.featuredImageUrl})` }}
              aria-label={`${lab.name} featured image`}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-sky-100 text-4xl dark:bg-sky-950/50">
              🧪
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {lab.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {lab.location}
            </p>
            {lab.description ? (
              <p className="mt-3 max-w-3xl text-sm text-slate-700 dark:text-slate-300">
                {lab.description}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Details
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Type</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200">
                {formatLabType(lab.labType)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Capacity</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200">
                {lab.capacity}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Status</dt>
              <dd>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(lab.status)}`}
                >
                  {formatLabStatus(lab.status)}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Created</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200">
                {lab.createdAt.toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <nav className="mt-5 flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        {(
          [
            ["overview", "Overview"],
            ["equipment", "Equipment"],
            ["bookings", "Bookings"],
            ["maintenance", "Maintenance"],
          ] as Array<[TabKey, string]>
        ).map(([k, label]) => (
          <Link
            key={k}
            href={`/labs/${lab.id}?tab=${k}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              activeTab === k
                ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {activeTab === "overview" ? (
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Equipment in Lab
              </h3>
              <Link
                href="/labs/equipment"
                className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300"
              >
                + Add Equipment
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {lab.equipment.slice(0, 6).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.category}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(item.status)}`}
                  >
                    {formatEquipmentStatus(item.status)}
                  </span>
                </li>
              ))}
              {lab.equipment.length === 0 ? (
                <li className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No equipment configured yet.
                </li>
              ) : null}
            </ul>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Booking Calendar
              </h3>
              <Link
                href="/labs/bookings"
                className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300"
              >
                + Add Booking
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Week of {start.toLocaleDateString()} -{" "}
                {new Date(end.getTime() - 86400000).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <Link
                  href={`/labs/${lab.id}?tab=${activeTab}&week=${previousWeek.toISOString()}`}
                  className="rounded-md border border-slate-300 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Previous
                </Link>
                <Link
                  href={`/labs/${lab.id}?tab=${activeTab}&week=${nextWeek.toISOString()}`}
                  className="rounded-md border border-slate-300 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Next
                </Link>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Booked
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Free
              </span>
            </div>
            <div className="mt-3 max-h-[26rem] overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="min-w-full table-fixed border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="w-12 border border-slate-200 bg-slate-50 px-1 py-1 dark:border-slate-700 dark:bg-slate-900/60">
                      Time
                    </th>
                    {days.map((d) => (
                      <th
                        key={d.toISOString()}
                        className="border border-slate-200 bg-slate-50 px-1 py-1 dark:border-slate-700 dark:bg-slate-900/60"
                      >
                        {shortDayLabel(d)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hours.map((h) => (
                    <tr key={h}>
                      <td className="border border-slate-200 px-1 py-1 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        {hourLabel(h)}
                      </td>
                      {days.map((d) => {
                        const slotStart = new Date(d);
                        slotStart.setHours(h, 0, 0, 0);
                        const slotEnd = new Date(slotStart);
                        slotEnd.setHours(slotStart.getHours() + 1);
                        const cellItems = bookings.filter(
                          (b) => b.startTime < slotEnd && b.endTime > slotStart,
                        );
                        const isBooked = cellItems.length > 0;
                        return (
                          <td
                            key={`${h}-${d.toISOString()}`}
                            className={`h-16 border align-top px-1 py-1 dark:border-slate-700 ${
                              isBooked
                                ? "border-rose-300 bg-rose-100/80 dark:border-rose-800 dark:bg-rose-950/40"
                                : "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                            }`}
                          >
                            {isBooked ? (
                              <span className="inline-flex rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                Booked
                              </span>
                            ) : (
                              <span className="inline-flex rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                Free
                              </span>
                            )}
                            {isBooked ? (
                              <div className="mt-1 rounded bg-white/90 p-1 text-[10px] text-slate-900 dark:bg-slate-900/70 dark:text-slate-100">
                                <p className="font-semibold">
                                  {cellItems[0].user.name ?? cellItems[0].user.email}
                                </p>
                                <p>
                                  {cellItems[0].startTime.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  -{" "}
                                  {cellItems[0].endTime.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                                {cellItems[0].purpose ? (
                                  <p className="mt-0.5 line-clamp-2 text-[9px] text-slate-600 dark:text-slate-400">
                                    {cellItems[0].purpose}
                                  </p>
                                ) : null}
                                {cellItems.length > 1 ? (
                                  <p className="mt-0.5 text-[9px]">
                                    +{cellItems.length - 1} more
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === "equipment" ? (
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Equipment
          </h3>
          <ul className="mt-3 space-y-2">
            {lab.equipment.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.category}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(item.status)}`}
                >
                  {formatEquipmentStatus(item.status)}
                </span>
              </li>
            ))}
            {lab.equipment.length === 0 ? (
              <li className="text-sm text-slate-500 dark:text-slate-400">
                No equipment in this lab.
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {activeTab === "bookings" ? (
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Bookings this week
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <Link
                href={`/labs/${lab.id}?tab=bookings&week=${previousWeek.toISOString()}`}
                className="rounded-md border border-slate-300 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Previous
              </Link>
              <Link
                href={`/labs/${lab.id}?tab=bookings&week=${nextWeek.toISOString()}`}
                className="rounded-md border border-slate-300 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Next
              </Link>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Week of {start.toLocaleDateString()} -{" "}
            {new Date(end.getTime() - 86400000).toLocaleDateString()}
          </p>
          <ul className="mt-3 space-y-2">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {lab.name}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  {b.startTime.toLocaleString()} - {b.endTime.toLocaleString()}
                </p>
                {b.purpose ? (
                  <p className="mt-2 whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      Why:{" "}
                    </span>
                    {b.purpose}
                  </p>
                ) : null}
                <p className="mt-1">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(b.status)}`}
                  >
                    {formatBookingStatus(b.status)}
                  </span>
                </p>
              </li>
            ))}
            {bookings.length === 0 ? (
              <li className="text-sm text-slate-500 dark:text-slate-400">
                No bookings for this week.
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {activeTab === "maintenance" ? (
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Maintenance
          </h3>
          <ul className="mt-3 space-y-2">
            {maintenanceLogs.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {m.equipment.name}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  {m.issueDescription}
                </p>
                <p className="mt-1">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(m.maintenanceStatus)}`}
                  >
                    {formatMaintenanceStatus(m.maintenanceStatus)}
                  </span>
                </p>
              </li>
            ))}
            {maintenanceLogs.length === 0 ? (
              <li className="text-sm text-slate-500 dark:text-slate-400">
                No maintenance logs for this lab.
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
