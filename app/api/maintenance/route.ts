import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  canBookFacility,
  canManageMaintenance,
} from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const createMaintenanceSchema = z.object({
  equipmentId: z.string().min(1),
  issueDescription: z.string().min(1).max(5000),
  technician: z.string().max(200).optional().nullable(),
});

const updateMaintenanceSchema = z.object({
  id: z.string().min(1),
  maintenanceStatus: z
    .enum(["REPORTED", "IN_PROGRESS", "RESOLVED"])
    .optional(),
  technician: z.string().max(200).optional().nullable(),
  resolvedAt: z.coerce.date().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = canManageMaintenance(session.user.role)
    ? {}
    : { reportedById: session.user.id };

  const logs = await prisma.maintenanceLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      equipment: { select: { id: true, name: true, status: true } },
      reportedBy: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json({ maintenance: logs });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canBookFacility(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = createMaintenanceSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid input", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const equipment = await prisma.equipment.findUnique({
    where: { id: payload.data.equipmentId },
  });
  if (!equipment) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.create({
      data: {
        equipmentId: payload.data.equipmentId,
        reportedById: session.user.id,
        issueDescription: payload.data.issueDescription,
        technician: payload.data.technician ?? null,
        maintenanceStatus: "REPORTED",
      },
    });
    await tx.equipment.update({
      where: { id: payload.data.equipmentId },
      data: { status: "MAINTENANCE" },
    });
    return log;
  });

  return NextResponse.json({ maintenance: created }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageMaintenance(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = updateMaintenanceSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid input", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await prisma.maintenanceLog.update({
    where: { id: payload.data.id },
    data: {
      maintenanceStatus: payload.data.maintenanceStatus,
      technician: payload.data.technician,
      resolvedAt: payload.data.resolvedAt,
    },
  });

  if (payload.data.maintenanceStatus === "RESOLVED") {
    await prisma.equipment.update({
      where: { id: updated.equipmentId },
      data: { status: "AVAILABLE" },
    });
  }

  return NextResponse.json({ maintenance: updated });
}
