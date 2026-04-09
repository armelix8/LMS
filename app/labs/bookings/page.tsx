import { redirect } from "next/navigation";
import {
  createBookingAction,
  createEquipmentBookingAction,
  updateBookingStatusAction,
  updateEquipmentBookingStatusAction,
} from "@/app/actions/lab-management";
import { auth } from "@/auth";
import { formatBookingStatus, statusBadgeClass } from "@/lib/lab-display";
import { canManageBookings } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";

export const metadata = { title: "Booking Calendar" };

export default async function BookingCalendarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/labs/bookings");

  const [labs, equipment, bookings, equipmentBookings] = await Promise.all([
    prisma.lab.findMany({
      where: { status: { in: ["ACTIVE", "MAINTENANCE"] } },
      orderBy: { name: "asc" },
    }),
    prisma.equipment.findMany({
      where: { status: { in: ["AVAILABLE", "IN_USE"] } },
      orderBy: { name: "asc" },
      include: { lab: { select: { name: true } } },
    }),
    prisma.labBooking.findMany({
      where:
        session.user.role === "ADMIN" || session.user.role === "INSTRUCTOR"
          ? {}
          : { userId: session.user.id },
      orderBy: { startTime: "asc" },
      include: {
        lab: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.equipmentBooking.findMany({
      where:
        session.user.role === "ADMIN" || session.user.role === "INSTRUCTOR"
          ? {}
          : { userId: session.user.id },
      orderBy: { startTime: "asc" },
      include: {
        equipment: { include: { lab: { select: { name: true } } } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const canReview = canManageBookings(session.user.role);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Booking calendar
      </h1>

      <form
        action={createBookingAction}
        className="mt-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Reserve a lab
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
            Start time
            <input name="startTime" type="datetime-local" required className={inputClass} />
          </label>
          <label className="block text-sm">
            End time
            <input name="endTime" type="datetime-local" required className={inputClass} />
          </label>
        </div>
        <button className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
          Submit booking
        </button>
      </form>

      <form
        action={async (formData) => {
          "use server";
          const equipmentId = String(formData.get("equipmentId") ?? "");
          await createEquipmentBookingAction(equipmentId, formData);
        }}
        className="mt-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Reserve specific equipment
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            Equipment
            <select name="equipmentId" required className={inputClass}>
              <option value="">Select equipment</option>
              {equipment.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.lab.name})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Start time
            <input name="startTime" type="datetime-local" required className={inputClass} />
          </label>
          <label className="block text-sm">
            End time
            <input name="endTime" type="datetime-local" required className={inputClass} />
          </label>
        </div>
        <button className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
          Submit equipment booking
        </button>
      </form>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Reservations
        </h2>
        <ul className="mt-4 space-y-3">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
            >
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {booking.lab.name}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {booking.startTime.toLocaleString()} -{" "}
                {booking.endTime.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                By:{" "}
                {booking.user.name ?? booking.user.email}
              </p>
              <p className="mt-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(booking.status)}`}
                >
                  {formatBookingStatus(booking.status)}
                </span>
              </p>
              {canReview ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <form
                    action={updateBookingStatusAction.bind(
                      null,
                      booking.id,
                      "approve",
                    )}
                  >
                    <button className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                      Approve
                    </button>
                  </form>
                  <form
                    action={updateBookingStatusAction.bind(
                      null,
                      booking.id,
                      "reject",
                    )}
                  >
                    <button className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 dark:border-red-700 dark:text-red-300">
                      Reject
                    </button>
                  </form>
                  <form
                    action={updateBookingStatusAction.bind(
                      null,
                      booking.id,
                      "complete",
                    )}
                  >
                    <button className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold dark:border-slate-700">
                      Complete
                    </button>
                  </form>
                </div>
              ) : booking.status === "PENDING" || booking.status === "APPROVED" ? (
                <div className="mt-2">
                  <form
                    action={updateBookingStatusAction.bind(
                      null,
                      booking.id,
                      "cancel",
                    )}
                  >
                    <button className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold dark:border-slate-700">
                      Cancel booking
                    </button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
          {bookings.length === 0 ? (
            <li className="text-sm text-slate-500 dark:text-slate-400">
              No lab bookings yet.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Equipment reservations
        </h2>
        <ul className="mt-4 space-y-3">
          {equipmentBookings.map((booking) => (
            <li
              key={booking.id}
              className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
            >
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {booking.equipment.name} · {booking.equipment.lab.name}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {booking.startTime.toLocaleString()} -{" "}
                {booking.endTime.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                By: {booking.user.name ?? booking.user.email}
              </p>
              <p className="mt-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(booking.status)}`}
                >
                  {formatBookingStatus(booking.status)}
                </span>
              </p>
              {canReview ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <form
                    action={updateEquipmentBookingStatusAction.bind(
                      null,
                      booking.id,
                      "approve",
                    )}
                  >
                    <button className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                      Approve
                    </button>
                  </form>
                  <form
                    action={updateEquipmentBookingStatusAction.bind(
                      null,
                      booking.id,
                      "reject",
                    )}
                  >
                    <button className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 dark:border-red-700 dark:text-red-300">
                      Reject
                    </button>
                  </form>
                </div>
              ) : booking.status === "PENDING" || booking.status === "APPROVED" ? (
                <div className="mt-2">
                  <form
                    action={updateEquipmentBookingStatusAction.bind(
                      null,
                      booking.id,
                      "cancel",
                    )}
                  >
                    <button className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold dark:border-slate-700">
                      Cancel booking
                    </button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
          {equipmentBookings.length === 0 ? (
            <li className="text-sm text-slate-500 dark:text-slate-400">
              No equipment bookings yet.
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
