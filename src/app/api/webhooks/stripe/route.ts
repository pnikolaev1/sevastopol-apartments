import { NextResponse } from "next/server";
import { stripe, toStripeAmount } from "@/lib/stripe";
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

    // One PaymentIntent may cover several bookings (group checkout) — the
    // intent id is shared by every booking in the group.
    const bookings = await prisma.booking.findMany({
      where: { stripePaymentIntentId: pi.id },
      include: { guest: true, apartment: { include: { translations: { where: { locale: "en" } } } } },
    });

    if (bookings.length === 0) {
      logger.error("Booking not found for payment intent", { piId: pi.id });
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const pending = bookings.filter((b) => b.status !== BookingStatus.CONFIRMED);
    if (pending.length === 0) {
      // Idempotent — already confirmed
      return NextResponse.json({ ok: true });
    }

    // Defense-in-depth: the PaymentIntent amount is created server-side from the
    // recomputed price, so this should always match the group total. If it does
    // not, something tampered between creation and capture — refuse to confirm.
    const expectedAmount = bookings.reduce(
      (sum, b) => sum + toStripeAmount(Number(b.totalAmount)),
      0
    );
    if (typeof pi.amount_received === "number" && pi.amount_received < expectedAmount) {
      logger.error("Payment amount mismatch — refusing to confirm booking(s)", {
        bookingIds: bookings.map((b) => b.id),
        received: pi.amount_received,
        expected: expectedAmount,
      });
      return NextResponse.json({ error: "amount_mismatch" }, { status: 400 });
    }

    // Confirm all bookings covered by this payment
    await prisma.booking.updateMany({
      where: { stripePaymentIntentId: pi.id },
      data: {
        status: BookingStatus.CONFIRMED,
        stripePaidAt: new Date(),
        expiresAt: null,
      },
    });

    // Send emails per booking — don't fail the webhook if email fails
    const emailTasks = pending.flatMap((booking) => {
      const aptName = booking.apartment.translations[0]?.name ?? booking.apartment.slug;
      return [
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
      ];
    });
    await Promise.allSettled(emailTasks);

    logger.info("Booking(s) confirmed via webhook", {
      bookingIds: pending.map((b) => b.id),
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    logger.warn("Payment failed", { piId: pi.id });
    // Booking stays PENDING; guest will retry
  }

  return NextResponse.json({ ok: true });
}
