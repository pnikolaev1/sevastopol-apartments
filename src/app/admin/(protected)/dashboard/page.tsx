import { prisma } from "@/lib/db/prisma";
import { BookingStatus } from "@prisma/client";
import { CalendarDays, Users, TrendingUp, Clock, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

function formatEur(amount: number | string | { valueOf(): string }) {
  return `€${Number(amount).toFixed(2)}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [
    pendingBookings,
    todayCheckIns,
    todayCheckOuts,
    monthRevenue,
    recentBookings,
    syncLogs,
  ] = await Promise.all([
    prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
    prisma.booking.findMany({
      where: { checkIn: today, status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] } },
      include: { guest: true, apartment: { include: { translations: { where: { locale: "en" } } } } },
    }),
    prisma.booking.findMany({
      where: { checkOut: today, status: BookingStatus.CONFIRMED },
      include: { guest: true, apartment: { include: { translations: { where: { locale: "en" } } } } },
    }),
    prisma.booking.aggregate({
      where: {
        status: BookingStatus.CONFIRMED,
        checkIn: { gte: thisMonthStart, lte: thisMonthEnd },
      },
      _sum: { totalAmount: true },
    }),
    prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { guest: true, apartment: { include: { translations: { where: { locale: "en" } } } } },
    }),
    prisma.syncLog.findMany({
      take: 6,
      orderBy: { syncedAt: "desc" },
      include: { apartment: { include: { translations: { where: { locale: "en" } } } } },
    }),
  ]);

  const monthTotal = Number(monthRevenue._sum.totalAmount ?? 0);

  const statusColors: Record<BookingStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100">
              <Clock className="h-4 w-4 text-yellow-700" />
            </div>
            <span className="text-sm font-medium text-gray-600">Pending</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingBookings}</p>
          <p className="text-xs text-gray-500 mt-1">awaiting payment</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <CalendarDays className="h-4 w-4 text-blue-700" />
            </div>
            <span className="text-sm font-medium text-gray-600">Today check-ins</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{todayCheckIns.length}</p>
          <p className="text-xs text-gray-500 mt-1">arriving today</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
              <Users className="h-4 w-4 text-purple-700" />
            </div>
            <span className="text-sm font-medium text-gray-600">Today check-outs</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{todayCheckOuts.length}</p>
          <p className="text-xs text-gray-500 mt-1">departing today</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <TrendingUp className="h-4 w-4 text-green-700" />
            </div>
            <span className="text-sm font-medium text-gray-600">This month</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatEur(monthTotal)}</p>
          <p className="text-xs text-gray-500 mt-1">confirmed revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's activity */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">Today — {formatDate(today)}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {todayCheckIns.length === 0 && todayCheckOuts.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">No arrivals or departures today</p>
            )}
            {todayCheckIns.map((b) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {b.guest.firstName} {b.guest.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{b.apartment.translations[0]?.name} · check-in</p>
                </div>
                <ArrowRight className="h-3 w-3 text-gray-400" />
              </Link>
            ))}
            {todayCheckOuts.map((b) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <XCircle className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {b.guest.firstName} {b.guest.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{b.apartment.translations[0]?.name} · check-out</p>
                </div>
                <ArrowRight className="h-3 w-3 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>

        {/* iCal sync health */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">iCal Sync</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {syncLogs.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">No sync logs yet</p>
            )}
            {syncLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`h-2 w-2 rounded-full shrink-0 ${log.success ? "bg-green-500" : "bg-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {log.apartment.translations[0]?.name} · {log.source}
                  </p>
                  {log.errorMsg && (
                    <p className="text-xs text-red-500 truncate">{log.errorMsg}</p>
                  )}
                  {!log.errorMsg && (
                    <p className="text-xs text-gray-500">{log.recordCount} records</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(log.syncedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Guest</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Apartment</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Dates</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/bookings/${b.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {b.guest.firstName} {b.guest.lastName}
                    </Link>
                    <p className="text-xs text-gray-500">{b.guest.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {b.apartment.translations[0]?.name ?? b.apartment.id}
                  </td>
                  <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                    {formatDate(new Date(b.checkIn))} → {formatDate(new Date(b.checkOut))}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">{formatEur(b.totalAmount)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">No bookings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
