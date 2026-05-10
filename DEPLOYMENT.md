# Deployment Guide — Sevastopol Apartments

## Prerequisites

You need accounts on:
- [Supabase](https://supabase.com) — free tier
- [Vercel](https://vercel.com) — free Hobby tier
- [Stripe](https://stripe.com) — activate your account
- [Resend](https://resend.com) — free tier (3,000 emails/month)
- [Upstash](https://upstash.com) — free Redis tier
- A domain registrar (e.g., Namecheap, GoDaddy) — for `sevastopolapartments.com`
- [Cloudflare](https://cloudflare.com) — free tier

---

## Step 1: Domain & Cloudflare

1. Register `sevastopolapartments.com` (or your chosen domain)
2. In Cloudflare, add your domain → follow their nameserver instructions at your registrar
3. Wait for DNS propagation (5–30 minutes)

---

## Step 2: Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
   - Name: `sevastopol-apartments`
   - Password: use a strong password (save it!)
   - Region: `eu-central-1` (Frankfurt) — closest to Bulgaria
2. Go to **Project Settings → Database → Connection string**
   - Copy the **URI** pooler string → use as `DATABASE_URL`
   - Copy the **Direct connection** URI → use as `DIRECT_URL`
3. Go to **Project Settings → API**
   - Copy the **Project URL** and **service_role** key

---

## Step 3: Run Database Migrations

On your local machine with `.env.local` filled in:

```bash
npm run db:push      # Pushes schema to Supabase (first time)
npm run db:seed      # Seeds 3 apartments, amenities, admin user
```

Or with migrations (recommended for production):
```bash
npm run db:migrate -- --name init
```

**Verify the seed:** Go to Supabase Dashboard → Table Editor → confirm `apartments`, `apartment_translations`, `admin_users` tables have data.

---

## Step 4: Stripe Setup

1. [Stripe Dashboard](https://dashboard.stripe.com) → Activate your account
2. Go to **Developers → API keys**
   - Copy Publishable key → `STRIPE_PUBLISHABLE_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy Secret key → `STRIPE_SECRET_KEY`
3. Go to **Developers → Webhooks → Add endpoint**
   - URL: `https://sevastopolapartments.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`
4. Start with test mode keys (`sk_test_`, `pk_test_`). Switch to live keys before going live.

---

## Step 5: Resend Setup

1. [Resend Dashboard](https://resend.com) → Create API key → copy → `RESEND_API_KEY`
2. Go to **Domains → Add Domain** → enter `sevastopolapartments.com`
3. Add the DNS records Resend gives you in Cloudflare (TXT + MX records)
4. Wait for verification (usually 10 minutes)
5. Set `RESEND_FROM_EMAIL="bookings@sevastopolapartments.com"`

---

## Step 6: Upstash Redis Setup

1. [Upstash Console](https://console.upstash.com) → Create Database
   - Name: `sevapart-ratelimit`
   - Region: `eu-west-1` (Ireland) — closest to Vercel Frankfurt
   - Type: Regional
2. Copy **REST URL** → `UPSTASH_REDIS_REST_URL`
3. Copy **REST Token** → `UPSTASH_REDIS_REST_TOKEN`

---

## Step 7: Vercel Deployment

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "feat: initial production build"
git remote add origin https://github.com/YOUR_USERNAME/sevapart.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Select your repo → Framework: **Next.js** (auto-detected)
4. Go to **Environment Variables** and add every variable from `.env.example` with real values
5. Click **Deploy**

---

## Step 8: Connect Domain to Vercel

1. In Vercel → Project → Settings → Domains → Add `sevastopolapartments.com`
2. Vercel will show you DNS records
3. In Cloudflare → DNS → Add the records Vercel provides
   - Use **Proxied** (orange cloud) for the CNAME/A records — this routes traffic through Cloudflare

---

## Step 9: Configure Cloudflare

1. **SSL/TLS** → Set to **Full (strict)**
2. **Security → WAF** → Enable (default rules are fine for free tier)
3. **Speed → Optimization** → Enable Auto Minify + Rocket Loader (for CSS/JS)
4. **Caching → Configuration** → Caching Level: Standard
5. **Rules → Page Rules** → Add rule: `sevastopolapartments.com/api/*` → Cache Level: Bypass (don't cache API calls)

---

## Step 10: Connect Airbnb & Booking.com iCal

### Airbnb
1. Go to your Airbnb listing → **Manage listing → Availability → Sync calendars**
2. Click **Export Calendar** → copy the `.ics` URL
3. In the Admin Panel → Settings → paste the URL for each apartment

### Booking.com
1. Go to **Extranet → Calendar → Sync**
2. Click **iCal import/export** → Export calendar → copy URL
3. Paste in Admin Panel → Settings

### Set up outbound feed (so OTAs can read your direct bookings)
1. Admin Panel → Settings → copy the **Outbound iCal URL** for each apartment
2. Paste into Airbnb: **Sync calendars → Import from URL**
3. Paste into Booking.com: **Extranet → Calendar → Sync → Import iCal URL**

---

## Step 11: Test the Full Flow

1. Open your site → go to an apartment → select dates → Book Now
2. Use Stripe test card: `4242 4242 4242 4242` (any future date, any CVC)
3. Confirm booking appears in Admin Panel
4. Confirm confirmation email arrives in your inbox
5. Switch Stripe keys to **live mode** in Vercel environment variables

---

## Environment Variables Checklist

```
DATABASE_URL             ✓ Supabase pooler URI
DIRECT_URL               ✓ Supabase direct URI
NEXTAUTH_URL             ✓ https://sevastopolapartments.com
NEXTAUTH_SECRET          ✓ openssl rand -base64 32
STRIPE_SECRET_KEY        ✓ sk_live_...
STRIPE_PUBLISHABLE_KEY   ✓ pk_live_...
STRIPE_WEBHOOK_SECRET    ✓ whsec_...
RESEND_API_KEY           ✓ re_...
RESEND_FROM_EMAIL        ✓ bookings@sevastopolapartments.com
UPSTASH_REDIS_REST_URL   ✓
UPSTASH_REDIS_REST_TOKEN ✓
NEXT_PUBLIC_APP_URL      ✓ https://sevastopolapartments.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ✓ pk_live_...
ICAL_HMAC_SECRET         ✓ openssl rand -base64 32
CRON_SECRET              ✓ openssl rand -hex 32
OWNER_EMAIL              ✓ 5areood@gmail.com
OWNER_WHATSAPP           ✓ 35989436230
```
