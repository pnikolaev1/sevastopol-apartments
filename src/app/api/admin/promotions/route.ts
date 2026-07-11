import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

/**
 * Promotions CRUD — thin admin layer over PricingRule:
 *   SEASONAL       multiplier over a date range (>1 high season, <1 promo price)
 *   LENGTH_OF_STAY discountPct from minNights
 *   LAST_MINUTE    discountPct when check-in is within daysBeforeCheckIn
 */
const ruleShape = z
  .object({
    apartmentId: z.string(),
    type: z.enum(["SEASONAL", "LENGTH_OF_STAY", "LAST_MINUTE"]),
    name: z.string().min(1).max(120),
    active: z.boolean().default(true),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    multiplier: z.number().min(0.1).max(10).nullable().optional(),
    minNights: z.number().int().min(1).max(365).nullable().optional(),
    discountPct: z.number().int().min(1).max(90).nullable().optional(),
    daysBeforeCheckIn: z.number().int().min(1).max(365).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "SEASONAL" && (!val.startDate || !val.endDate || !val.multiplier)) {
      ctx.addIssue({ code: "custom", message: "SEASONAL needs startDate, endDate and multiplier" });
    }
    if (val.type === "LENGTH_OF_STAY" && (!val.minNights || !val.discountPct)) {
      ctx.addIssue({ code: "custom", message: "LENGTH_OF_STAY needs minNights and discountPct" });
    }
    if (val.type === "LAST_MINUTE" && (!val.daysBeforeCheckIn || !val.discountPct)) {
      ctx.addIssue({ code: "custom", message: "LAST_MINUTE needs daysBeforeCheckIn and discountPct" });
    }
  });

function toData(input: z.infer<typeof ruleShape>) {
  return {
    apartmentId: input.apartmentId,
    type: input.type,
    name: input.name,
    active: input.active,
    startDate: input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : null,
    endDate: input.endDate ? new Date(`${input.endDate}T00:00:00.000Z`) : null,
    multiplier: input.multiplier ?? null,
    minNights: input.minNights ?? null,
    discountPct: input.discountPct ?? null,
    daysBeforeCheckIn: input.daysBeforeCheckIn ?? null,
  };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ruleShape.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });
  }

  const apartment = await prisma.apartment.findUnique({
    where: { id: parsed.data.apartmentId },
    select: { id: true },
  });
  if (!apartment) return NextResponse.json({ error: "Apartment not found" }, { status: 404 });

  const rule = await prisma.pricingRule.create({ data: toData(parsed.data) });
  return NextResponse.json({ rule });
}

const patchSchema = z.object({ id: z.string() }).and(ruleShape);

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });
  }

  const { id, ...rest } = parsed.data;
  const existing = await prisma.pricingRule.findUnique({ where: { id }, select: { apartmentId: true } });
  if (!existing || existing.apartmentId !== rest.apartmentId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rule = await prisma.pricingRule.update({ where: { id }, data: toData(rest) });
  return NextResponse.json({ rule });
}

const deleteSchema = z.object({ id: z.string() });

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 });

  await prisma.pricingRule.delete({ where: { id: parsed.data.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
