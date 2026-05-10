import { Resend } from "resend";
import { logger } from "@/lib/logger";

const IS_TEST = process.env.EMAIL_MODE !== "live";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
}

function getFrom() {
  return `${process.env.RESEND_FROM_NAME ?? "Sevastopol Apartments"} <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`;
}

function subject(base: string): string {
  return IS_TEST ? `[TEST MODE] ${base}` : base;
}

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "5areood@gmail.com";
const OWNER_PHONE = process.env.OWNER_WHATSAPP ?? "35989436230";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function waLink(text: string): string {
  return `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(text)}`;
}

// ─── Guest: Booking Confirmed ─────────────────────────────────────────────────

interface BookingConfirmationParams {
  bookingId: string;
  guestName: string;
  guestEmail: string;
  aptName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalEur: number;
  locale: string;
}

export async function sendBookingConfirmation(params: BookingConfirmationParams) {
  const { bookingId, guestName, guestEmail, aptName, checkIn, checkOut, guests, totalEur } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sevastopolapartments.com";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Inter,Helvetica,Arial,sans-serif;background:#f8f7f4;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#3b6cb8,#2a4f8a);padding:32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">🌊 Sevastopol Apartments</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Booking Confirmed</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1a2744;margin:0 0 16px;">Your booking is confirmed, ${guestName}!</h2>
      <p style="color:#5a6a8a;margin:0 0 24px;">Thank you for booking directly with us. Here are your details:</p>

      <div style="background:#f0f4ff;border-radius:8px;padding:20px;margin-bottom:24px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <p style="color:#8a95b0;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Apartment</p>
            <p style="color:#1a2744;font-weight:600;margin:0;">${aptName}</p>
          </div>
          <div>
            <p style="color:#8a95b0;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Booking Ref</p>
            <p style="color:#1a2744;font-weight:600;margin:0;font-size:12px;">${bookingId}</p>
          </div>
          <div>
            <p style="color:#8a95b0;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Check-in</p>
            <p style="color:#1a2744;font-weight:600;margin:0;">${formatDate(checkIn)}</p>
            <p style="color:#5a6a8a;font-size:13px;margin:2px 0 0;">From 15:00</p>
          </div>
          <div>
            <p style="color:#8a95b0;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Check-out</p>
            <p style="color:#1a2744;font-weight:600;margin:0;">${formatDate(checkOut)}</p>
            <p style="color:#5a6a8a;font-size:13px;margin:2px 0 0;">By 11:00</p>
          </div>
          <div>
            <p style="color:#8a95b0;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Guests</p>
            <p style="color:#1a2744;font-weight:600;margin:0;">${guests}</p>
          </div>
          <div>
            <p style="color:#8a95b0;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Total Paid</p>
            <p style="color:#1a2744;font-weight:600;margin:0;">€${totalEur.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <p style="color:#5a6a8a;font-size:14px;margin:0 0 24px;">The owner will send arrival instructions 3 days before your check-in. For any questions, reply to this email or WhatsApp us.</p>

      <a href="https://wa.me/${OWNER_PHONE}" style="display:inline-block;background:#25d366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">💬 WhatsApp the Owner</a>
    </div>
    <div style="background:#f0f4ff;padding:16px 32px;text-align:center;">
      <p style="color:#8a95b0;font-size:12px;margin:0;">© ${new Date().getFullYear()} Sevastopol Apartments, Varna, Bulgaria</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await getResend().emails.send({
      from: getFrom(),
      to: guestEmail,
      // In test mode CC the owner so they see exactly what guests receive
      ...(IS_TEST && guestEmail !== OWNER_EMAIL ? { cc: OWNER_EMAIL } : {}),
      subject: subject(`✅ Booking Confirmed — ${aptName} | ${formatDate(checkIn)}`),
      html,
    });
  } catch (err) {
    logger.error("Failed to send booking confirmation email", err);
  }
}

// ─── Owner: Booking Notification ─────────────────────────────────────────────

interface OwnerNotificationParams {
  bookingId: string;
  aptName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  totalEur: number;
}

