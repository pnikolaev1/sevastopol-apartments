# Owner Guide — Sevastopol Apartments

Your website is live at **https://sevastopol-apartments.vercel.app**

Everything is in **test mode** right now — no real money moves. This guide explains how to use the site for testing, and what to do when you're ready to go live.

---

## How to Log Into Admin

1. Go to **https://sevastopol-apartments.vercel.app/admin/login**
2. Email: `5areood@gmail.com`
3. Password: `P77H82P04V06`

> **Important:** Change your password immediately after first login. Go to Admin → Settings → Change Password.

From the admin panel you can:
- See all bookings (pending, confirmed, cancelled)
- Approve or reject booking requests
- Edit apartment details, prices, and photos
- View the calendar sync logs

---

## How to Test a Booking (End-to-End)

This tests the full flow — just like a real guest would experience it.

1. Open the site: **https://sevastopol-apartments.vercel.app**
2. Click on any apartment → choose dates → click **Book Now**
3. Fill in any name, email, and phone number
4. Click **Continue to Payment**
5. You'll see a yellow banner: **TEST MODE — NO REAL CHARGES**
6. Use these test card details:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** any future date (e.g. `12/28`)
   - **CVC:** any 3 digits (e.g. `123`)
   - **Name:** anything
7. Click **Confirm & Pay**
8. You should be redirected to a booking confirmation page
9. Check your email (`5areood@gmail.com`) — you should receive:
   - A guest confirmation email (you are CC'd on it in test mode)
   - An owner notification email

If any of these steps fail, take a screenshot and contact your developer.

### Other test card numbers

| Card number | What it tests |
|---|---|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |

---

## How to Update Apartment Prices

1. Log into admin
2. Go to **Apartments** → click on the apartment you want to edit
3. Change **Base price (EUR)**, **Cleaning fee**, **Weekend uplift %**, or **Min stay nights**
4. Click **Save**

Prices take effect immediately for new bookings.

---

## How to Update Apartment Photos

Photos are stored as web links (URLs). To add a new photo:

1. Upload the photo to a free image host such as **https://imgbb.com** (upload → copy "Direct link")
2. Log into admin → Apartments → edit the apartment → scroll to Photos
3. Paste the URL and save

---

## How to Connect Airbnb / Booking.com Calendars

This prevents double-bookings by syncing your OTA calendars every 15 minutes.

### Get your Airbnb iCal link
1. Log into Airbnb → go to your listing → **Manage listing**
2. Go to **Availability** → **Sync calendars** → **Export calendar**
3. Copy the `.ics` URL

### Get your Booking.com iCal link
1. Log into Booking.com Extranet → **Calendar** → **Sync**
2. Click **Export calendar** → copy the URL

### Paste them in admin
1. Log into admin → **Apartments** → click the apartment
2. Paste the Airbnb URL into **Airbnb iCal URL**
3. Paste the Booking.com URL into **Booking.com iCal URL**
4. Save — the system syncs every 15 minutes automatically

---

## How to Read the Calendar Sync Logs

1. Log into admin → **Dashboard**
2. Look for **Sync Logs** — shows last sync time, success/fail, and how many events were imported

If you see errors, the iCal URL has probably changed on Airbnb/Booking.com — paste the new one.

---

## What's Still in Test Mode

| Feature | Status | What this means |
|---|---|---|
| Payments | **TEST MODE** | No real money charged. Use card `4242 4242 4242 4242`. |
| Emails | **TEST MODE** | Subjects say `[TEST MODE]`. You are CC'd on all guest emails. |
| Domain | **Temporary** | URL is `sevastopol-apartments.vercel.app`, not your final domain. |

When you're ready to go live, see `GO_LIVE_CHECKLIST.md`.

---

## How to Reach Support

- **Developer:** contact the developer who built this site
- **Vercel (hosting):** https://vercel.com/help
- **Stripe (payments):** https://support.stripe.com
- **Resend (emails):** https://resend.com/docs

---

## Admin Credentials Summary

| What | Value |
|---|---|
| Admin URL | https://sevastopol-apartments.vercel.app/admin |
| Email | 5areood@gmail.com |
| Password | `P77H82P04V06` (change this after first login!) |
| Test card | `4242 4242 4242 4242` |
