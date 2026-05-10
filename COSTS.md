# Cost Breakdown — Sevastopol Apartments

## Current monthly cost: €0

Every service is on a free tier. Here is what each one provides and when it starts costing money.

---

## Service-by-Service Breakdown

### Vercel (Hosting)
| Tier | Cost | Limits |
|---|---|---|
| **Hobby (current)** | **€0/month** | 100 GB bandwidth, unlimited deploys, free SSL |
| Pro | ~€20/month | More bandwidth, team features, longer function timeouts |

**When you'll hit the limit:** 100 GB of bandwidth is roughly **200,000 page views per month** for a typical site. For 3 apartments, you would need to be running a very successful advertising campaign to get close. You will not hit this limit.

---

### Supabase (Database)
| Tier | Cost | Limits |
|---|---|---|
| **Free (current)** | **€0/month** | 500 MB DB, 1 GB storage, 5 GB bandwidth. Pauses after 7 days of inactivity. |
| Pro | ~€25/month | 8 GB DB, no pausing, daily backups |

**When you'll hit the limit:** 500 MB of database space stores roughly **1,000,000 bookings**. You will never hit this.

**One thing to know:** On the free tier, if nobody visits the site for 7 days straight, Supabase pauses the database. The first visitor after that pause will wait 5–10 seconds for it to wake up, then everything works normally. The `/api/health` endpoint is designed to wake it. You can prevent this entirely by upgrading to Pro (€25/month) when you go live.

---

### Upstash Redis (Rate Limiting)
| Tier | Cost | Limits |
|---|---|---|
| **Free (current)** | **€0/month** | 10,000 commands/day |
| Pay-as-you-go | ~€0.20 per 100,000 commands | Scales automatically |

**When you'll hit the limit:** Each page request that hits a rate-limited route uses 1–2 commands. 10,000 commands/day = ~5,000 booking attempts per day. For 3 apartments this is essentially unlimited.

---

### Resend (Email)
| Tier | Cost | Limits |
|---|---|---|
| **Free (current)** | **€0/month** | 3,000 emails/month, 100/day |
| Pro | ~€20/month | 50,000 emails/month |

**When you'll hit the limit:** Each booking generates 2 emails (guest confirmation + owner notification). 100 emails/day = 50 bookings per day. For 3 apartments you will never send 50 booking emails in one day. You will not hit this limit.

---

### Stripe (Payments)
| Mode | Cost |
|---|---|
| **Test mode (current)** | **€0** — no real money, unlimited test transactions |
| Live mode | 1.5% + €0.25 per successful transaction (EU cards) |

**When you'll hit the limit:** Stripe has no monthly fee. You pay per transaction only when live. For a €65 booking: Stripe takes €1.23. This is the industry standard and cannot be avoided on any platform.

---

### cron-job.org (iCal Sync Scheduler)
| Tier | Cost | Limits |
|---|---|---|
| **Free (current)** | **€0/month** | Unlimited cron jobs, any schedule |

No paid tier needed. This service is and will remain free for this use case.

---

## Projected Costs at Production Scale

Assuming **60 bookings/month** (full occupancy, 3 apartments, 3-night average stay):

| Service | Cost |
|---|---|
| Vercel Hobby | €0 |
| Supabase Free | €0 (consider Pro at €25/mo for reliability) |
| Upstash Free | €0 |
| Resend Free | €0 (120 emails/month, well under the 3,000 limit) |
| Stripe (live mode) | ~€55/month (on €3,600 in bookings at 1.5% + €0.25) |
| Domain | ~€1/month (€10–12/year) |
| **Total** | **~€56/month** |

The only unavoidable cost at scale is the Stripe transaction fee, which is the same fee Airbnb and Booking.com charge (they take 3–15%).

At full occupancy, your savings vs. OTA platforms (which take 10–20%) on €3,600/month in bookings:
- **OTA fees avoided: €360–€720/month**
- **Platform cost: ~€56/month**
- **Net saving: €300–€660/month**
