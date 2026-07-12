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
  // Dry-run for template development: write the HTML to disk instead of
  // sending. Enabled only via EMAIL_DRY_RUN_DIR (never set in production).
  if (process.env.EMAIL_DRY_RUN_DIR) {
    const { writeFileSync, mkdirSync } = await import("node:fs");
    const dir = process.env.EMAIL_DRY_RUN_DIR;
    mkdirSync(dir, { recursive: true });
    const name = Date.now() + "-" + String(payload.subject ?? "email").replace(/[^a-z0-9]+/gi, "-").slice(0, 60) + ".html";
    writeFileSync(dir + "/" + name, String(payload.html ?? ""));
    return { data: { id: "dry-run" }, error: null };
  }
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
const PROPERTY_ADDRESS = "ul. „Lyuben Karavelov“ 7, Varna Center–Odesos, 9002 Varna, Bulgaria";
const PROPERTY_MAPS_URL = "https://maps.google.com/?q=ul.+Lyuben+Karavelov+7,+9002+Varna,+Bulgaria";

function formatDateBg(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("bg-BG", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

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

// ─── Shared branded layout (Navy & Gold, email-client-safe tables) ────────────

const C = {
  navy: "#0d1f35",
  gold: "#c7a468",
  goldPale: "#f3d9a4",
  ink: "#22303b",
  muted: "#6e7684",
  paper: "#f6f4ef",
  goldTint: "#f6f1e4",
  border: "#e8e3d8",
};

/** Wraps content in the site's navy/gold chrome. Tables + inline styles only. */
function emailShell(content: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:${C.paper};font-family:Inter,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="background:${C.navy};border-radius:14px 14px 0 0;padding:22px 30px;">
      <span style="display:block;color:#ffffff;font-size:17px;font-weight:700;">Sevastopol Apartments</span>
      <span style="display:block;color:${C.gold};font-size:11px;letter-spacing:3px;margin-top:3px;">VARNA</span>
    </td></tr>
    <tr><td style="background:#ffffff;padding:30px;border:1px solid ${C.border};border-top:none;">
      ${content}
    </td></tr>
    <tr><td style="background:${C.navy};border-radius:0 0 14px 14px;padding:16px 30px;">
      <span style="color:rgba(255,255,255,0.55);font-size:12px;">© ${year} Sevastopol Apartments · Varna, Bulgaria</span><br>
      <span style="color:rgba(255,255,255,0.4);font-size:12px;">+359 89 436 2230 · ${OWNER_EMAIL}</span>
    </td></tr>
  </table>
</body>
</html>`;
}

function detailRows(rows: Array<[string, string]>): string {
  const tr = rows
    .map(
      ([label, value]) => `<tr>
        <td style="padding:7px 0;color:${C.muted};font-size:13px;vertical-align:top;">${label}</td>
        <td style="padding:7px 0;color:${C.ink};font-size:13px;font-weight:600;text-align:right;">${value}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.goldTint};border-radius:10px;padding:8px 18px;border-collapse:separate;">${tr}</table>`;
}

function ctaButton(href: string, label: string, variant: "gold" | "navy" | "whatsapp" = "gold"): string {
  const bg = variant === "gold" ? C.gold : variant === "navy" ? C.navy : "#25d366";
  const color = variant === "gold" ? C.navy : "#ffffff";
  return `<a href="${href}" style="display:inline-block;background:${bg};color:${color};font-size:14px;font-weight:700;padding:13px 26px;border-radius:999px;text-decoration:none;margin:4px 8px 4px 0;">${label}</a>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 6px;color:${C.navy};font-size:21px;">${text}</h1>`;
}

function eyebrow(text: string): string {
  return `<p style="margin:0 0 10px;color:${C.gold};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${text}</p>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 18px;color:${C.muted};font-size:14px;line-height:1.6;">${text}</p>`;
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

  const html = emailShell(`
    ${eyebrow("Booking confirmed")}
    ${heading(`Thank you, ${escapeHtml(guestName)}!`)}
    ${para("Your direct booking is confirmed. Here are your stay details:")}
    ${detailRows([
      ["Apartment", escapeHtml(aptName)],
      ["Booking ref", `<span style="font-family:monospace;font-size:12px;">${bookingId}</span>`],
      ["Check-in", `${formatDate(checkIn)} · from 15:00`],
      ["Check-out", `${formatDate(checkOut)} · by 11:00`],
      ["Guests", String(guests)],
      ["Address", `<a href="${PROPERTY_MAPS_URL}" style="color:${C.ink};text-decoration:underline;">${PROPERTY_ADDRESS}</a>`],
      ["Total paid", `€${totalEur.toFixed(2)}`],
    ])}
    <p style="margin:20px 0 16px;color:${C.muted};font-size:13px;line-height:1.6;">The owner will send arrival instructions 3 days before your check-in. For any questions, reply to this email or message us on WhatsApp.</p>
    ${ctaButton(`https://wa.me/${OWNER_PHONE}`, "WhatsApp the owner")}
    ${ctaButton(PROPERTY_MAPS_URL, "Open in Google Maps", "navy")}
    <p style="margin:16px 0 0;color:${C.muted};font-size:12px;">Manage your stay: <a href="${appUrl}" style="color:${C.gold};">${appUrl.replace(/^https?:\/\//, "")}</a></p>
  `);

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

  const html = emailShell(`
    ${eyebrow("Ново плащане")}
    ${heading("Нова потвърдена резервация")}
    ${detailRows([
      ["Апартамент", escapeHtml(aptName)],
      ["Резервация", `<span style="font-family:monospace;font-size:12px;">${bookingId}</span>`],
      ["Настаняване", formatDateBg(checkIn)],
      ["Напускане", formatDateBg(checkOut)],
      ["Гости", String(guests)],
      ["Гост", `${escapeHtml(guestName)}<br><span style="font-weight:400;color:#6e7684;">${escapeHtml(guestEmail)} · ${escapeHtml(guestPhone)}</span>`],
      ["Общо платено", `<span style="font-size:15px;">€${totalEur.toFixed(2)}</span>`],
    ])}
    <div style="margin-top:20px;">
      ${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL ?? "https://sevastopolapartments.com"}/admin/bookings`, "Отвори в администрацията", "navy")}
      ${ctaButton(waLink(waMessage), "Препрати в WhatsApp", "whatsapp")}
    </div>
  `);

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

  const html = emailShell(`
    ${eyebrow("Изисква одобрение")}
    ${heading("Нова заявка за резервация")}
    ${para("Заявката изтича след 24 часа, ако не бъде потвърдена.")}
    ${detailRows([
      ["Апартамент", escapeHtml(aptName)],
      ["Резервация", `<span style="font-family:monospace;font-size:12px;">${bookingId}</span>`],
      ["Настаняване", formatDateBg(checkIn)],
      ["Напускане", formatDateBg(checkOut)],
      ["Гости", String(guests)],
      ["Гост", `${escapeHtml(guestName)}<br><span style="font-weight:400;color:#6e7684;">${escapeHtml(guestEmail)} · ${escapeHtml(guestPhone)}</span>`],
      ["Сума", `<span style="font-size:15px;">€${totalEur.toFixed(2)}</span>`],
      ...(specialRequests ? [["Специални изисквания", escapeHtml(specialRequests)] as [string, string]] : []),
    ])}
    <div style="margin-top:20px;">
      ${ctaButton(`${appUrl}/admin/bookings`, "Одобри в администрацията")}
      ${ctaButton(waLink(waMessage), "Препрати в WhatsApp", "whatsapp")}
    </div>
  `);

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

  const html = emailShell(`
    ${eyebrow("Admin вход")}
    ${heading("Код за потвърждение")}
    ${para("Вашият код за вход в администрацията:")}
    <p style="font-size:34px;font-weight:700;letter-spacing:8px;color:${C.navy};text-align:center;background:${C.goldTint};border-radius:10px;padding:16px 0;margin:0 0 16px;">${code}</p>
    <p style="margin:0 0 6px;color:${C.muted};font-size:13px;">Кодът е валиден 10 минути.</p>
    <p style="margin:0;color:${C.muted};font-size:13px;">Ако не сте опитвали да влезете, някой знае паролата ви — сменете я веднага от настройките.</p>
  `);

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
      html: emailShell(`
        ${eyebrow("Форма за контакт")}
        ${heading(`Съобщение от ${escapeHtml(name)}`)}
        ${para(`<a href="mailto:${escapeHtml(email)}" style="color:${C.gold};">${escapeHtml(email)}</a> — отговорете директно на този имейл.`)}
        <div style="background:${C.goldTint};border-radius:10px;padding:16px 18px;color:${C.ink};font-size:14px;line-height:1.6;">${escapeHtml(message).replace(/\n/g, "<br/>")}</div>
      `),
    });
  } catch (err) {
    logger.error("Failed to send contact email", err);
    throw new Error("Failed to send contact email");
  }
}
