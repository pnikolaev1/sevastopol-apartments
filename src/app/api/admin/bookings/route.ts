import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { checkAvailability } from "@/lib/availability";
import { calculatePrice, calculateNights } from "@/lib/pricing";
import { z } from "zod";

const bodySchema = z.object({
  apartmentId: z.string(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestCount: z.number().int().min(1).max(20),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  totalEur: z.number().min(0).max(100000).optional(), // agreed price; computed when absent
  internalNotes: z.string().max(1000).optional(),
});

/** Creates a manual (phone/WhatsApp) booking that blocks its dates. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 });

  const data = parsed.data;
  const checkIn = new Date(`${data.checkIn}T00:00:00.000Z`);
  const checkOut = new Date(`${data.checkOut}T00:00:00.000Z`);
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: "checkOut must be after checkIn" }, { status: 422 });
  }

  const apartment = await prisma.apartment.findUnique({
    where: { id: data.apartmentId },
    include: {
      pricingRules: { where: { active: true } },
      dateOverrides: { where: { priceEur: { not: null } } },
    },
  });
  if (!apartment) return NextResponse.json({ error: "Apartment not found" }, { status: 404 });

  const pricing = calculatePrice({
    basePriceEur: apartment.basePriceEur,
    cleaningFeeEur: apartment.cleaningFeeEur,
    weekendUpliftPct: apartment.weekendUpliftPct,
    checkIn,
    checkOut,
    guestCount: data.guestCount,
    pricingRules: apartment.pricingRules,
    dateOverrides: apartment.dateOverrides,
    applyDirectDiscount: false, // owner sets the agreed price for manual bookings
  });
  const totalEur = data.totalEur ?? pricing.totalEur;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Advisory lock serialises against the public booking flow's own
      // check-then-insert, closing the race on the same apartment.
      const lockKey = BigInt("0x" + crypto.createHash("md5").update(apartment.id).digest("hex").slice(0, 15));
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

      const availability = await checkAvailability(apartment.id, checkIn, checkOut, undefined, tx);
      if (!availability.available) {
        throw new Error(`UNAVAILABLE:${availability.conflictSource}`);
      }

      // Guest.email is unique+required; synthesize one for phone-only guests.
      const email =
        data.email && data.email.length > 0
          ? data.email.toLowerCase()
          : `manual-${crypto.randomBytes(6).toString("hex")}@manual.local`;

      const guest = await tx.guest.upsert({
        where: { email },
        create: {
          email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone ?? null,
          locale: "bg",
        },
        update: { firstName: data.firstName, lastName: data.lastName, phone: data.phone ?? null },
      });

      return tx.booking.create({
        data: {
          apartmentId: apartment.id,
          guestId: guest.id,
          status: "CONFIRMED",
          source: "MANUAL",
          checkIn,
          checkOut,
          nights: calculateNights(checkIn, checkOut),
          guestCount: data.guestCount,
          baseAmount: pricing.subtotalEur,
          cleaningFee: pricing.cleaningFeeEur,
          touristTax: pricing.touristTaxEur,
          totalAmount: totalEur,
          internalNotes: data.internalNotes ?? null,
        },
      });
    });

    return NextResponse.json({ booking: { id: booking.id }, computedTotal: pricing.totalEur });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("UNAVAILABLE:")) {
      return NextResponse.json(
        { error: "Датите не са свободни", conflictSource: err.message.split(":")[1] },
        { status: 409 }
      );
    }
    throw err;
  }
}
