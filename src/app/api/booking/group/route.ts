import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { stripe, toStripeAmount } from "@/lib/stripe";
import { checkAvailability } from "@/lib/availability";
import { calculatePrice } from "@/lib/pricing";
import { allocateGuests } from "@/lib/group-booking";
import { syncApartmentIcal } from "@/lib/ical/sync";
import { bookingRatelimit, getIp } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { BookingSource, BookingStatus } from "@prisma/client";

const bodySchema = z.object({
  apartmentIds: z.array(z.string().cuid()).min(2).max(3),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(2).max(20),
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

/**
 * Group checkout: books several apartments for the same stay under ONE
 * Stripe payment. All bookings share a groupId and the PaymentIntent id;
 * the webhook confirms the whole group when the payment succeeds.
 */
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

  const { apartmentIds, checkIn: checkInStr, checkOut: checkOutStr, guests, guest, specialRequests } = parsed.data;

  if (new Set(apartmentIds).size !== apartmentIds.length) {
    return NextResponse.json({ error: "Duplicate apartments" }, { status: 422 });
  }

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 422 });
  }

  const apartments = await prisma.apartment.findMany({
    where: { id: { in: apartmentIds }, active: true },
    select: {
      id: true,
      slug: true,
      bookingIcalUrl: true,
      airbnbIcalUrl: true,
      basePriceEur: true,
      cleaningFeeEur: true,
      weekendUpliftPct: true,
      maxGuests: true,
      minStayNights: true,
      pricingRules: { where: { active: true } },
      dateOverrides: { where: { priceEur: { not: null } } },
    },
  });
  if (apartments.length !== apartmentIds.length) {
    return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
  }
  // Keep the caller's selection order for guest allocation.
  apartments.sort((a, b) => apartmentIds.indexOf(a.id) - apartmentIds.indexOf(b.id));

  const allocation = allocateGuests(guests, apartments);
  if (!allocation) {
    return NextResponse.json({ error: "group_size_mismatch" }, { status: 422 });
  }

  // Authoritative per-apartment price with the allocated guest counts.
  const pricings = apartments.map((apt) => ({
    apt,
    guestCount: allocation.get(apt.id) ?? 1,
    pricing: calculatePrice({
      basePriceEur: apt.basePriceEur,
      cleaningFeeEur: apt.cleaningFeeEur,
      weekendUpliftPct: apt.weekendUpliftPct,
      checkIn,
      checkOut,
      guestCount: allocation.get(apt.id) ?? 1,
      pricingRules: apt.pricingRules,
      dateOverrides: apt.dateOverrides,
      applyDirectDiscount: true,
    }),
  }));

  for (const { apt, pricing } of pricings) {
    if (pricing.nights < apt.minStayNights) {
      return NextResponse.json({ error: "min_stay_not_met", apartment: apt.slug }, { status: 422 });
    }
  }
  const totalEur = Math.round(pricings.reduce((s, p) => s + p.pricing.totalEur, 0) * 100) / 100;

  // Real-time iCal re-fetch for every apartment before holding the slots.
  const syncPromises: Array<Promise<unknown>> = [];
  for (const apt of apartments) {
    if (apt.bookingIcalUrl) syncPromises.push(syncApartmentIcal(apt.id, BookingSource.BOOKING_COM, apt.bookingIcalUrl));
    if (apt.airbnbIcalUrl) syncPromises.push(syncApartmentIcal(apt.id, BookingSource.AIRBNB, apt.airbnbIcalUrl));
  }
  await Promise.allSettled(syncPromises);

  const guestRecord = await prisma.guest.upsert({
    where: { email: guest.email },
    create: { email: guest.email, firstName: guest.firstName, lastName: guest.lastName, phone: guest.phone, country: guest.country, locale: guest.locale },
    update: { firstName: guest.firstName, lastName: guest.lastName, phone: guest.phone, country: guest.country },
  });

  const groupId = crypto.randomUUID();

  // Hold every slot atomically. Advisory locks are taken in a canonical
  // (sorted) order so two overlapping group checkouts can't deadlock, and the
  // per-apartment lock also serialises against single-apartment checkouts.
  const bookings = await prisma.$transaction(async (tx) => {
    for (const id of [...apartmentIds].sort()) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
    }

    for (const apt of apartments) {
      const availability = await checkAvailability(apt.id, checkIn, checkOut, undefined, tx);
      if (!availability.available) return null;
    }

    const created = [];
    for (const { apt, guestCount, pricing } of pricings) {
      created.push(
        await tx.booking.create({
          data: {
            apartmentId: apt.id,
            guestId: guestRecord.id,
            status: BookingStatus.PENDING,
            source: BookingSource.DIRECT,
            groupId,
            checkIn,
            checkOut,
            nights: pricing.nights,
            guestCount,
            baseAmount: pricing.subtotalEur,
            cleaningFee: pricing.cleaningFeeEur,
            touristTax: pricing.touristTaxEur,
            totalAmount: pricing.totalEur,
            currency: "EUR",
            specialRequests: specialRequests ?? null,
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          },
        })
      );
    }
    return created;
  });

  if (!bookings) {
    return NextResponse.json({ error: "dates_unavailable" }, { status: 409 });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: toStripeAmount(totalEur),
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    metadata: {
      groupId,
      bookingIds: bookings.map((b) => b.id).join(","),
      guestEmail: guest.email,
      checkIn: checkInStr,
      checkOut: checkOutStr,
    },
  });

  await prisma.booking.updateMany({
    where: { groupId },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  logger.info("Group booking created (pending payment)", { groupId, bookings: bookings.length, totalEur });

  return NextResponse.json({
    groupId,
    bookingIds: bookings.map((b) => b.id),
    bookingId: bookings[0]?.id,
    clientSecret: paymentIntent.client_secret,
    totalEur,
  });
}
