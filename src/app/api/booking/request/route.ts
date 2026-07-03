import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { bookingRatelimit, getIp } from "@/lib/ratelimit";
import { calculatePrice } from "@/lib/pricing";
import { checkAvailability } from "@/lib/availability";
import { sendOwnerBookingRequest } from "@/lib/email/templates";
import { logger } from "@/lib/logger";
import { BookingSource, BookingStatus } from "@prisma/client";

// The client sends a `pricing` object for display, but the server recomputes
// the authoritative price from stored rates and never trusts the client value.
const bodySchema = z.object({
  apartmentId: z.string().cuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(20),
  guest: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().min(7).max(20),
    country: z.string().min(2).max(100),
    locale: z.string().max(10).default("en"),
  }),
  specialRequests: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const ip = getIp(request);
  const { success } = await bookingRatelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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

  const { apartmentId, checkIn: checkInStr, checkOut: checkOutStr, guests, guest, specialRequests } = parsed.data;

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  if (
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime()) ||
    checkOut <= checkIn
  ) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 422 });
  }

  const apt = await prisma.apartment.findUnique({
    where: { id: apartmentId, active: true },
    include: {
      translations: { where: { locale: "en" } },
      pricingRules: { where: { active: true } },
    },
  });

  if (!apt) {
    return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
  }

  if (guests > apt.maxGuests) {
    return NextResponse.json({ error: "too_many_guests" }, { status: 422 });
  }

  // Authoritative price recomputed server-side — the client value is ignored.
  const pricing = calculatePrice({
    basePriceEur: apt.basePriceEur,
    cleaningFeeEur: apt.cleaningFeeEur,
    weekendUpliftPct: apt.weekendUpliftPct,
    checkIn,
    checkOut,
    guestCount: guests,
    pricingRules: apt.pricingRules,
    applyDirectDiscount: true,
  });

  if (pricing.nights < apt.minStayNights) {
    return NextResponse.json({ error: "min_stay_not_met" }, { status: 422 });
  }

  // Create the guest + PENDING booking atomically under a per-apartment
  // advisory lock, rechecking availability inside the transaction so a request
  // cannot be created for dates already taken by a confirmed/pending booking.
  const booking = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${apt.id}))`;

    const availability = await checkAvailability(apt.id, checkIn, checkOut, undefined, tx);
    if (!availability.available) return null;

    const guestRecord = await tx.guest.upsert({
      where: { email: guest.email },
      create: {
        email: guest.email,
        firstName: guest.firstName,
        lastName: guest.lastName,
        phone: guest.phone,
        country: guest.country,
        locale: guest.locale,
      },
      update: {
        firstName: guest.firstName,
        lastName: guest.lastName,
        phone: guest.phone,
      },
    });

    return tx.booking.create({
      data: {
        apartmentId: apt.id,
        guestId: guestRecord.id,
        status: BookingStatus.PENDING,
        source: BookingSource.DIRECT,
        checkIn,
        checkOut,
        nights: pricing.nights,
        guestCount: guests,
        baseAmount: pricing.subtotalEur,
        cleaningFee: pricing.cleaningFeeEur,
        touristTax: pricing.touristTaxEur,
        totalAmount: pricing.totalEur,
        currency: "EUR",
        specialRequests: specialRequests ?? null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  });

  if (!booking) {
    return NextResponse.json({ error: "dates_unavailable" }, { status: 409 });
  }

  const aptName = apt.translations[0]?.name ?? apt.slug;

  // Notify owner
  await sendOwnerBookingRequest({
    bookingId: booking.id,
    aptName,
    checkIn: checkInStr,
    checkOut: checkOutStr,
    guests,
    guestName: `${guest.firstName} ${guest.lastName}`,
    guestEmail: guest.email,
    guestPhone: guest.phone ?? "",
    totalEur: pricing.totalEur,
    specialRequests: specialRequests ?? "",
  });

  logger.info("Booking request created", { bookingId: booking.id });

  return NextResponse.json({ bookingId: booking.id });
}
