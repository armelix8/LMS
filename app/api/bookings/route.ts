import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { BOOKING_PURPOSE_MAX_LEN } from "@/lib/booking-purpose";
import { bookingStartIsInThePast } from "@/lib/booking-time";
import { canBookFacility } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const createBookingSchema = z.object({
  labId: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  purpose: z
    .string()
    .trim()
    .min(1, "purpose is required")
    .max(BOOKING_PURPOSE_MAX_LEN),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.labBooking.findMany({
    where: {},
    orderBy: { startTime: "asc" },
    include: {
      lab: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json({ bookings });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canBookFacility(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = createBookingSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid input", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  if (payload.data.endTime <= payload.data.startTime) {
    return NextResponse.json(
      { error: "endTime must be after startTime" },
      { status: 400 },
    );
  }

  if (bookingStartIsInThePast(payload.data.startTime)) {
    return NextResponse.json(
      { error: "startTime must be in the future" },
      { status: 400 },
    );
  }

  const lab = await prisma.lab.findUnique({ where: { id: payload.data.labId } });
  if (!lab) {
    return NextResponse.json({ error: "Lab not found" }, { status: 404 });
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const overlap = await tx.labBooking.findFirst({
        where: {
          labId: payload.data.labId,
          status: { in: ["PENDING", "APPROVED"] },
          startTime: { lt: payload.data.endTime },
          endTime: { gt: payload.data.startTime },
        },
      });
      if (overlap) return { overlap: true as const, booking: null };
      const booking = await tx.labBooking.create({
        data: {
          userId: session.user.id,
          labId: payload.data.labId,
          startTime: payload.data.startTime,
          endTime: payload.data.endTime,
          purpose: payload.data.purpose,
          status: "PENDING",
        },
      });
      return { overlap: false as const, booking };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    },
  );

  if (result.overlap) {
    return NextResponse.json(
      { error: "Selected time overlaps with an existing booking" },
      { status: 409 },
    );
  }
  return NextResponse.json({ booking: result.booking }, { status: 201 });
}
