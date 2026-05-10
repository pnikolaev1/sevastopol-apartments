import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db/prisma";
import { sendBookingConfirmation, sendOwnerNotification } from "@/lib/email/templates";
import { logger } from "@/lib/logger";
import { BookingStatus } from "@prisma/client";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    logger.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;

    const booking = await prisma.booking.findUnique({
      where: { stripePaymentIntentId: pi.id },
      include: { guest: true, apartment: { include: { translations: { where: { locale: "en" } } } } },
    });

    if (!booking) {
      logger.error("Booking not found for payment intent", { piId: pi.id });
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      // Idempotent — already confirmed
      return NextResponse.json({ ok: true });
    }

    // Confirm booking in DB
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CONFIRMED,
        stripePaidAt: new Date(),
        expiresAt: null,
      },
    });

    const aptName = booking.apartment.translations[0]?.name ?? booking.apartment.slug;

    // Send emails in parallel — don't fail the webhook if email fails
    await Promise.allSettled([
      sendBookingConfirmation({
        bookingId: booking.id,
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        guestEmail: booking.guest.email,
        aptName,
        checkIn: booking.checkIn.toISOString().split("T")[0] ?? "",
        checkOut: booking.checkOut.toISOString().split("T")[0] ?? "",
        guests: booking.guestCount,
        totalEur: Number(booking.totalAmount),
        locale: booking.guest.locale,
      }),
      sendOwnerNotification({
        bookingId: booking.id,
        aptName,
        checkIn: booking.checkIn.toISOString().split("T")[0] ?? "",
        checkOut: booking.checkOut.toISOString().split("T")[0] ?? "",
        guests: booking.guestCount,
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        guestEmail: booking.guest.email,
        guestPhone: booking.guest.phone ?? "",
        totalEur: Number(booking.totalAmount),
      }),
    ]);

    logger.info("Booking confirmed via webhook", { bookingId: booking.id });
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    logger.warn("Payment failed", { piId: pi.id });
    // Booking stays PENDING; guest will retry
  }

  return NextResponse.json({ ok: true });
}
