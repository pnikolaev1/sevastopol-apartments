import { prisma } from "@/lib/db/prisma";
import { BookingStatus } from "@prisma/client";

const ICAL_BUFFER_HOURS = 1;

export interface AvailabilityResult {
  available: boolean;
  conflictSource?: string;
}

/**
 * Checks if an apartment is available for the given date range.
 * Applies a 1-hour buffer around external bookings.
 */
export async function checkAvailability(
  apartmentId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<AvailabilityResult> {
  const bufferMs = ICAL_BUFFER_HOURS * 60 * 60 * 1000;

  // Check direct bookings
  const directConflict = await prisma.booking.findFirst({
    where: {
      apartmentId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      AND: [
        { checkIn: { lt: checkOut } },
        { checkOut: { gt: checkIn } },
      ],
    },
    select: { id: true, source: true },
  });

  if (directConflict) {
    return { available: false, conflictSource: "direct" };
  }

  // Check external bookings (with buffer)
  const bufferedCheckIn = new Date(checkIn.getTime() - bufferMs);
  const bufferedCheckOut = new Date(checkOut.getTime() + bufferMs);

  const externalConflict = await prisma.externalBooking.findFirst({
    where: {
      apartmentId,
      AND: [
        { checkIn: { lt: bufferedCheckOut } },
        { checkOut: { gt: bufferedCheckIn } },
      ],
    },
    select: { source: true },
  });

  if (externalConflict) {
    return {
      available: false,
      conflictSource: externalConflict.source.toLowerCase(),
    };
  }

  return { available: true };
}

/**
 * Returns all blocked date ranges for an apartment (for calendar display).
 */
export async function getBlockedDates(
  apartmentId: string
): Promise<Array<{ start: Date; end: Date; source: string }>> {
  const [directBookings, externalBookings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        apartmentId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      },
      select: { checkIn: true, checkOut: true, source: true },
    }),
    prisma.externalBooking.findMany({
      where: { apartmentId },
      select: { checkIn: true, checkOut: true, source: true },
    }),
  ]);

  return [
    ...directBookings.map((b) => ({
      start: b.checkIn,
      end: b.checkOut,
      source: b.source.toLowerCase(),
    })),
    ...externalBookings.map((b) => ({
      start: b.checkIn,
      end: b.checkOut,
      source: b.source.toLowerCase(),
    })),
  ];
}
