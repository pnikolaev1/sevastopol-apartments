import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;

const putSchema = z.object({
  apartmentId: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // inclusive
  // Absent field = leave unchanged on existing overrides; null price = remove override price
  priceEur: z.number().min(0).max(100000).nullable().optional(),
  closed: z.boolean().optional(),
  minNights: z.number().int().min(1).max(365).nullable().optional(),
  clear: z.boolean().optional(), // remove all overrides in the range
});

/** Upserts rate-calendar overrides for every date in the inclusive range. */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 });

  const { apartmentId, startDate, endDate, priceEur, closed, minNights, clear } = parsed.data;

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (end < start) return NextResponse.json({ error: "endDate before startDate" }, { status: 422 });
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  if (days > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: `Range too long (max ${MAX_RANGE_DAYS} days)` }, { status: 422 });
  }

  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: { id: true },
  });
  if (!apartment) return NextResponse.json({ error: "Apartment not found" }, { status: 404 });

  if (clear) {
    await prisma.dateOverride.deleteMany({
      where: { apartmentId, date: { gte: start, lte: end } },
    });
    return NextResponse.json({ ok: true, cleared: days });
  }

  const create: { priceEur?: number | null; closed?: boolean; minNights?: number | null } = {};
  const update: typeof create = {};
  if (priceEur !== undefined) {
    create.priceEur = priceEur;
    update.priceEur = priceEur;
  }
  if (closed !== undefined) {
    create.closed = closed;
    update.closed = closed;
  }
  if (minNights !== undefined) {
    create.minNights = minNights;
    update.minNights = minNights;
  }

  const ops = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * DAY_MS);
    ops.push(
      prisma.dateOverride.upsert({
        where: { apartmentId_date: { apartmentId, date } },
        create: { apartmentId, date, ...create },
        update,
      })
    );
  }
  await prisma.$transaction(ops);

  // Prune rows that no longer override anything (base price, open, no min-stay)
  await prisma.dateOverride.deleteMany({
    where: { apartmentId, priceEur: null, closed: false, minNights: null },
  });

  return NextResponse.json({ ok: true, updated: days });
}
