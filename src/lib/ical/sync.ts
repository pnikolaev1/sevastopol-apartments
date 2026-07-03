// eslint-disable-next-line @typescript-eslint/no-require-imports
const ical = require("node-ical") as {
  parseICS: (data: string) => Record<string, Record<string, unknown>>;
};
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { BookingSource } from "@prisma/client";
import crypto from "crypto";
import dns from "node:dns/promises";
import net from "node:net";

const MAX_ICAL_BYTES = 5 * 1024 * 1024; // 5 MB cap on a fetched feed

/** True for loopback / private / link-local / CGNAT / cloud-metadata ranges. */
function isPrivateIp(ip: string): boolean {
  const v = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  if (net.isIPv4(v)) {
    const [a, b] = v.split(".").map(Number);
    if (a === undefined || b === undefined) return true;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80")
  );
}

/**
 * Rejects iCal URLs that could drive a server-side request forgery: non-http(s)
 * schemes and any host that resolves to a private/loopback/link-local/metadata
 * address. iCal feed URLs are admin-configured, but this endpoint is also
 * triggered from the unauthenticated booking-confirm path, so we harden it.
 */
async function assertPublicHttpUrl(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid iCal URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Blocked iCal URL scheme: ${url.protocol}`);
  }
  const host = url.hostname;
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Blocked private/internal iCal host");
    return;
  }
  const addrs = await dns.lookup(host, { all: true });
  if (addrs.length === 0) throw new Error("Could not resolve iCal host");
  for (const { address } of addrs) {
    if (isPrivateIp(address)) throw new Error("Blocked private/internal iCal host");
  }
}

/** Reads a fetch Response body, aborting past maxBytes to bound memory use. */
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return await res.text();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("iCal feed exceeds size limit");
      }
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks).toString("utf8");
}

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
  await assertPublicHttpUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SevastopolApartments/1.0 (+https://sevastopolapartments.com)" },
      // Do not follow redirects: a redirect to an internal host would bypass the
      // pre-flight private-IP check above.
      redirect: "error",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching iCal feed: ${url}`);
    }

    return await readCapped(res, MAX_ICAL_BYTES);
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

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  // timingSafeEqual throws a RangeError on unequal-length buffers, which would
  // surface as an unhandled 500 instead of a clean 401. Guard the length first
  // (an early length mismatch is already non-secret, so this leaks nothing).
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
