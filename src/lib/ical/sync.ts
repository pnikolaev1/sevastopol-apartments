// eslint-disable-next-line @typescript-eslint/no-require-imports
const ical = require("node-ical") as {
  parseICS: (data: string) => Record<string, Record<string, unknown>>;
};
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { BookingSource } from "@prisma/client";
import crypto from "crypto";

interface ParsedEvent {
  externalId: string;
  summary: string;
  checkIn: Date;
  checkOut: Date;
}

function parseIcalFeed(rawText: string): ParsedEvent[] {
  const parsed = ical.parseICS(rawText);
  const events: ParsedEvent[] = [];

  for (const key in parsed) {
    const event = parsed[key];
    if (!event) continue;
    if (event["type"] !== "VEVENT") continue;
    if (!event["start"] || !event["end"]) continue;

    const checkIn = new Date(event["start"] as Date);
    const checkOut = new Date(event["end"] as Date);

    // Skip events in the past (more than 1 day ago)
    if (checkOut < new Date(Date.now() - 86400000)) continue;

    events.push({
      externalId: String(event["uid"] ?? key),
      summary: String(event["summary"] ?? ""),
      checkIn,
      checkOut,
    });
  }

  return events;
}

async function fetchIcalFeed(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SevastopolApartments/1.0 (+https://sevastopolapartments.com)" },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching iCal feed: ${url}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function syncApartmentIcal(
  apartmentId: string,
  source: BookingSource,
  feedUrl: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const rawText = await fetchIcalFeed(feedUrl);
    const events = parseIcalFeed(rawText);

    let upsertCount = 0;

    for (const event of events) {
      await prisma.externalBooking.upsert({
        where: {
          apartmentId_source_externalId: {
            apartmentId,
            source,
            externalId: event.externalId,
          },
        },
        create: {
          apartmentId,
          source,
          externalId: event.externalId,
          summary: event.summary,
          checkIn: event.checkIn,
          checkOut: event.checkOut,
        },
        update: {
          summary: event.summary,
          checkIn: event.checkIn,
          checkOut: event.checkOut,
          syncedAt: new Date(),
        },
      });
      upsertCount++;
    }

    await prisma.syncLog.create({
      data: {
        apartmentId,
        source,
        success: true,
        recordCount: upsertCount,
      },
    });

    return { success: true, count: upsertCount };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error("iCal sync failed", { apartmentId, source, error: errorMsg });

    await prisma.syncLog.create({
      data: {
        apartmentId,
        source,
        success: false,
        errorMsg,
        recordCount: 0,
      },
    });

    return { success: false, count: 0, error: errorMsg };
  }
}

export async function syncAllApartments(): Promise<void> {
  const apartments = await prisma.apartment.findMany({
    where: { active: true },
    select: {
      id: true,
      slug: true,
      bookingIcalUrl: true,
      airbnbIcalUrl: true,
    },
  });

  for (const apt of apartments) {
    const tasks: Array<Promise<unknown>> = [];

    if (apt.bookingIcalUrl) {
      tasks.push(syncApartmentIcal(apt.id, BookingSource.BOOKING_COM, apt.bookingIcalUrl));
    }
    if (apt.airbnbIcalUrl) {
      tasks.push(syncApartmentIcal(apt.id, BookingSource.AIRBNB, apt.airbnbIcalUrl));
    }

    await Promise.allSettled(tasks);
    logger.info(`iCal sync complete for apartment ${apt.slug}`);
  }
}

/**
 * Generates the HMAC-signed outbound iCal URL for an apartment.
 */
export function buildIcalFeedUrl(
  apartmentId: string,
  icalSecret: string,
  baseUrl: string
): string {
  const token = crypto
    .createHmac("sha256", icalSecret)
    .update(apartmentId)
    .digest("hex")
    .slice(0, 32);

  return `${baseUrl}/api/ical/${apartmentId}?token=${token}`;
}

export function verifyIcalToken(
  apartmentId: string,
  icalSecret: string,
  token: string
): boolean {
  const expected = crypto
    .createHmac("sha256", icalSecret)
    .update(apartmentId)
    .digest("hex")
    .slice(0, 32);

  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
