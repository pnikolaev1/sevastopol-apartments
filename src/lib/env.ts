import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  // Auth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),

  // Resend
  RESEND_API_KEY: z.string().startsWith("re_"),
  RESEND_FROM_EMAIL: z.string().email(),
  RESEND_FROM_NAME: z.string().default("Sevastopol Apartments"),

  // Upstash Redis (rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),

  // EUR to BGN (fixed rate — BGN is pegged to EUR)
  NEXT_PUBLIC_EUR_TO_BGN: z.string().default("1.95583"),

  // iCal HMAC secret (used to sign outbound feed URLs)
  ICAL_HMAC_SECRET: z.string().min(32),

  // Owner contact
  OWNER_EMAIL: z.string().email().default("5areood@gmail.com"),
  OWNER_PHONE: z.string().default("+35989436230"),
  OWNER_WHATSAPP: z.string().default("35989436230"),

  // Optional: Sentry
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Optional: Plausible analytics
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),

  // Stripe mode flag — "test" shows the TEST MODE banner, "live" hides it
  NEXT_PUBLIC_STRIPE_MODE: z.enum(["test", "live"]).default("test"),

  // Email mode — "test" prefixes subjects + CCs owner on guest emails
  EMAIL_MODE: z.enum(["test", "live"]).default("test"),

  // Cron job shared secret (must match Authorization header sent by scheduler)
  CRON_SECRET: z.string().min(32),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing or invalid environment variables: ${missing}`);
  }
  return result.data;
}

// Only validate at runtime, not during build type-checking
export const env = validateEnv();
