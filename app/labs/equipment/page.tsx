import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createEquipmentAction } from "@/app/actions/lab-management";
import { auth } from "@/auth";
import { formatEquipmentStatus, statusBadgeClass } from "@/lib/lab-display";
import { canManageEquipment } from "@/lib/lab-permissions";
import type { EquipmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";

export const metadata = { title: "Equipment Overview" };

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 10;

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: ReactNode;
  accent: "slate" | "emerald" | "amber" | "rose";
}) {
  const accentRing =
    accent === "emerald"
      ? "ring-emerald-200/80 dark:ring-emerald-900/50"
      : accent === "amber"
        ? "ring-amber-200/80 dark:ring-amber-900/50"
        : accent === "rose"
          ? "ring-rose-200/80 dark:ring-rose-900/50"
          : "ring-slate-200/80 dark:ring-slate-700/50";
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ${accentRing} dark:border-slate-800 dark:bg-slate-900/50`}
    >
      <div className="absolute right-4 top-4 rounded-md bg-slate-50 p-2 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
        {value}
      </p>
      {subtitle ? (
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-500">
          {subtitle}
        </p>
      ) : (
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-500">
          Items
        </p>
      )}
    </article>
  );
}

export default async function EquipmentManagementPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/labs/equipment");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const categoryFilter = (sp.category ?? "ALL").trim();
  const statusFilter = (sp.status ?? "ALL").trim();
  const page = Math.max(1, Math.round(Number(sp.page) || 1));

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
            { condition: { contains: q, mode: "insensitive" as const } },
            { lab: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(categoryFilter !== "ALL" ? { category: categoryFilter } : {}),
    ...(statusFilter !== "ALL" &&
    (statusFilter === "AVAILABLE" ||
      statusFilter === "IN_USE" ||
      statusFilter === "MAINTENANCE" ||
      statusFilter === "BROKEN")
      ? { status: statusFilter as EquipmentStatus }
      : {}),
  };

  const [labs, equipment, globalStatusGroups, categories, filteredTotal] =
    await prisma.$transaction([
      prisma.lab.findMany({ orderBy: { name: "asc" } }),
      prisma.equipment.findMany({
        where,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          category: true,
          featuredImageUrl: true,
          status: true,
          lab: { select: { name: true } },
          _count: {
            select: {
              maintenanceLogs: {
                where: { maintenanceStatus: { not: "RESOLVED" } },
              },
            },
          },
        },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.equipment.groupBy({
        by: ["status"],
        _count: { _all: true },
        orderBy: { status: "asc" },
      }),
      prisma.equipment.findMany({
        distinct: ["category"],
        orderBy: { category: "asc" },
        select: { category: true },
      }),
      prisma.equipment.count({ where }),
    ]);

  const globalCount = new Map(
    globalStatusGroups.map((r) => {
      const n =
        typeof r._count === "object" &&
        r._count !== null &&
        "_all" in r._count
          ? r._count._all
          : 0;
      return [r.status, n ?? 0] as const;
    }),
  );
  const totalAll =
    globalStatusGroups.reduce((sum, r) => {
      const n =
        typeof r._count === "object" &&
        r._count !== null &&
        "_all" in r._count
          ? r._count._all
          : 0;
      return sum + (n ?? 0);
    }, 0) ?? 0;
  const availableAll = globalCount.get("AVAILABLE") ?? 0;
  const inUseAll = globalCount.get("IN_USE") ?? 0;
  const underMaintenanceAll =
    (globalCount.get("MAINTENANCE") ?? 0) + (globalCount.get("BROKEN") ?? 0);

  const canManage = canManageEquipment(session.user.role);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  const buildListHref = (overrides: Record<string, string>) => {
    const p = new URLSearchParams();
    const qv = overrides.q !== undefined ? overrides.q : q;
    if (qv) p.set("q", qv);
    const cat =
      overrides.category !== undefined ? overrides.category : categoryFilter;
    if (cat && cat !== "ALL") p.set("category", cat);
    const st = overrides.status !== undefined ? overrides.status : statusFilter;
    if (st && st !== "ALL") p.set("status", st);
    const pg = overrides.page !== undefined ? overrides.page : String(page);
    if (pg !== "1") p.set("page", pg);
    const qs = p.toString();
    return qs ? `/labs/equipment?${qs}` : "/labs/equipment";
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Equipment Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Inventory, status, and maintenance at a glance.
          </p>
        </div>
        {canManage ? (
          <a
            href="#add-equipment"
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
          >
            + Add Equipment
          </a>
        ) : null}
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Equipment"
          value={totalAll}
          subtitle={`${totalAll} items in inventory`}
          accent="slate"
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
        />
        <StatCard
          title="Available"
          value={availableAll}
          subtitle={`${availableAll} items total`}
          accent="emerald"
          icon={
            <svg
              className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          }
        />
        <StatCard
          title="In Use"
          value={inUseAll}
          accent="amber"
          icon={
            <svg
              className="h-5 w-5 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Under Maintenance"
          value={underMaintenanceAll}
          accent="rose"
          icon={
            <svg
              className="h-5 w-5 text-rose-600 dark:text-rose-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
        />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Filter:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={buildListHref({ category: "ALL", page: "1" })}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  categoryFilter === "ALL"
                    ? "bg-sky-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                }`}
              >
                All Types
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.category}
                  href={buildListHref({ category: c.category, page: "1" })}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    categoryFilter === c.category
                      ? "bg-sky-600 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                  }`}
                >
                  {c.category}
                </Link>
              ))}
            </div>
            <span className="hidden text-slate-300 dark:text-slate-600 sm:inline">|</span>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["ALL", "All Statuses"],
                  ["AVAILABLE", "Available"],
                  ["IN_USE", "In Use"],
                  ["MAINTENANCE", "Under Maintenance"],
                  ["BROKEN", "Broken"],
                ] as const
              ).map(([value, label]) => (
                <Link
                  key={value}
                  href={buildListHref({ status: value, page: "1" })}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    statusFilter === value
                      ? "bg-sky-600 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <form method="get" className="relative w-full max-w-sm lg:w-80">
            <input type="hidden" name="category" value={categoryFilter} />
            <input type="hidden" name="status" value={statusFilter} />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search equipment..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900"

            />
          </form>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/80">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                  Equipment
                </th>
                <th className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                  Type
                </th>
                <th className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                  Lab
                </th>
                <th className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </th>
                <th className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                  Maintenance
                </th>
                <th className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((item) => {
                const openIssues = item._count.maintenanceLogs;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800 dark:bg-slate-950/20"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                          {item.featuredImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- admin URLs; avoid remotePatterns
                            <img
                              src={item.featuredImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg text-slate-400">
                              ⚙️
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/labs/equipment/${item.id}`}
                          className="font-medium text-sky-700 hover:underline dark:text-sky-300"
                        >
                          {item.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {item.lab.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(item.status)}`}
                      >
                        {formatEquipmentStatus(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {openIssues > 0 ? (
                        <Link
                          href={`/labs/equipment/${item.id}?tab=maintenance`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:underline dark:text-amber-300"
                        >
                          {item.status === "MAINTENANCE" || item.status === "BROKEN"
                            ? "Needs Service"
                            : "Minor Issues"}
                          <span aria-hidden>›</span>
                        </Link>
                      ) : (
                        <span className="text-sm text-emerald-700 dark:text-emerald-400">
                          All clear
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <Link
                          href={`/labs/equipment/${item.id}/edit`}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Edit
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {equipment.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No equipment found for the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-slate-200 px-4 py-4 text-sm dark:border-slate-800">
          <Link
            href={buildListHref({ page: String(Math.max(1, page - 1)) })}
            className={`inline-flex items-center gap-1 rounded-lg border px-4 py-2 font-medium ${
              page <= 1
                ? "pointer-events-none border-slate-200 text-slate-400 dark:border-slate-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            &lt; Prev
          </Link>
          <span className="tabular-nums text-slate-600 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <Link
            href={buildListHref({
              page: String(Math.min(totalPages, page + 1)),
            })}
            className={`inline-flex items-center gap-1 rounded-lg border px-4 py-2 font-medium ${
              page >= totalPages
                ? "pointer-events-none border-slate-200 text-slate-400 dark:border-slate-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            Next &gt;
          </Link>
        </div>
      </section>

      {canManage ? (
        <form
          id="add-equipment"
          action={createEquipmentAction}
          className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Add equipment
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Name
              <input name="name" required className={inputClass} />
            </label>
            <label className="block text-sm">
              Lab
              <select name="labId" required className={inputClass}>
                <option value="">Select lab</option>
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Category (type)
              <input name="category" required className={inputClass} />
            </label>
            <label className="block text-sm">
              Status
              <select name="status" className={inputClass}>
                <option value="AVAILABLE">Available</option>
                <option value="IN_USE">In use</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="BROKEN">Broken</option>
              </select>
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              Brand
              <input name="brand" className={inputClass} />
            </label>
            <label className="block text-sm">
              Model
              <input name="model" className={inputClass} />
            </label>
            <label className="block text-sm">
              Serial number
              <input name="serialNumber" className={inputClass} />
            </label>
          </div>
          <label className="mt-3 block text-sm">
            Condition
            <input name="condition" className={inputClass} />
          </label>
          <label className="mt-3 block text-sm">
            Description
            <textarea name="description" rows={3} className={inputClass} />
          </label>
          <label className="mt-3 block text-sm">
            Featured image URL
            <input
              name="featuredImageUrl"
              type="url"
              placeholder="https://example.com/equipment.jpg"
              className={inputClass}
            />
          </label>
          <label className="mt-3 block text-sm">
            Or upload from PC
            <input
              name="featuredImageFile"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className={inputClass}
            />
          </label>
          <button className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
            Add equipment
          </button>
        </form>
      ) : null}
    </main>
  );
}
