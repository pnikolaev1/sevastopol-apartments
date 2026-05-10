import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
    } catch {
      return FAIL_OPEN;
    }
  },
};

export const contactRatelimit = {
  limit: async (id: string) => {
    try {
      _contactRatelimit ??= createRatelimit(10, "1 m", "rl:contact");
      return await _contactRatelimit.limit(id);
    } catch {
      return FAIL_OPEN;
    }
  },
};

export const adminLoginRatelimit = {
  limit: async (id: string) => {
    try {
      _adminLoginRatelimit ??= createRatelimit(5, "15 m", "rl:admin-login");
      return await _adminLoginRatelimit.limit(id);
    } catch {
      return FAIL_OPEN;
    }
  },
};

export function getIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}
