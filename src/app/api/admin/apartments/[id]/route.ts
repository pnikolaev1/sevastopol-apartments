import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const bodySchema = z.object({
  general: z.object({
    active: z.boolean(),
    maxGuests: z.number().int().min(1).max(20),
    bedrooms: z.number().int().min(0).max(10),
    bathrooms: z.number().int().min(0).max(10),
    sqm: z.number().int().min(1).max(1000),
    floor: z.number().int().min(0).max(100),
    basePriceEur: z.number().min(0),
    weekendUpliftPct: z.number().int().min(0).max(200),
    cleaningFeeEur: z.number().min(0),
    minStayNights: z.number().int().min(1).max(365),
  }),
  translations: z.record(
    z.enum(["bg", "en", "ro", "de"]),
    z.object({
      name: z.string().min(1).max(200),
      shortDesc: z.string().min(1).max(500),
      description: z.string().min(1),
    })
  ),
  amenities: z.array(z.string()),
  ical: z.object({
    bookingIcalUrl: z.string().url().or(z.literal("")).optional(),
    airbnbIcalUrl: z.string().url().or(z.literal("")).optional(),
  }),
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
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 422 });
  }

  const apt = await prisma.apartment.findUnique({ where: { id }, select: { id: true } });
  if (!apt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { general, translations, amenities, ical } = parsed.data;

  await prisma.$transaction(async (tx) => {
    // Update apartment base data
    await tx.apartment.update({
      where: { id },
      data: {
        active: general.active,
        maxGuests: general.maxGuests,
        bedrooms: general.bedrooms,
        bathrooms: general.bathrooms,
        sqm: general.sqm,
        floor: general.floor,
        basePriceEur: general.basePriceEur,
        weekendUpliftPct: general.weekendUpliftPct,
        cleaningFeeEur: general.cleaningFeeEur,
        minStayNights: general.minStayNights,
        bookingIcalUrl: ical.bookingIcalUrl || null,
        airbnbIcalUrl: ical.airbnbIcalUrl || null,
      },
    });

    // Update translations
    for (const [locale, trans] of Object.entries(translations)) {
      await tx.apartmentTranslation.upsert({
        where: { apartmentId_locale: { apartmentId: id, locale } },
        create: { apartmentId: id, locale, ...trans },
        update: { ...trans },
      });
    }

    // Sync amenities
    await tx.apartmentAmenity.deleteMany({ where: { apartmentId: id } });
    if (amenities.length > 0) {
      await tx.apartmentAmenity.createMany({
        data: amenities.map((amenityId) => ({ apartmentId: id, amenityId })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
