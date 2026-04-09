import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canManageEquipment } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const updateEquipmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional().nullable(),
  featuredImageUrl: z.string().url().max(2000).optional().nullable(),
  labId: z.string().min(1).optional(),
  category: z.string().min(1).max(120).optional(),
  brand: z.string().max(120).optional().nullable(),
  model: z.string().max(120).optional().nullable(),
  serialNumber: z.string().max(120).optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
  condition: z.string().max(120).optional().nullable(),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "BROKEN"]).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageEquipment(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = updateEquipmentSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid input", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  if (payload.data.labId) {
    const lab = await prisma.lab.findUnique({ where: { id: payload.data.labId } });
    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }
  }

  const { id } = await ctx.params;
  const equipment = await prisma.equipment.update({
    where: { id },
    data: payload.data,
  });
  return NextResponse.json({ equipment });
}
