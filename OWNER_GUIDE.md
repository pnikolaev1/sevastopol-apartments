# Owner Guide — Sevastopol Apartments Website

This guide is written for a non-technical owner. No technical knowledge needed.

---

## How to Log In to the Admin Panel

1. Open your website: `https://sevastopolapartments.com/admin`
2. Enter your email: `5areood@gmail.com`
3. Enter your password (change this after first login!)
4. Enter the 6-digit code from your **Google Authenticator** or **Authy** app

**Important:** Set up 2FA on first login (Admin → Settings → Enable 2FA). Scan the QR code with Google Authenticator.

---

## How to See Your Bookings

1. Log in → click **Bookings** in the left menu
2. You'll see all bookings with:
   - Guest name, email, phone
   - Apartment, dates, number of guests
   - Total paid
   - Status (Pending / Confirmed / Cancelled)

**Pending requests** (orange) need your approval. Click **Approve** or **Decline**.

---

## How to Approve a Booking Request

1. In Bookings, find the request with status **PENDING**
2. Click **Approve**
3. The system automatically sends the guest a payment link by email
4. Once the guest pays, status changes to **CONFIRMED**

---

## How to Add a Manual Booking (Phone Reservations)

1. Bookings → click **+ New Booking**
2. Fill in:
   - Apartment
   - Check-in / Check-out dates
   - Guest name, email, phone
   - Number of guests
3. Set Source to **Manual**
4. Click **Create**

This blocks the dates immediately.

---

## How to Cancel a Booking

1. Open the booking → click **Cancel**
2. If the guest paid, Stripe will automatically refund them within 5–10 business days
3. The dates become available again automatically

---

## How to Update Apartment Photos

1. Admin → **Apartments** → click on the apartment
2. Scroll to **Photos**
3. Click **Upload Photos** → select files from your computer (max 5 MB each, JPG/PNG)
4. Drag photos to reorder them (first photo = main photo shown in listings)
5. Click **Save**

---

## How to Change Prices

1. Admin → **Apartments** → click on the apartment
2. Change **Base nightly price (EUR)**
3. Change **Cleaning fee (EUR)**
4. To set seasonal prices: scroll to **Pricing Rules** → edit the date ranges and multipliers
   - Example: multiplier 1.4 = 40% higher in high season

---

## How to Connect Airbnb Calendar (prevents double bookings)

**Get your Airbnb iCal export URL:**
1. Go to Airbnb → Hosting → your listing → **Availability** (or Calendar)
2. Click **Sync calendars** → **Export calendar**
3. Copy the URL that appears (starts with `https://www.airbnb.com/calendar/ical/...`)

**Paste it in the admin panel:**
1. Admin → **Settings** → scroll to **iCal Sync**
2. Find the apartment → paste the Airbnb URL in **Airbnb iCal URL**
3. Click **Save**
4. The system will check for new bookings every 15 minutes automatically

---

## How to Connect Booking.com Calendar

**Get your Booking.com iCal URL:**
1. Log in to Booking.com Extranet → your property → **Calendar**
2. Click **Sync** → **Export calendar** (or **iCal export**)
3. Copy the URL

**Paste it:**
1. Admin → Settings → iCal Sync
2. Paste in **Booking.com iCal URL** → Save

---

## How to Give Booking.com / Airbnb Your Direct Booking Calendar

This lets Booking.com and Airbnb see your direct bookings (so they show the dates as unavailable):

1. Admin → **Settings** → copy the **Outbound iCal URL** for each apartment
2. **On Airbnb:** Availability → Sync calendars → Import → paste the URL
3. **On Booking.com:** Extranet → Calendar → Sync → Import iCal → paste the URL

---

## How to Edit Website Text

1. Admin → **Content**
2. Click on the page you want to edit (e.g., Area Guide)
3. Edit the text (supports basic formatting)
4. Click **Save**

---

## What to Do if a Payment Fails

1. The booking stays in **Pending** status
2. The guest will receive an email to try again
3. Check Admin → Bookings → look for pending with expired dates
4. You can manually cancel expired pending bookings

---

## What to Do if There's a Double Booking

This should be extremely rare due to the automatic 15-minute sync and real-time verification. But if it happens:

1. The system automatically refunds the guest who booked second
2. You'll receive an urgent email alert
3. Contact the guest by WhatsApp/email to apologize and offer a discount or alternative dates
4. The incident is logged in Admin → Audit Log

---

## Who to Contact for Technical Support

Contact your web developer at: `petargta8@gmail.com`

When reporting an issue, include:
- What you were trying to do
- What happened instead
- The URL of the page where the issue occurred
- A screenshot if possible
