import { NextResponse } from "next/server";
import { syncAllApartments } from "@/lib/ical/sync";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized invocations
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
