import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canManageBookings } from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  decision: z.enum(["approve", "reject", "complete", "cancel"]),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageBookings(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = schema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid input", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const nextStatus =
    payload.data.decision === "approve"
      ? "APPROVED"
      : payload.data.decision === "reject"
        ? "REJECTED"
        : payload.data.decision === "complete"
          ? "COMPLETED"
          : "CANCELLED";

  const { id } = await ctx.params;
  const booking = await prisma.labBooking.update({
    where: { id },
    data: { status: nextStatus },
  });

  return NextResponse.json({ booking });
}
