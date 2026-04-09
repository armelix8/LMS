import { redirect } from "next/navigation";
import Link from "next/link";
import { createEquipmentAction } from "@/app/actions/lab-management";
import { auth } from "@/auth";
import { formatEquipmentStatus, statusBadgeClass } from "@/lib/lab-display";
import { canManageEquipment } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";

export const metadata = { title: "Equipment Management" };

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 8;

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
    ...(statusFilter !== "ALL"
      ? {
          status:
            statusFilter === "AVAILABLE" ||
            statusFilter === "IN_USE" ||
            statusFilter === "MAINTENANCE" ||
            statusFilter === "BROKEN"
              ? statusFilter
              : undefined,
        }
      : {}),
  };

  const [labs, equipment, totalEquipment, availableCount, inUseCount, maintenanceCount, categories] = await Promise.all([
    prisma.lab.findMany({ orderBy: { name: "asc" } }),
    prisma.equipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { lab: { select: { name: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.equipment.count({ where }),
    prisma.equipment.count({ where: { ...where, status: "AVAILABLE" } }),
    prisma.equipment.count({ where: { ...where, status: "IN_USE" } }),
    prisma.equipment.count({ where: { ...where, status: "MAINTENANCE" } }),
    prisma.equipment.findMany({
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
  ]);
  const canManage = canManageEquipment(session.user.role);
  const totalPages = Math.max(1, Math.ceil(totalEquipment / PAGE_SIZE));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Equipment Inventory
        </h1>
        {canManage ? (
          <a
            href="#add-equipment"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
          >
            + Add Equipment
          </a>
        ) : null}
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Equipment</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{totalEquipment}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Available</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{availableCount}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">In Use</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{inUseCount}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Under Maintenance</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{maintenanceCount}</p>
        </article>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form method="get" className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Filter:</span>
            <input type="hidden" name="q" value={q} />
            <select
              name="category"
              defaultValue={categoryFilter}
              className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="IN_USE">In Use</option>
              <option value="MAINTENANCE">Under Maintenance</option>
              <option value="BROKEN">Broken</option>
            </select>
            <button className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700">
              Apply
            </button>
          </form>

          <form method="get" className="flex w-full max-w-xs items-center gap-2 sm:w-auto">
            <input type="hidden" name="category" value={categoryFilter} />
            <input type="hidden" name="status" value={statusFilter} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search equipment..."
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
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Category</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Lab</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Condition</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300"></th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/labs/equipment/${item.id}`}
                      className="text-sky-700 hover:underline dark:text-sky-300"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.category}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.lab.name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.condition ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(item.status)}`}
                    >
                      {formatEquipmentStatus(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {canManage ? (
                        <Link
                          href={`/labs/equipment/${item.id}/edit`}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                        >
                          Edit
                        </Link>
                      ) : null}
                      <Link
                        href={`/labs/equipment/${item.id}?tab=maintenance`}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                      >
                        View Logs
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {equipment.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No equipment found for the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <Link
            href={`/labs/equipment?q=${encodeURIComponent(q)}&category=${encodeURIComponent(categoryFilter)}&status=${encodeURIComponent(statusFilter)}&page=${Math.max(1, page - 1)}`}
            className={`rounded-md border px-3 py-1.5 ${page <= 1 ? "pointer-events-none border-slate-200 text-slate-400 dark:border-slate-800" : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"}`}
          >
            Prev
          </Link>
          <span className="px-2 text-slate-600 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/labs/equipment?q=${encodeURIComponent(q)}&category=${encodeURIComponent(categoryFilter)}&status=${encodeURIComponent(statusFilter)}&page=${Math.min(totalPages, page + 1)}`}
            className={`rounded-md border px-3 py-1.5 ${page >= totalPages ? "pointer-events-none border-slate-200 text-slate-400 dark:border-slate-800" : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"}`}
          >
            Next
          </Link>
        </div>
      </section>

      {canManage ? (
        <form
          id="add-equipment"
          action={createEquipmentAction}
          className="mt-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50"
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
              Category
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
          <button className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
            Add equipment
          </button>
        </form>
      ) : null}
    </main>
  );
}
