import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canManageLabs } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const updateLabSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional().nullable(),
  featuredImageUrl: z.string().url().max(2000).optional().nullable(),
  location: z.string().min(1).max(300).optional(),
  capacity: z.coerce.number().int().min(1).max(10000).optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "CLOSED"]).optional(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const lab = await prisma.lab.findUnique({
    where: { id },
    include: {
      equipment: { orderBy: { createdAt: "desc" } },
      facilities: { orderBy: { name: "asc" } },
    },
  });
  if (!lab) {
    return NextResponse.json({ error: "Lab not found" }, { status: 404 });
  }
  return NextResponse.json({ lab });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageLabs(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = updateLabSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid input", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await ctx.params;
  const updated = await prisma.lab.update({
    where: { id },
    data: payload.data,
  });
  return NextResponse.json({ lab: updated });
}
