import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateEquipmentAction } from "@/app/actions/lab-management";
import { auth } from "@/auth";
import { canManageEquipment } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Edit Equipment" };

export default async function EditEquipmentPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/labs/equipment");
  if (!canManageEquipment(session.user.role)) redirect("/labs/equipment");

  const { id } = await params;
  const [equipment, labs] = await Promise.all([
    prisma.equipment.findUnique({ where: { id } }),
    prisma.lab.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!equipment) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/labs/equipment"
        className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300"
      >
        ← Back to equipment
      </Link>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Edit equipment
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Update inventory details, assignment, and operational status.
        </p>

        <form
          action={updateEquipmentAction.bind(null, equipment.id)}
          className="mt-6 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Name
              <input
                name="name"
                required
                defaultValue={equipment.name}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Lab
              <select name="labId" required defaultValue={equipment.labId} className={inputClass}>
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Category
              <input
                name="category"
                required
                defaultValue={equipment.category}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Status
              <select name="status" defaultValue={equipment.status} className={inputClass}>
                <option value="AVAILABLE">Available</option>
                <option value="IN_USE">In use</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="BROKEN">Broken</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              Brand
              <input
                name="brand"
                defaultValue={equipment.brand ?? ""}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Model
              <input
                name="model"
                defaultValue={equipment.model ?? ""}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Serial number
              <input
                name="serialNumber"
                defaultValue={equipment.serialNumber ?? ""}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block text-sm">
            Condition
            <input
              name="condition"
              defaultValue={equipment.condition ?? ""}
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            Description
            <textarea
              name="description"
              rows={4}
              defaultValue={equipment.description ?? ""}
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            Featured image URL
            <input
              name="featuredImageUrl"
              type="url"
              defaultValue={equipment.featuredImageUrl ?? ""}
              placeholder="https://example.com/equipment.jpg"
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            Or upload from PC
            <input
              name="featuredImageFile"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className={inputClass}
            />
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
              Save changes
            </button>
            <Link
              href="/labs/equipment"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