export async function sendOwnerNotification(params: OwnerNotificationParams) {
  const { bookingId, aptName, checkIn, checkOut, guests, guestName, guestEmail, guestPhone, totalEur } = params;

  const waMessage = `New booking!\n${aptName}\n${formatDate(checkIn)} → ${formatDate(checkOut)}\n${guests} guests\nGuest: ${guestName}\nTotal: €${totalEur.toFixed(2)}`;

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <h2>💰 New Confirmed Booking</h2>
  <p><strong>Apartment:</strong> ${aptName}</p>
  <p><strong>Booking ID:</strong> ${bookingId}</p>
  <p><strong>Check-in:</strong> ${formatDate(checkIn)}</p>
  <p><strong>Check-out:</strong> ${formatDate(checkOut)}</p>
  <p><strong>Guests:</strong> ${guests}</p>
  <p><strong>Guest:</strong> ${guestName} (${guestEmail})</p>
  <p><strong>Phone:</strong> ${guestPhone}</p>
  <p><strong>Total:</strong> €${totalEur.toFixed(2)}</p>
  <hr/>
  <a href="${waLink(waMessage)}" style="background:#25d366;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Forward to WhatsApp</a>
</div>`;

  try {
    await getResend().emails.send({
      from: getFrom(),
      to: OWNER_EMAIL,
      subject: subject(`💰 New Booking — ${aptName} | ${formatDate(checkIn)}`),
      html,
    });
  } catch (err) {
    logger.error("Failed to send owner notification email", err);
  }
}

// ─── Owner: Booking Request ────────────────────────────────────────────────────

interface OwnerBookingRequestParams {
  bookingId: string;
  aptName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  totalEur: number;
  specialRequests: string;
}

export async function sendOwnerBookingRequest(params: OwnerBookingRequestParams) {
  const { bookingId, aptName, checkIn, checkOut, guests, guestName, guestEmail, guestPhone, totalEur, specialRequests } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sevastopolapartments.com";
  const waMessage = `Booking request!\n${aptName}\n${formatDate(checkIn)} → ${formatDate(checkOut)}\n${guests} guests\nGuest: ${guestName} (${guestPhone})\nTotal: €${totalEur.toFixed(2)}\nApprove: ${appUrl}/admin/bookings`;

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <h2>📋 New Booking Request (Pending Approval)</h2>
  <p><strong>Apartment:</strong> ${aptName}</p>
  <p><strong>Booking ID:</strong> ${bookingId}</p>
  <p><strong>Check-in:</strong> ${formatDate(checkIn)}</p>
  <p><strong>Check-out:</strong> ${formatDate(checkOut)}</p>
  <p><strong>Guests:</strong> ${guests}</p>
  <p><strong>Guest:</strong> ${guestName} (${guestEmail})</p>
  <p><strong>Phone:</strong> ${guestPhone}</p>
  <p><strong>Total:</strong> €${totalEur.toFixed(2)}</p>
  ${specialRequests ? `<p><strong>Special requests:</strong> ${specialRequests}</p>` : ""}
  <hr/>
  <p>This request expires in 24 hours if not confirmed.</p>
  <a href="${appUrl}/admin/bookings" style="background:#3b6cb8;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;margin-right:10px;">Manage in Admin Panel</a>
  <a href="${waLink(waMessage)}" style="background:#25d366;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Forward to WhatsApp</a>
</div>`;

  try {
    await getResend().emails.send({
      from: getFrom(),
      to: OWNER_EMAIL,
      subject: subject(`📋 Booking Request — ${aptName} | ${formatDate(checkIn)} (NEEDS APPROVAL)`),
      html,
    });
  } catch (err) {
    logger.error("Failed to send owner booking request email", err);
  }
}

// ─── Contact Form ──────────────────────────────────────────────────────────────

export async function sendContactEmail(params: { name: string; email: string; message: string }) {
  const { name, email, message } = params;

  try {
    await getResend().emails.send({
      from: getFrom(),
      to: OWNER_EMAIL,
      replyTo: email,
      subject: subject(`Contact form message from ${name}`),
      html: `<p><strong>From:</strong> ${name} (${email})</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br/>")}</p>`,
    });
  } catch (err) {
    logger.error("Failed to send contact email", err);
    throw new Error("Failed to send contact email");
  }
}
