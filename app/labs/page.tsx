import Link from "next/link";
import { auth } from "@/auth";
import { LabsGuestBanner } from "@/components/labs-guest-banner";
import { LabExploreCard } from "@/components/lab-explore-card";
import { canManageLabs } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Labs & spaces",
  description:
    "Browse university labs, capacity, and equipment. Sign in to book time slots.",
};

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 9;

export default async function LabsDashboardPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
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
    ...(statusFilter !== "ALL" &&
    (statusFilter === "ACTIVE" ||
      statusFilter === "MAINTENANCE" ||
      statusFilter === "CLOSED")
      ? {
          status:
            statusFilter === "ACTIVE"
              ? ("ACTIVE" as const)
              : statusFilter === "MAINTENANCE"
                ? ("MAINTENANCE" as const)
                : ("CLOSED" as const),
        }
      : {}),
  };

  const now = new Date();
  const showAdminStats =
    !!session?.user && canManageLabs(session.user.role);

  const [labs, totalLabs, labOccupancy] = await prisma.$transaction([
    prisma.lab.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { equipment: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.lab.count({ where }),
    prisma.labBooking.groupBy({
      by: ["labId"],
      where: {
        status: { in: ["PENDING", "APPROVED"] },
        startTime: { lte: now },
        endTime: { gt: now },
      },
      _count: { _all: true },
      orderBy: { labId: "asc" },
    }),
  ]);

  let equipmentCount = 0;
  let activeBookings = 0;
  let maintenanceIssues = 0;
  if (showAdminStats) {
    const stats = await prisma.$transaction([
      prisma.equipment.count(),
      prisma.labBooking.count({
        where: { status: { in: ["PENDING", "APPROVED"] } },
      }),
      prisma.maintenanceLog.count({
        where: { maintenanceStatus: { in: ["REPORTED", "IN_PROGRESS"] } },
      }),
    ]);
    equipmentCount = stats[0];
    activeBookings = stats[1];
    maintenanceIssues = stats[2];
  }

  const bookedSeatsByLab = new Map(
    labOccupancy.map((r) => [
      r.labId,
      typeof r._count === "object" && r._count !== null && "_all" in r._count
        ? r._count._all
        : 0,
    ]),
  );

  const canManage =
    !!session?.user && canManageLabs(session.user.role);
  const totalPages = Math.max(1, Math.ceil(totalLabs / PAGE_SIZE));

  const buildListHref = (overrides: Record<string, string>) => {
    const p = new URLSearchParams();
    if (overrides.q !== undefined ? overrides.q : q) {
      p.set("q", overrides.q !== undefined ? overrides.q : q);
    }
    const s = overrides.status !== undefined ? overrides.status : statusFilter;
    if (s && s !== "ALL") p.set("status", s);
    const pg = overrides.page !== undefined ? overrides.page : String(page);
    if (pg !== "1") p.set("page", pg);
    const qs = p.toString();
    return qs ? `/labs?${qs}` : "/labs";
  };

  const isGuest = !session?.user;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Labs &amp; spaces
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Discover maker spaces and teaching labs across campus. View capacity,
            equipment counts, and live availability. Sign in to book time or
            manage resources.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/labs/bookings"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Booking calendar
          </Link>
        ) : null}
      </div>

      {isGuest ? (
        <div className="mt-8">
          <LabsGuestBanner />
        </div>
      ) : null}

      {showAdminStats ? (
        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total labs
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {totalLabs}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Equipment
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {equipmentCount}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Active bookings
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {activeBookings}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Maintenance issues
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {maintenanceIssues}
            </p>
          </article>
        </section>
      ) : null}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Status
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(["ALL", "ACTIVE", "MAINTENANCE", "CLOSED"] as const).map(
                (s) => (
                  <Link
                    key={s}
                    href={buildListHref({
                      status: s,
                      page: "1",
                    })}
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      statusFilter === s
                        ? "bg-sky-600 text-white"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                    }`}
                  >
                    {s === "ALL"
                      ? "All"
                      : s === "ACTIVE"
                        ? "Active"
                        : s === "MAINTENANCE"
                          ? "Maintenance"
                          : "Closed"}
                  </Link>
                ),
              )}
            </div>
          </div>
          <form method="get" className="flex w-full max-w-md flex-1 gap-2 lg:w-auto">
            <input type="hidden" name="status" value={statusFilter} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name or location…"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm dark:border-slate-600 dark:bg-slate-900"
            />
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {labs.map((lab) => {
            const booked = bookedSeatsByLab.get(lab.id) ?? 0;
            const seatsAvailable = Math.max(0, lab.capacity - booked);
            return (
              <LabExploreCard
                key={lab.id}
                showEditLink={canManage}
                lab={{
                  id: lab.id,
                  name: lab.name,
                  location: lab.location,
                  capacity: lab.capacity,
                  status: lab.status,
                  featuredImageUrl: lab.featuredImageUrl,
                  equipmentCount: lab._count.equipment,
                  seatsAvailable,
                }}
              />
            );
          })}
        </div>

        {labs.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No labs match your filters. Try clearing search or choosing
            &quot;All&quot; for status.
          </p>
        ) : null}

        <div className="mt-10 flex items-center justify-center gap-2 text-sm">
          <Link
            href={buildListHref({ page: String(Math.max(1, page - 1)) })}
            className={`rounded-lg border px-4 py-2 font-medium ${
              page <= 1
                ? "pointer-events-none border-slate-200 text-slate-400 dark:border-slate-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            Previous
          </Link>
          <span className="px-3 text-slate-600 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <Link
            href={buildListHref({
              page: String(Math.min(totalPages, page + 1)),
            })}
            className={`rounded-lg border px-4 py-2 font-medium ${
              page >= totalPages
                ? "pointer-events-none border-slate-200 text-slate-400 dark:border-slate-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            Next
          </Link>
        </div>
      </section>
    </main>
  );
}
