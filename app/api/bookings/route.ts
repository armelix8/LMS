import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canBookFacility } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const createBookingSchema = z.object({
  labId: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where =
    session.user.role === "ADMIN" || session.user.role === "INSTRUCTOR"
      ? {}
      : { userId: session.user.id };

  const bookings = await prisma.labBooking.findMany({
    where,
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

  const lab = await prisma.lab.findUnique({ where: { id: payload.data.labId } });
  if (!lab) {
    return NextResponse.json({ error: "Lab not found" }, { status: 404 });
  }

  const overlap = await prisma.labBooking.findFirst({
    where: {
      labId: payload.data.labId,
      status: { in: ["PENDING", "APPROVED"] },
      startTime: { lt: payload.data.endTime },
      endTime: { gt: payload.data.startTime },
    },
  });
  if (overlap) {
    return NextResponse.json(
      { error: "Selected time overlaps with an existing booking" },
      { status: 409 },
    );
  }

  const booking = await prisma.labBooking.create({
    data: {
      userId: session.user.id,
      labId: payload.data.labId,
      startTime: payload.data.startTime,
      endTime: payload.data.endTime,
      status: "PENDING",
    },
  });
  return NextResponse.json({ booking }, { status: 201 });
}
