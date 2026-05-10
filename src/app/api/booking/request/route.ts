import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { bookingRatelimit, getIp } from "@/lib/ratelimit";
import { sendOwnerBookingRequest } from "@/lib/email/templates";
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

  const { apartmentId, checkIn: checkInStr, checkOut: checkOutStr, guests, pricing, guest, specialRequests } = parsed.data;

  const apt = await prisma.apartment.findUnique({
    where: { id: apartmentId, active: true },
    include: { translations: { where: { locale: "en" } } },
  });

  if (!apt) {
    return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
  }

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
    },
  });

  const booking = await prisma.booking.create({
    data: {
      apartmentId: apt.id,
      guestId: guestRecord.id,
      status: BookingStatus.PENDING,
      source: BookingSource.DIRECT,
      checkIn: new Date(checkInStr),
      checkOut: new Date(checkOutStr),
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
