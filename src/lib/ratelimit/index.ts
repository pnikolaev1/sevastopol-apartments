import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

function createRatelimit(limit: number, window: string, prefix: string): Ratelimit {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? "http://localhost",
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "placeholder",
  });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix,
    analytics: false,
  });
}

const FAIL_OPEN = { success: true, limit: 0, remaining: 0, reset: 0, pending: Promise.resolve() };

// Lazy singletons — only instantiated when first called at runtime
let _bookingRatelimit: Ratelimit | undefined;
let _contactRatelimit: Ratelimit | undefined;
let _adminLoginRatelimit: Ratelimit | undefined;

export const bookingRatelimit = {
  limit: async (id: string) => {
    try {
      _bookingRatelimit ??= createRatelimit(5, "1 m", "rl:booking");
      return await _bookingRatelimit.limit(id);
    } catch (err) {
      // Fail open on transient Redis errors so a rate-limiter outage does not
      // take down booking/contact, but log loudly so misconfiguration (e.g.
      // missing UPSTASH_* env vars) is visible rather than silently disabling
      // all throttling.
      logger.warn("Rate limiter unavailable — failing open", err);
      return FAIL_OPEN;
    }
  },
};

export const contactRatelimit = {
  limit: async (id: string) => {
    try {
      _contactRatelimit ??= createRatelimit(10, "1 m", "rl:contact");
      return await _contactRatelimit.limit(id);
    } catch (err) {
      // Fail open on transient Redis errors so a rate-limiter outage does not
      // take down booking/contact, but log loudly so misconfiguration (e.g.
      // missing UPSTASH_* env vars) is visible rather than silently disabling
      // all throttling.
      logger.warn("Rate limiter unavailable — failing open", err);
      return FAIL_OPEN;
    }
  },
};

export const adminLoginRatelimit = {
  limit: async (id: string) => {
    try {
      _adminLoginRatelimit ??= createRatelimit(5, "15 m", "rl:admin-login");
      return await _adminLoginRatelimit.limit(id);
    } catch (err) {
      // Fail open on transient Redis errors so a rate-limiter outage does not
      // take down booking/contact, but log loudly so misconfiguration (e.g.
      // missing UPSTASH_* env vars) is visible rather than silently disabling
      // all throttling.
      logger.warn("Rate limiter unavailable — failing open", err);
      return FAIL_OPEN;
    }
  },
};

export function getIp(request: Request): string {
  // On Vercel the platform sets `x-real-ip` to the true peer address and rewrites
  // it on every request, so the client cannot forge it. We deliberately do NOT
  // trust `cf-connecting-ip` (not set by Vercel — fully attacker-controlled) nor
  // the left-most `x-forwarded-for` value (client-prependable); either would let
  // an attacker mint a fresh rate-limit bucket per request and bypass the limit.
  // If this app is ever placed behind Cloudflare, restrict ingress to Cloudflare
  // IP ranges and switch to `cf-connecting-ip` here.
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  // Fallback: the RIGHT-most XFF entry is the one appended by the closest trusted
  // proxy; the left-most entries are supplied by the (untrusted) client.
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1] as string;
  }

  return "127.0.0.1";
}
