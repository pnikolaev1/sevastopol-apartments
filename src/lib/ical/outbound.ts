import { prisma } from "@/lib/db/prisma";
import { BookingStatus } from "@prisma/client";
import { format } from "date-fns";

function icalDate(date: Date): string {
  return format(date, "yyyyMMdd");
}

function escapeIcal(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function generateIcalFeed(apartmentId: string): Promise<string> {
  const [bookings, apartment] = await Promise.all([
    prisma.booking.findMany({
      where: {
        apartmentId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      },
      include: { guest: true },
    }),
    prisma.apartment.findUnique({
      where: { id: apartmentId },
      include: {
        translations: { where: { locale: "en" } },
      },
    }),
  ]);

  if (!apartment) return "";

  const aptName = apartment.translations[0]?.name ?? "Sevastopol Apartments";
  const now = new Date();
  const dtstamp = `${format(now, "yyyyMMdd")}T${format(now, "HHmmss")}Z`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SevastopolApartments//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcal(aptName)}`,
    "X-WR-TIMEZONE:Europe/Sofia",
  ];

  for (const booking of bookings) {
    const guestName = `${booking.guest.firstName} ${booking.guest.lastName}`;
    const status = booking.status === BookingStatus.CONFIRMED ? "CONFIRMED" : "TENTATIVE";

    lines.push(
      "BEGIN:VEVENT",
      `UID:booking-${booking.id}@sevastopolapartments.com`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icalDate(booking.checkIn)}`,
      `DTEND;VALUE=DATE:${icalDate(booking.checkOut)}`,
      `SUMMARY:${escapeIcal(guestName)} (${booking.guestCount} guests)`,
      `STATUS:${status}`,
      `DESCRIPTION:Booking ref: ${escapeIcal(booking.id)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}
