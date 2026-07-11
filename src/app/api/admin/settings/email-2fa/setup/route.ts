import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { sendLoginCode } from "@/lib/auth/email-otp";
import { logger } from "@/lib/logger";

/**
 * Starts email-2FA enrollment: sends a verification code to the account's
 * email. 2FA is only switched on once that code is confirmed via the verify
 * route — proving the mailbox actually receives codes before it becomes a
 * login requirement.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.adminUser.findUnique({ where: { id: session.user.id } });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await sendLoginCode(admin);
  } catch (err) {
    logger.error("Failed to send email-2FA enrollment code", err);
    return NextResponse.json({ error: "Failed to send the code — check email settings" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, email: admin.email });
}
