import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canManageEquipment } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const createEquipmentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional().nullable(),
  featuredImageUrl: z.string().url().max(2000).optional().nullable(),
  labId: z.string().min(1),
  category: z.string().min(1).max(120),
  brand: z.string().max(120).optional().nullable(),
  model: z.string().max(120).optional().nullable(),
  serialNumber: z.string().max(120).optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
  condition: z.string().max(120).optional().nullable(),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "BROKEN"]).optional(),
});

export async function GET() {
  const equipment = await prisma.equipment.findMany({
    orderBy: { createdAt: "desc" },
    include: { lab: { select: { id: true, name: true, status: true } } },
  });
  return NextResponse.json({ equipment });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageEquipment(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = createEquipmentSchema.safeParse(await req.json());
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

  const equipment = await prisma.equipment.create({
    data: {
      name: payload.data.name,
      description: payload.data.description ?? null,
      featuredImageUrl: payload.data.featuredImageUrl ?? null,
      labId: payload.data.labId,
      category: payload.data.category,
      brand: payload.data.brand ?? null,
      model: payload.data.model ?? null,
      serialNumber: payload.data.serialNumber ?? null,
      purchaseDate: payload.data.purchaseDate ?? null,
      condition: payload.data.condition ?? null,
      status: payload.data.status ?? "AVAILABLE",
    },
  });
  return NextResponse.json({ equipment }, { status: 201 });
}
