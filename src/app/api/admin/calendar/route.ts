import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

/**
 * Month data for the admin rate calendar:
 * overrides, direct bookings (with guest + source) and external iCal blocks.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const apartmentId = url.searchParams.get("apartmentId") ?? "";
  const month = url.searchParams.get("month") ?? ""; // YYYY-MM
  if (!apartmentId || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "apartmentId and month=YYYY-MM required" }, { status: 422 });
  }

  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  const [overrides, bookings, external] = await Promise.all([
    prisma.dateOverride.findMany({
      where: { apartmentId, date: { gte: start, lt: end } },
    }),
    prisma.booking.findMany({
      where: {
        apartmentId,
        status: { in: ["CONFIRMED", "PENDING"] },
        checkIn: { lt: end },
        checkOut: { gt: start },
      },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        status: true,
        source: true,
        totalAmount: true,
        guest: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.externalBooking.findMany({
      where: { apartmentId, checkIn: { lt: end }, checkOut: { gt: start } },
      select: { checkIn: true, checkOut: true, source: true },
    }),
  ]);

  return NextResponse.json({ overrides, bookings, external });
}
