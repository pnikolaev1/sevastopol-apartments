import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
// No caching — always hits the DB so a paused Supabase project wakes up
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up" });
  } catch (err) {
    // Log the detail server-side; never return the raw DB error to the caller —
    // Prisma connection errors include the internal database host and port.
    logger.error("Health check DB failure", err);
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
