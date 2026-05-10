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

// Lazy singletons — only instantiated when first called at runtime
let _bookingRatelimit: Ratelimit | undefined;
let _contactRatelimit: Ratelimit | undefined;
let _adminLoginRatelimit: Ratelimit | undefined;

export const bookingRatelimit = {
  limit: (id: string) => {
    _bookingRatelimit ??= createRatelimit(5, "1 m", "rl:booking");
    return _bookingRatelimit.limit(id);
  },
};

export const contactRatelimit = {
  limit: (id: string) => {
    _contactRatelimit ??= createRatelimit(10, "1 m", "rl:contact");
    return _contactRatelimit.limit(id);
  },
};

export const adminLoginRatelimit = {
  limit: (id: string) => {
    _adminLoginRatelimit ??= createRatelimit(5, "15 m", "rl:admin-login");
    return _adminLoginRatelimit.limit(id);
  },
};

export function getIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}
