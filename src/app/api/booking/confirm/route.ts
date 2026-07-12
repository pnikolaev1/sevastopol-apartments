import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { stripe, toStripeAmount } from "@/lib/stripe";
import { checkAvailability } from "@/lib/availability";
import { calculatePrice } from "@/lib/pricing";
import { syncApartmentIcal } from "@/lib/ical/sync";
import { bookingRatelimit, getIp } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { BookingSource, BookingStatus } from "@prisma/client";

// NOTE: the client still sends a `pricing` object, but the server NEVER trusts
// it — the authoritative price is recomputed from the apartment's stored rates
// below. It is simply absent from this schema, so Zod strips it and it is
// ignored.
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
  // Rate limiting
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
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 422 });
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

  if (!apt) {
    return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
  }

  // Enforce booking policy server-side (client-side limits are not trustworthy).
  if (guests > apt.maxGuests) {
    return NextResponse.json({ error: "too_many_guests" }, { status: 422 });
  }

  // Authoritative price: recomputed from the apartment's stored rates. The
  // client-submitted total is never used — this is what prevents an attacker
  // from paying an arbitrary amount.
  const pricing = calculatePrice({
    basePriceEur: apt.basePriceEur,
    cleaningFeeEur: apt.cleaningFeeEur,
    weekendUpliftPct: apt.weekendUpliftPct,
    checkIn,
    checkOut,
    guestCount: guests,
    pricingRules: apt.pricingRules,
    dateOverrides: apt.dateOverrides,
    applyDirectDiscount: true,
  });

  if (pricing.nights < apt.minStayNights) {
    return NextResponse.json({ error: "min_stay_not_met" }, { status: 422 });
  }

  // Real-time iCal re-fetch before confirming (safety net)
  const syncPromises: Array<Promise<unknown>> = [];
  if (apt.bookingIcalUrl) {
    syncPromises.push(syncApartmentIcal(apt.id, BookingSource.BOOKING_COM, apt.bookingIcalUrl));
  }
  if (apt.airbnbIcalUrl) {
    syncPromises.push(syncApartmentIcal(apt.id, BookingSource.AIRBNB, apt.airbnbIcalUrl));
  }
  await Promise.allSettled(syncPromises);

  // Upsert guest
  const guestRecord = await prisma.guest.upsert({
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
      country: guest.country,
    },
  });

  // Secure the slot and create the PENDING booking atomically. A transaction-
  // scoped advisory lock (keyed on the apartment) serialises concurrent booking
  // attempts for the same unit, closing the check-then-insert race that would
  // otherwise allow two guests to both pass the availability check and
  // double-book. The booking is created *before* the Stripe PaymentIntent so
  // the slot is held under the lock; the PI id is attached immediately after.
  const booking = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${apt.id}))`;

    const availability = await checkAvailability(apt.id, checkIn, checkOut, undefined, tx);
    if (!availability.available) return null;

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
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2h to complete payment
      },
    });
  });

  if (!booking) {
    return NextResponse.json({ error: "dates_unavailable" }, { status: 409 });
  }

  // Create the Stripe Payment Intent for the server-computed amount.
  const paymentIntent = await stripe.paymentIntents.create({
    amount: toStripeAmount(pricing.totalEur),
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    metadata: {
      apartmentId: apt.id,
      bookingId: booking.id,
      guestEmail: guest.email,
      checkIn: checkInStr,
      checkOut: checkOutStr,
    },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  logger.info("Booking created (pending payment)", { bookingId: booking.id });

  return NextResponse.json({
    bookingId: booking.id,
    clientSecret: paymentIntent.client_secret,
  });
}
