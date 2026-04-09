import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateLabAction } from "@/app/actions/lab-management";
import { auth } from "@/auth";
import { canManageLabs } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Edit Lab" };

export default async function EditLabPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/labs");
  if (!canManageLabs(session.user.role)) redirect("/labs");

  const { id } = await params;
  const lab = await prisma.lab.findUnique({ where: { id } });
  if (!lab) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/labs"
        className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300"
      >
        ← Back to labs
      </Link>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Edit lab
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Update core lab details, status, and capacity.
        </p>

        <form
          action={updateLabAction.bind(null, lab.id)}
          className="mt-6 space-y-4"
        >
          <label className="block text-sm">
            Name
            <input
              name="name"
              required
              defaultValue={lab.name}
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            Location
            <input
              name="location"
              required
              defaultValue={lab.location}
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            Description
            <textarea
              name="description"
              rows={4}
              defaultValue={lab.description ?? ""}
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            Featured image URL
            <input
              name="featuredImageUrl"
              type="url"
              defaultValue={lab.featuredImageUrl ?? ""}
              placeholder="https://example.com/lab.jpg"
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

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              Capacity
              <input
                name="capacity"
                type="number"
                min={1}
                required
                defaultValue={lab.capacity}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Lab type
              <select name="labType" defaultValue={lab.labType} className={inputClass}>
                <option value="GENERAL">General</option>
                <option value="ELECTRONICS">Electronics</option>
                <option value="WOODWORKING">Woodworking</option>
                <option value="THREE_D_PRINTING">3D Printing</option>
                <option value="CNC">CNC</option>
                <option value="LASER">Laser</option>
              </select>
            </label>
            <label className="block text-sm">
              Status
              <select name="status" defaultValue={lab.status} className={inputClass}>
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
              Save changes
            </button>
            <Link
              href="/labs"
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
