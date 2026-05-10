import { prisma } from "@/lib/db/prisma";
import { BookingStatus, BookingSource } from "@prisma/client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookings" };

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

function formatEur(v: number | string | { valueOf(): string }) {
  return `€${Number(v).toFixed(0)}`;
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

const sourceLabels: Record<BookingSource, string> = {
  DIRECT: "Direct",
  BOOKING_COM: "Booking.com",
  AIRBNB: "Airbnb",
  MANUAL: "Manual",
};

export default async function BookingsPage({ searchParams }: PageProps) {
  const { status, q } = await searchParams;

  const statusFilter = Object.values(BookingStatus).includes(status as BookingStatus)
    ? (status as BookingStatus)
    : undefined;

  const bookings = await prisma.booking.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q
        ? {
            OR: [
              { guest: { email: { contains: q, mode: "insensitive" } } },
              { guest: { firstName: { contains: q, mode: "insensitive" } } },
              { guest: { lastName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      guest: true,
      apartment: { include: { translations: { where: { locale: "en" } } } },
    },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search guest name or email…"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-64"
        />
        <select
          name="status"
          defaultValue={statusFilter ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
        >
          <option value="">All statuses</option>
          {Object.values(BookingStatus).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Filter
        </button>
        {(statusFilter || q) && (
          <a href="/admin/bookings" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Clear
          </a>
        )}
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Guest</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Apartment</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Check-in</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Check-out</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Nights</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Source</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{b.guest.firstName} {b.guest.lastName}</p>
                    <p className="text-xs text-gray-500">{b.guest.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-700 max-w-[160px] truncate">
                    {b.apartment.translations[0]?.name ?? b.apartment.id}
                  </td>
                  <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{formatDate(b.checkIn)}</td>
                  <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{formatDate(b.checkOut)}</td>
                  <td className="px-5 py-3 text-gray-700">{b.nights}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{formatEur(b.totalAmount)}</td>
                  <td className="px-5 py-3 text-gray-500">{sourceLabels[b.source]}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/bookings/${b.id}`} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-400">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
