# Sevastopol Apartments — Direct Booking Website

Production booking website for Sevastopol Apartments, Varna, Bulgaria.
Built with Next.js 16, Prisma 7, Supabase, Stripe, Resend, and Upstash Redis.

**Live URL:** https://sevastopol-apartments.vercel.app  
**Stack:** Next.js 16 (App Router) · TypeScript · PostgreSQL (Supabase) · Prisma 7 · Tailwind CSS 4

---

## Run Locally

**Prerequisites:** Node.js 20+, a Supabase project, Stripe test keys, Resend key, Upstash Redis.

```bash
# 1. Clone and install
git clone https://github.com/pnikolaev1/sevastopol-apartments.git
cd sevastopol-apartments
npm install

# 2. Set up environment
cp .env.test.local.template .env.local
# Fill in every REPLACE_ME value in .env.local

# 3. Push DB schema and seed data
npm run db:push
npm run db:seed

# 4. Start dev server
npm run dev
```

Open http://localhost:3000 — the site runs in English by default; Bulgarian is the default locale at `/`.

Admin panel: http://localhost:3000/admin  
Credentials after seeding: `5areood@gmail.com` / `P77H82P04V06`

---

## Environment Variables

Copy `.env.test.local.template` to `.env.local` and fill in the values.
See `.env.example` for full documentation of every variable.

**Required services (all have free tiers):**

| Variable group | Service | Free tier URL |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | Supabase | https://supabase.com |
| `STRIPE_*` | Stripe | https://dashboard.stripe.com/test/apikeys |
| `RESEND_API_KEY` | Resend | https://resend.com/api-keys |
| `UPSTASH_REDIS_*` | Upstash | https://console.upstash.com |

---

## Deploy to Vercel (Free Hobby Plan)

1. Push to GitHub
2. Go to https://vercel.com/new → import the repo
3. Add all env vars from `.env.example` (use real values from each service)
4. Click **Deploy**

**Important:** The middleware bundle must stay under 1 MB (Vercel Hobby limit).
The `src/lib/auth/edge.ts` file provides an Edge-safe JWT-only auth config for
middleware — do not import Prisma, bcrypt, or speakeasy from middleware.

**Cron jobs:** Vercel Hobby does not support sub-daily crons. Use cron-job.org
(free) to call `GET /api/cron/sync-ical` every 15 minutes with:
```
Authorization: Bearer {CRON_SECRET}
```

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Public site (BG/EN/RO via next-intl)
│   ├── admin/             # Admin panel (protected, no i18n)
│   └── api/
│       ├── booking/       # Booking creation + Stripe payment intent
│       ├── cron/          # iCal sync endpoint (called by cron-job.org)
│       ├── health/        # DB liveness check (wakes paused Supabase)
│       ├── ical/          # Outbound iCal feeds (HMAC-signed)
│       └── webhooks/      # Stripe payment confirmation webhook
├── components/
│   ├── booking/           # BookingForm with Stripe Elements
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── auth/
│   │   ├── config.ts      # Full auth config (Node.js runtime only)
│   │   ├── edge.ts        # Edge-safe JWT-only config (middleware only)
│   │   └── index.ts       # NextAuth handlers export
│   ├── db/prisma.ts       # Prisma client with PgBouncer adapter
│   ├── email/templates.ts # Resend email templates (test/live mode aware)
│   ├── env.ts             # Zod env validation (throws on startup if vars missing)
│   ├── ical/              # iCal sync (inbound) + outbound feed generation
│   ├── ratelimit/         # Upstash rate limiters (fail-open on error)
│   └── stripe/            # Stripe client (lazy init)
├── messages/              # i18n strings: bg.json, en.json, ro.json
└── middleware.ts          # next-intl routing + JWT auth (Edge runtime)
prisma/
├── schema.prisma          # Full DB schema
├── migrations/            # Prisma migrations (run db:push for free-tier setup)
└── seed.ts                # Seeds 3 apartments + admin user
```

---

## Key Commands

```bash
npm run dev          # Start dev server
npm run build        # prisma generate + next build
npm run db:push      # Push schema to DB (no migration files needed)
npm run db:seed      # Seed apartments, amenities, admin user
npm run db:migrate   # Create a named migration (production workflow)
npm run db:studio    # Open Prisma Studio (visual DB browser)
```

---

## Architecture Notes

- **Middleware bundle size:** `src/middleware.ts` runs on Vercel's Edge runtime (1 MB limit). It imports `src/lib/auth/edge.ts` — a JWT-only NextAuth config with no Node.js imports. The full auth config (Prisma, bcrypt, speakeasy) is used only by Node.js API routes.
- **Database connection:** Uses Supabase's PgBouncer pooler (port 6543) for serverless compatibility. `DIRECT_URL` (port 5432) is used only by Prisma CLI for migrations.
- **Rate limiting:** All three rate limiters (booking, contact, admin login) fail open — if Upstash is unreachable, requests are allowed through rather than returning 500.
- **iCal security:** Outbound feed URLs are HMAC-signed with `ICAL_HMAC_SECRET`. Inbound cron endpoint is protected with `Authorization: Bearer {CRON_SECRET}`.
- **Email test mode:** `EMAIL_MODE=test` prefixes all subjects with `[TEST MODE]` and CCs the owner on guest-facing emails.

---

## Going Live

See `GO_LIVE_CHECKLIST.md` — it's a single document with every step to switch from test to production. No code changes required, only environment variable updates.

## Owner Guide

See `OWNER_GUIDE.md` — written for a non-technical owner. Explains how to test bookings, manage the admin panel, and connect Airbnb/Booking.com calendars.

## Cost Breakdown

See `COSTS.md` — current monthly cost is €0. Projected costs at full occupancy are documented with exact thresholds.
