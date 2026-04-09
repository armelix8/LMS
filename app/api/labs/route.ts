import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canManageLabs } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const createLabSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional().nullable(),
  featuredImageUrl: z.string().url().max(2000).optional().nullable(),
  location: z.string().min(1).max(300),
  capacity: z.coerce.number().int().min(1).max(10000),
  labType: z.enum([
    "ELECTRONICS",
    "WOODWORKING",
    "THREE_D_PRINTING",
    "CNC",
    "LASER",
    "GENERAL",
  ]),
  status: z.enum(["ACTIVE", "MAINTENANCE", "CLOSED"]).optional(),
});

export async function GET() {
  const labs = await prisma.lab.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { equipment: true, facilities: true } },
    },
  });
  return NextResponse.json({ labs });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageLabs(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = createLabSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid input", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const lab = await prisma.lab.create({
    data: {
      name: payload.data.name,
      description: payload.data.description ?? null,
      featuredImageUrl: payload.data.featuredImageUrl ?? null,
      location: payload.data.location,
      capacity: payload.data.capacity,
      labType: payload.data.labType,
      status: payload.data.status ?? "ACTIVE",
    },
  });

  return NextResponse.json({ lab }, { status: 201 });
}
