import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const bodySchema = z.object({
  notes: z.string().max(2000),
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
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }

  const booking = await prisma.booking.findUnique({ where: { id }, select: { id: true } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.booking.update({
    where: { id },
    data: { internalNotes: parsed.data.notes },
  });

  return NextResponse.json({ ok: true });
}
