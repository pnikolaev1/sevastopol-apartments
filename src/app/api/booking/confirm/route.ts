import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { stripe, toStripeAmount } from "@/lib/stripe";
import { checkAvailability } from "@/lib/availability";
import { syncApartmentIcal } from "@/lib/ical/sync";
import { bookingRatelimit, getIp } from "@/lib/ratelimit";
import { sendBookingConfirmation, sendOwnerNotification } from "@/lib/email/templates";
import { logger } from "@/lib/logger";
import { BookingSource, BookingStatus } from "@prisma/client";

const bodySchema = z.object({
  apartmentId: z.string().cuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(12),
  pricing: z.object({
    nights: z.number(),
    nightlyRateEur: z.number(),
    subtotalEur: z.number(),
    cleaningFeeEur: z.number(),
    touristTaxEur: z.number(),
    directDiscountEur: z.number(),
    totalEur: z.number(),
    totalBgn: z.number(),
  }),
  guest: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().min(7).max(20),
    country: z.string().min(2).max(100),
    locale: z.string().default("en"),
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

  const { apartmentId, checkIn: checkInStr, checkOut: checkOutStr, guests, pricing, guest, specialRequests } = parsed.data;

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  const apt = await prisma.apartment.findUnique({
    where: { id: apartmentId, active: true },
    select: { id: true, slug: true, bookingIcalUrl: true, airbnbIcalUrl: true },
  });

  if (!apt) {
    return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
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

  // Availability check (after fresh sync)
  const availability = await checkAvailability(apt.id, checkIn, checkOut);
  if (!availability.available) {
    return NextResponse.json({ error: "dates_unavailable" }, { status: 409 });
  }

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

  // Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: toStripeAmount(pricing.totalEur),
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    metadata: {
      apartmentId: apt.id,
      guestEmail: guest.email,
      checkIn: checkInStr,
      checkOut: checkOutStr,
    },
  });

  // Create booking in PENDING state (confirmed by webhook on payment success)
  const booking = await prisma.booking.create({
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
      stripePaymentIntentId: paymentIntent.id,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2h to complete payment
    },
  });

  logger.info("Booking created (pending payment)", { bookingId: booking.id });

  return NextResponse.json({
    bookingId: booking.id,
    clientSecret: paymentIntent.client_secret,
  });
}
