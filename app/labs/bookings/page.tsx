import { redirect } from "next/navigation";
import {
  createBookingAction,
  createEquipmentBookingAction,
} from "@/app/actions/lab-management";
import { auth } from "@/auth";
import { BookingAddPanel } from "@/components/booking-add-panel";
import {
  BookingCalendarGrid,
  type CalendarBookingEvent,
} from "@/components/booking-calendar-grid";
import { BOOKING_PURPOSE_MAX_LEN } from "@/lib/booking-purpose";
import { prisma } from "@/lib/prisma";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";

const textareaClass = `${inputClass} min-h-[5rem] resize-y leading-relaxed`;

export const metadata = { title: "Booking Calendar" };

async function submitEquipmentBookingForm(formData: FormData) {
  "use server";
  const equipmentId = String(formData.get("equipmentId") ?? "");
  await createEquipmentBookingAction(equipmentId, formData);
}

type Props = {
  searchParams: Promise<{ error?: string; add?: string }>;
};

export default async function BookingCalendarPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/labs/bookings");

  const sp = await searchParams;
  const bookingError = sp.error;
  const bookingErrorMessage =
    bookingError === "lab_overlap"
      ? "That time overlaps an existing pending or approved lab booking. Choose a different time or lab."
      : bookingError === "equipment_overlap"
        ? "That time overlaps an existing pending or approved booking for that equipment. Choose a different slot."
        : bookingError === "past_time"
          ? "Start time must be in the future. You cannot book a slot that has already begun."
          : null;

  const initialAddTab =
    sp.add === "equipment" || bookingError === "equipment_overlap"
      ? ("equipment" as const)
      : ("lab" as const);

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
      orderBy: { startTime: "asc" },
      include: {
        lab: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.equipmentBooking.findMany({
      orderBy: { startTime: "asc" },
      include: {
        equipment: { include: { lab: { select: { name: true } } } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const calendarEvents: CalendarBookingEvent[] = [
    ...bookings.map((b) => ({
      id: b.id,
      kind: "lab" as const,
      resourceName: b.lab.name,
      contextLine: "Lab space reservation",
      userName: b.user.name?.trim() || b.user.email || "Unknown",
      purpose: b.purpose,
      start: b.startTime.toISOString(),
      end: b.endTime.toISOString(),
      status: b.status,
    })),
    ...equipmentBookings.map((b) => ({
      id: b.id,
      kind: "equipment" as const,
      resourceName: b.equipment.name,
      contextLine: b.equipment.lab.name,
      userName: b.user.name?.trim() || b.user.email || "Unknown",
      purpose: b.purpose,
      start: b.startTime.toISOString(),
      end: b.endTime.toISOString(),
      status: b.status,
    })),
  ];

  const labForm = (
    <form id="reserve-lab" action={createBookingAction} className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        Reserve a lab
      </h3>
      <div className="grid gap-3">
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
          <input
            name="startTime"
            type="datetime-local"
            required
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          End time
          <input
            name="endTime"
            type="datetime-local"
            required
            className={inputClass}
          />
        </label>
      </div>
      <label className="block text-sm">
        Why do you need this lab?
        <textarea
          name="purpose"
          required
          rows={4}
          maxLength={BOOKING_PURPOSE_MAX_LEN}
          placeholder="e.g. Group project work, exam prep session, instructor-led lab…"
          className={textareaClass}
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
      >
        Submit lab booking
      </button>
    </form>
  );

  const equipmentForm = (
    <form
      id="reserve-equipment"
      action={submitEquipmentBookingForm}
      className="space-y-4"
    >
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        Reserve equipment
      </h3>
      <div className="grid gap-3">
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
          <input
            name="startTime"
            type="datetime-local"
            required
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          End time
          <input
            name="endTime"
            type="datetime-local"
            required
            className={inputClass}
          />
        </label>
      </div>
      <label className="block text-sm">
        Why do you need this equipment?
        <textarea
          name="purpose"
          required
          rows={4}
          maxLength={BOOKING_PURPOSE_MAX_LEN}
          placeholder="e.g. Calibration assignment, prototype build, training exercise…"
          className={textareaClass}
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
      >
        Submit equipment booking
      </button>
    </form>
  );

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Booking calendar
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        Everyone can see all lab and equipment reservations here so we avoid
        double-booking. New requests still need staff approval where your program
        requires it; overlapping pending or approved slots cannot be reserved.
      </p>
      {bookingErrorMessage ? (
        <div
          className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          {bookingErrorMessage}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <BookingCalendarGrid events={calendarEvents} />
          {calendarEvents.length > 0 ? (
            <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
              {calendarEvents.length} reservation
              {calendarEvents.length === 1 ? "" : "s"} loaded. Use{" "}
              <strong className="font-medium text-slate-600 dark:text-slate-300">
                Previous / Next
              </strong>{" "}
              if you expected a different week, or{" "}
              <strong className="font-medium text-slate-600 dark:text-slate-300">
                Today
              </strong>{" "}
              for this week.
            </p>
          ) : null}
        </div>

        <aside id="add-booking" className="w-full shrink-0 scroll-mt-24 lg:w-80 xl:w-96">
          <BookingAddPanel
            initialTab={initialAddTab}
            labForm={labForm}
            equipmentForm={equipmentForm}
          />
        </aside>
      </div>
    </main>
  );
}
