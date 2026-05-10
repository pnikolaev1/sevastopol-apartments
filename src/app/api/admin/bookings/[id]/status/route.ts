import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { BookingStatus } from "@prisma/client";
import { z } from "zod";

const bodySchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "REFUNDED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 422 });
  }

  const booking = await prisma.booking.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: parsed.data.status as BookingStatus },
  });

  return NextResponse.json({ status: updated.status });
}
