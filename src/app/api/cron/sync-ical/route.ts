import { NextResponse } from "next/server";
import { syncAllApartments } from "@/lib/ical/sync";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Constant-time comparison that never throws on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized invocations. Fail closed if the
  // secret is not configured — otherwise the expected header degrades to the
  // literal "Bearer undefined", which an attacker could send.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error("CRON_SECRET is not configured — refusing cron request");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!safeEqual(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await syncAllApartments();
    logger.info("iCal cron sync completed");
    return NextResponse.json({ ok: true, syncedAt: new Date().toISOString() });
  } catch (err) {
    logger.error("iCal cron sync failed", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
