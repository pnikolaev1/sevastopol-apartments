import { Resend } from "resend";
import { logger } from "@/lib/logger";

const IS_TEST = process.env.EMAIL_MODE !== "live";
// In sandbox mode (onboarding@resend.dev sender), Resend only delivers to the
// account owner's email. Set EMAIL_TEST_RECIPIENT to that address to receive
// all test emails in one inbox regardless of who the nominal recipient is.
const TEST_RECIPIENT = IS_TEST ? (process.env.EMAIL_TEST_RECIPIENT ?? null) : null;

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
}

// The Resend SDK does NOT throw on failure — it resolves with { data: null,
// error }. Every send must go through this wrapper or failures (sandbox
// recipient restrictions, quota, bad key) pass completely silently.
async function sendEmail(payload: Parameters<Resend["emails"]["send"]>[0]) {
  const result = await getResend().emails.send(payload);
  if (result.error) {
    throw new Error(`Resend ${result.error.name}: ${result.error.message}`);
  }
  return result;
}

function getFrom() {
  return `${process.env.RESEND_FROM_NAME ?? "Sevastopol Apartments"} <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`;
}

function subject(base: string): string {
  return IS_TEST ? `[TEST MODE] ${base}` : base;
}

// Resolve the actual delivery address in test mode
function to(nominal: string): string {
  return TEST_RECIPIENT ?? nominal;
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

// Escape user-controlled values before interpolating them into email HTML.
// Guest names, phone, special requests and the contact message all originate
// from unauthenticated request bodies; without escaping they can inject markup
// (phishing links, tracking pixels) into the owner's inbox.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
      <h2 style="color:#1a2744;margin:0 0 16px;">Your booking is confirmed, ${escapeHtml(guestName)}!</h2>
      <p style="color:#5a6a8a;margin:0 0 24px;">Thank you for booking directly with us. Here are your details:</p>

      <div style="background:#f0f4ff;border-radius:8px;padding:20px;margin-bottom:24px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <p style="color:#8a95b0;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Apartment</p>
            <p style="color:#1a2744;font-weight:600;margin:0;">${escapeHtml(aptName)}</p>
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
    await sendEmail({
      from: getFrom(),
      to: to(guestEmail),
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
  <p><strong>Apartment:</strong> ${escapeHtml(aptName)}</p>
  <p><strong>Booking ID:</strong> ${bookingId}</p>
  <p><strong>Check-in:</strong> ${formatDate(checkIn)}</p>
  <p><strong>Check-out:</strong> ${formatDate(checkOut)}</p>
  <p><strong>Guests:</strong> ${guests}</p>
  <p><strong>Guest:</strong> ${escapeHtml(guestName)} (${escapeHtml(guestEmail)})</p>
  <p><strong>Phone:</strong> ${escapeHtml(guestPhone)}</p>
  <p><strong>Total:</strong> €${totalEur.toFixed(2)}</p>
  <hr/>
  <a href="${waLink(waMessage)}" style="background:#25d366;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Forward to WhatsApp</a>
</div>`;

  try {
    await sendEmail({
      from: getFrom(),
      to: to(OWNER_EMAIL),
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
  <p><strong>Apartment:</strong> ${escapeHtml(aptName)}</p>
  <p><strong>Booking ID:</strong> ${bookingId}</p>
  <p><strong>Check-in:</strong> ${formatDate(checkIn)}</p>
  <p><strong>Check-out:</strong> ${formatDate(checkOut)}</p>
  <p><strong>Guests:</strong> ${guests}</p>
  <p><strong>Guest:</strong> ${escapeHtml(guestName)} (${escapeHtml(guestEmail)})</p>
  <p><strong>Phone:</strong> ${escapeHtml(guestPhone)}</p>
  <p><strong>Total:</strong> €${totalEur.toFixed(2)}</p>
  ${specialRequests ? `<p><strong>Special requests:</strong> ${escapeHtml(specialRequests)}</p>` : ""}
  <hr/>
  <p>This request expires in 24 hours if not confirmed.</p>
  <a href="${appUrl}/admin/bookings" style="background:#3b6cb8;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;margin-right:10px;">Manage in Admin Panel</a>
  <a href="${waLink(waMessage)}" style="background:#25d366;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Forward to WhatsApp</a>
</div>`;

  try {
    await sendEmail({
      from: getFrom(),
      to: to(OWNER_EMAIL),
      subject: subject(`📋 Booking Request — ${aptName} | ${formatDate(checkIn)} (NEEDS APPROVAL)`),
      html,
    });
  } catch (err) {
    logger.error("Failed to send owner booking request email", err);
  }
}

// ─── Admin: Login Verification Code (email 2FA) ───────────────────────────────

export async function sendAdminLoginCode(params: { email: string; code: string }) {
  const { email, code } = params;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Inter,Helvetica,Arial,sans-serif;background:#f8f7f4;margin:0;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#0d1f35;padding:20px 28px;">
      <p style="color:#c7a468;font-size:14px;font-weight:600;margin:0;">Sevastopol Apartments — Admin</p>
    </div>
    <div style="padding:28px;">
      <p style="font-size:15px;color:#22303b;margin:0 0 16px;">Your login verification code:</p>
      <p style="font-size:34px;font-weight:700;letter-spacing:8px;color:#0d1f35;text-align:center;background:#f3efe6;border-radius:10px;padding:16px 0;margin:0 0 16px;">${code}</p>
      <p style="font-size:13px;color:#6e7684;margin:0 0 6px;">The code expires in 10 minutes.</p>
      <p style="font-size:13px;color:#6e7684;margin:0;">If you didn't try to sign in, someone knows your password — change it immediately in the admin settings.</p>
    </div>
  </div>
</body>
</html>`;

  // Deliberately throws on failure: the login flow shows the code field only
  // after this resolves, and a silently-lost email would strand the admin.
  await sendEmail({
    from: getFrom(),
    to: to(email),
    subject: subject(`${code} is your admin login code`),
    html,
  });
}

// ─── Contact Form ──────────────────────────────────────────────────────────────

export async function sendContactEmail(params: { name: string; email: string; message: string }) {
  const { name, email, message } = params;

  try {
    await sendEmail({
      from: getFrom(),
      to: to(OWNER_EMAIL),
      replyTo: email,
      subject: subject(`Contact form message from ${name}`),
      html: `<p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
    });
  } catch (err) {
    logger.error("Failed to send contact email", err);
    throw new Error("Failed to send contact email");
  }
}
