# Go-Live Checklist — Sevastopol Apartments

When you're ready to accept real bookings and real payments, follow these steps **in order**.
Every step is just an environment variable change or a DNS record — no code rewrites.

Estimated time: **60–90 minutes** (most of it waiting for DNS to propagate).

---

## Step 1 — Register a Domain

**Recommended registrar:** Cloudflare Registrar — https://www.cloudflare.com/products/registrar/
- Price: ~€10–12/year for `.com`, no markup
- Suggested domain: `sevastopolapartments.com` or `sevastopol-apartments.com`

After purchase, your domain will be managed inside Cloudflare — keep the tab open.

---

## Step 2 — Add Domain to Vercel

1. Go to **https://vercel.com** → your project → **Settings** → **Domains**
2. Click **Add** → type your domain (e.g. `sevastopolapartments.com`)
3. Vercel will show you DNS records to add — keep this tab open

---

## Step 3 — Point DNS to Vercel

In Cloudflare → your domain → **DNS**:

Add the records Vercel shows you. Usually:
- An **A record** for `@` pointing to Vercel's IP
- A **CNAME record** for `www` pointing to `cname.vercel-dns.com`

Use **Proxied** (orange cloud) for both records.

Wait **5–30 minutes** for DNS to propagate. Vercel's Domains page will show a green tick when it's done.

---

## Step 4 — Update Hosting Environment Variables

In Vercel → **Settings** → **Environment Variables**, update:

| Variable | Old value | New value |
|---|---|---|
| `NEXTAUTH_URL` | `https://sevastopol-apartments.vercel.app` | `https://sevastopolapartments.com` |
| `NEXT_PUBLIC_APP_URL` | `https://sevastopol-apartments.vercel.app` | `https://sevastopolapartments.com` |

Click **Save** after each change.

---

## Step 5 — Switch Stripe to Live Mode

1. Go to **https://dashboard.stripe.com** → toggle **"Test mode"** off (top-right switch)
2. Go to **Developers** → **API keys**
3. Copy your **live** Secret key (`sk_live_...`) and Publishable key (`pk_live_...`)
4. Go to **Developers** → **Webhooks** → **Add endpoint**
   - URL: `https://sevastopolapartments.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the **Signing secret** (`whsec_...`)

In Vercel env vars, update:

| Variable | New value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from the new live webhook) |
| `NEXT_PUBLIC_STRIPE_MODE` | `live` |

---

## Step 6 — Switch Email to Live Mode

1. Go to **https://resend.com** → **Domains** → **Add Domain**
2. Enter `sevastopolapartments.com`
3. Resend will give you DNS records (TXT + MX) — add them in Cloudflare
4. Wait for verification (usually 5–10 minutes)

In Vercel env vars, update:

| Variable | New value |
|---|---|
| `RESEND_FROM_EMAIL` | `bookings@sevastopolapartments.com` |
| `EMAIL_MODE` | `live` |

---

## Step 7 — Update Cron URL

In cron-job.org → edit your cronjob → update the URL from:
```
https://sevastopol-apartments.vercel.app/api/cron/sync-ical
```
to:
```
https://sevastopolapartments.com/api/cron/sync-ical
```

---

## Step 8 — Redeploy

In Vercel → your project → **Deployments** → click the **⋯** menu on the latest deployment → **Redeploy**.

This picks up all the environment variable changes.

---

## Step 9 — Final Verification

Run a real €1 booking (you can refund it immediately from the Stripe dashboard):

- [ ] Site loads at `https://sevastopolapartments.com`
- [ ] **No** TEST MODE banner visible on the booking page
- [ ] Real payment completes with a real card
- [ ] Confirmation email arrives from `bookings@sevastopolapartments.com` (no `[TEST MODE]` prefix)
- [ ] Owner notification email arrives at `5areood@gmail.com`
- [ ] Admin panel shows the booking as **Confirmed**
- [ ] Refund the test booking: Stripe Dashboard → Payments → find the charge → Refund

---

## Summary of All Env Var Changes

| Variable | Test value | Live value |
|---|---|---|
| `NEXTAUTH_URL` | `https://sevastopol-apartments.vercel.app` | `https://sevastopolapartments.com` |
| `NEXT_PUBLIC_APP_URL` | `https://sevastopol-apartments.vercel.app` | `https://sevastopolapartments.com` |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (test webhook) | `whsec_...` (live webhook) |
| `NEXT_PUBLIC_STRIPE_MODE` | `test` | `live` |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | `bookings@sevastopolapartments.com` |
| `EMAIL_MODE` | `test` | `live` |

**Zero code changes required.** Everything switches via environment variables only.
