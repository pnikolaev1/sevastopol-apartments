import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { sendAdminLoginCode } from "@/lib/email/templates";
import { logger } from "@/lib/logger";
import type { AdminUser } from "@prisma/client";

export const OTP_TTL_MS = 10 * 60 * 1000; // codes expire after 10 minutes
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // at most one email per minute
export const OTP_MAX_ATTEMPTS = 5; // then a fresh code must be requested

function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Emails a fresh 6-digit login code to the admin (bcrypt hash stored, never
 * the code itself). Within the cooldown window the existing code stays valid
 * and no duplicate email is sent — so retrying the login form doesn't spam
 * the inbox or invalidate a code that is already in transit.
 */
export async function sendLoginCode(admin: AdminUser): Promise<void> {
  const now = new Date();
  if (
    admin.loginOtpSentAt &&
    now.getTime() - admin.loginOtpSentAt.getTime() < OTP_RESEND_COOLDOWN_MS &&
    admin.loginOtpHash
  ) {
    return;
  }

  const code = generateCode();
  // Send first, persist after: if the email fails nothing is stored, so the
  // next attempt isn't blocked by the cooldown waiting on a code that never
  // arrived. A code that sends but fails to persist simply won't verify and
  // the admin requests a fresh one.
  await sendAdminLoginCode({ email: admin.email, code });
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      loginOtpHash: await bcrypt.hash(code, 10),
      loginOtpSentAt: now,
      loginOtpAttempts: 0,
    },
  });
  logger.info("Admin login code emailed", { adminId: admin.id });
}

/**
 * Verifies a submitted login code. Consumes the code on success; counts and
 * caps failed attempts so a 6-digit code can't be brute-forced within its TTL.
 */
export async function verifyLoginCode(admin: AdminUser, code: string): Promise<boolean> {
  if (!admin.loginOtpHash || !admin.loginOtpSentAt) return false;
  if (Date.now() - admin.loginOtpSentAt.getTime() > OTP_TTL_MS) return false;
  if (admin.loginOtpAttempts >= OTP_MAX_ATTEMPTS) return false;

  const valid = await bcrypt.compare(code, admin.loginOtpHash);
  if (!valid) {
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { loginOtpAttempts: { increment: 1 } },
    });
    return false;
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { loginOtpHash: null, loginOtpSentAt: null, loginOtpAttempts: 0 },
  });
  return true;
}
