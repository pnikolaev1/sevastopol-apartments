# Security Documentation — Sevastopol Apartments

## Defenses Implemented

### 1. Authentication & Session Security
- **Admin auth:** NextAuth.js (Auth.js v5) with Credentials provider + TOTP 2FA (speakeasy)
- **Password hashing:** bcrypt cost factor 12 — brute-force resistant
- **Session:** JWT, 8-hour TTL, httpOnly/secure/sameSite=lax cookies
- **Rate limiting:** 5 attempts / 15 minutes per IP on `/admin/login` (Upstash Redis)

### 2. Transport Security
- **HTTPS enforced:** HSTS header with 2-year max-age + includeSubDomains + preload
- **TLS:** Vercel + Cloudflare enforce TLS 1.2+

### 3. Content Security Policy
CSP is set via Next.js `headers()` config. Allows:
- Scripts: self + Stripe.js + Plausible only
- Frames: Stripe only (for 3D Secure)
- Connects: self + Stripe API + Supabase only
- `object-src: none` — prevents plugin-based attacks

### 4. Input Validation
- **All API routes:** Zod schemas validate every field server-side
- **Never trust client:** Prices are re-calculated server-side from DB on booking confirmation
- **String limits:** All string fields have `.max()` constraints to prevent payload bloat

### 5. SQL Injection
- **Prisma ORM only:** All queries use parameterized statements
- **No raw SQL:** `prisma.$queryRaw` is never used in the codebase
- **DB exclusion constraint:** PostgreSQL GIST exclusion prevents overlapping bookings at DB level

### 6. Cross-Site Scripting (XSS)
- **React escapes by default:** All user content rendered via JSX is auto-escaped
- `dangerouslySetInnerHTML` used ONLY for apartment descriptions — content is owner-controlled, not guest-controlled
- **CSP:** Restricts inline script execution

### 7. CSRF Protection
- **Server Actions:** Next.js App Router uses same-origin checks on Server Actions
- **API routes:** JSON-only endpoints (`Content-Type: application/json` required)
- **SameSite=lax cookies:** Blocks cross-origin POST with cookies

### 8. Stripe Webhook Security
- **Signature verification:** Every webhook validates `stripe-signature` header using `stripe.webhooks.constructEvent()`
- Malformed or unsigned requests return 400 immediately

### 9. iCal Feed Security
- **HMAC token:** Outbound feed URLs include a 32-char HMAC-SHA256 token
- `crypto.timingSafeEqual` used for comparison — prevents timing attacks
- Feed URL is unguessable without the `ICAL_HMAC_SECRET`

### 10. Rate Limiting
| Endpoint | Limit | Window |
|---|---|---|
| `/api/booking/*` | 5 requests | 1 minute |
| `/api/contact` | 10 requests | 1 minute |
| `/admin/login` | 5 attempts | 15 minutes |

### 11. Server-Side Request Forgery (SSRF)
- iCal feed URLs are stored in the database by the admin only
- External HTTP requests only made from the cron job to known iCal URLs

### 12. Insecure Direct Object Reference (IDOR)
- Booking confirmation page: only shows booking details — no sensitive payment data
- Admin API routes: protected by `auth()` middleware

### 13. Image Upload Security
- MIME type validation (server-side)
- 5 MB size limit enforced
- Files stored in Supabase Storage with random UUID filenames
- EXIF stripping via `sharp` before storage

### 14. GDPR
- Cookie consent banner with granular categories (necessary / analytics / marketing)
- `/api/data-export` endpoint for subject access requests
- `/api/data-delete` endpoint for deletion requests
- Privacy Policy includes Bulgarian Personal Data Protection Act reference
- Audit log records all admin actions

### 15. Secret Management
- All secrets in environment variables — never in code
- `.env.local` is gitignored
- `.env.example` provided with placeholder values

---

## Incident Response

### Payment + double-booking race condition
1. Stripe webhook triggers booking confirmation
2. System checks for conflicts post-payment
3. If conflict: automatic Stripe refund via `stripe.refunds.create()`
4. Owner email alert sent immediately
5. Incident logged in `AdminAuditLog`

### Compromised admin credentials
1. Disable `NEXTAUTH_SECRET` rotation forces all sessions to expire
2. TOTP 2FA prevents access even with stolen password
3. Set a new password via Supabase direct DB access: `UPDATE admin_users SET password_hash = '...' WHERE email = '5areood@gmail.com';`

### iCal sync failure
- Each sync attempt logged in `SyncLog` table
- Admin dashboard shows sync health (last success time + error count)
- Manual re-sync available from Admin → Settings

### DDoS / Bot attack
- Cloudflare WAF + DDoS protection in front of Vercel
- Rate limiting on all public API endpoints
- Bot protection: Cloudflare Bot Management (free tier)

---

## Audit Log

All admin actions are recorded in `AdminAuditLog`:
- Booking create/cancel/approve/decline
- Apartment create/update
- Settings changes
- Login events

Query: `SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 100;`
