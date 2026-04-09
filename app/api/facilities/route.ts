import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canManageLabs } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const createFacilitySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(120),
  labId: z.string().min(1),
  availabilityStatus: z
    .enum(["AVAILABLE", "UNAVAILABLE", "MAINTENANCE"])
    .optional(),
  usageRules: z.string().max(4000).optional().nullable(),
});

export async function GET() {
  const facilities = await prisma.facility.findMany({
    orderBy: { name: "asc" },
    include: { lab: { select: { id: true, name: true, status: true } } },
  });
  return NextResponse.json({ facilities });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageLabs(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = createFacilitySchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid input", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const lab = await prisma.lab.findUnique({ where: { id: payload.data.labId } });
  if (!lab) {
    return NextResponse.json({ error: "Lab not found" }, { status: 404 });
  }

  const facility = await prisma.facility.create({
    data: {
      name: payload.data.name,
      type: payload.data.type,
      labId: payload.data.labId,
      availabilityStatus: payload.data.availabilityStatus ?? "AVAILABLE",
      usageRules: payload.data.usageRules ?? null,
    },
  });

  return NextResponse.json({ facility }, { status: 201 });
}
