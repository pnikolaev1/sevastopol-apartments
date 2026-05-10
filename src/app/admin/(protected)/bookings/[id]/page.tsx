import { prisma } from "@/lib/db/prisma";
import { BookingStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BookingActions from "./_BookingActions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Booking ${id.slice(0, 8)}` };
}

function formatEur(v: number | string | { valueOf(): string }) {
  return `€${Number(v).toFixed(2)}`;
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const statusColors: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      guest: true,
      apartment: { include: { translations: { where: { locale: "en" } } } },
    },
  });

  if (!booking) notFound();

  const aptName = booking.apartment.translations[0]?.name ?? booking.apartment.id;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/bookings" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Booking detail</h1>
        <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Guest info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Guest</h2>
          <dl className="space-y-2">
            <Row label="Name" value={`${booking.guest.firstName} ${booking.guest.lastName}`} />
            <Row label="Email" value={booking.guest.email} />
            <Row label="Phone" value={booking.guest.phone ?? "—"} />
            <Row label="Country" value={booking.guest.country ?? "—"} />
            <Row label="Language" value={booking.guest.locale.toUpperCase()} />
          </dl>
        </div>

        {/* Booking info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Booking</h2>
          <dl className="space-y-2">
            <Row label="Apartment" value={aptName} />
            <Row label="Check-in" value={formatDate(booking.checkIn)} />
            <Row label="Check-out" value={formatDate(booking.checkOut)} />
            <Row label="Nights" value={String(booking.nights)} />
            <Row label="Guests" value={String(booking.guestCount)} />
            <Row label="Source" value={booking.source} />
          </dl>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Pricing</h2>
          <dl className="space-y-2">
            <Row label="Base amount" value={formatEur(booking.baseAmount)} />
            <Row label="Cleaning fee" value={formatEur(booking.cleaningFee)} />
            <Row label="Tourist tax" value={formatEur(booking.touristTax)} />
            <Row label="Total" value={formatEur(booking.totalAmount)} bold />
            <Row label="Currency" value={booking.currency} />
          </dl>
        </div>

        {/* Payment + IDs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Payment</h2>
          <dl className="space-y-2">
            <Row label="Stripe PI" value={booking.stripePaymentIntentId ?? "—"} mono />
            <Row label="Paid at" value={booking.stripePaidAt ? formatDate(booking.stripePaidAt) : "—"} />
            <Row label="Booking ID" value={booking.id} mono />
            <Row label="Created" value={formatDate(booking.createdAt)} />
            {booking.expiresAt && (
              <Row label="Expires" value={formatDate(booking.expiresAt)} />
            )}
          </dl>
        </div>
      </div>

      {/* Special requests */}
      {booking.specialRequests && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Special Requests</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{booking.specialRequests}</p>
        </div>
      )}

      {/* Actions + internal notes */}
      <BookingActions booking={{
        id: booking.id,
        status: booking.status,
        internalNotes: booking.internalNotes ?? "",
      }} />
    </div>
  );
}

function Row({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className={`text-right break-all ${bold ? "font-semibold text-gray-900" : "text-gray-700"} ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
