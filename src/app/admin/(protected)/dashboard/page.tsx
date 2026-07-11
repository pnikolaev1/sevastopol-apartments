import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import {
  CalendarCheck,
  CalendarDays,
  Euro,
  LogIn,
  LogOut,
  Percent,
  Plus,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Табло" };

const DAY_MS = 24 * 60 * 60 * 1000;

const SOURCE_BG: Record<string, string> = {
  DIRECT: "Директна",
  MANUAL: "Ръчна",
  AIRBNB: "Airbnb",
  BOOKING_COM: "Booking.com",
};

const STATUS_BG: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: "Потвърдена", cls: "bg-green-100 text-green-700" },
  PENDING: { label: "Чакаща", cls: "bg-amber-100 text-amber-700" },
  CANCELLED: { label: "Отказана", cls: "bg-gray-100 text-gray-500" },
  REFUNDED: { label: "Възстановена", cls: "bg-red-100 text-red-600" },
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString("bg-BG", { day: "numeric", month: "short" });
}

/** Nights of [ci, co) that fall inside [start, end). */
function nightsWithin(ci: Date, co: Date, start: Date, end: Date): number {
  const from = Math.max(ci.getTime(), start.getTime());
  const to = Math.min(co.getTime(), end.getTime());
  return Math.max(0, Math.round((to - from) / DAY_MS));
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const daysInMonth = Math.round((monthEnd.getTime() - monthStart.getTime()) / DAY_MS);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const in7days = new Date(today.getTime() + 7 * DAY_MS);

  const [apartmentCount, monthBookings, externalMonth, upcoming, departures, recent] =
    await Promise.all([
      prisma.apartment.count({ where: { active: true } }),
      prisma.booking.findMany({
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
          checkIn: { lt: monthEnd },
          checkOut: { gt: monthStart },
        },
        select: { checkIn: true, checkOut: true, totalAmount: true, status: true },
      }),
      prisma.externalBooking.findMany({
        where: { checkIn: { lt: monthEnd }, checkOut: { gt: monthStart } },
        select: { checkIn: true, checkOut: true },
      }),
      prisma.booking.findMany({
        where: {
          status: BookingStatus.CONFIRMED,
          checkIn: { gte: today, lt: in7days },
        },
        orderBy: { checkIn: "asc" },
        include: {
          guest: { select: { firstName: true, lastName: true } },
          apartment: { include: { translations: { where: { locale: "bg" } } } },
        },
      }),
      prisma.booking.findMany({
        where: {
          status: BookingStatus.CONFIRMED,
          checkOut: { gte: today, lt: new Date(today.getTime() + 2 * DAY_MS) },
        },
        orderBy: { checkOut: "asc" },
        include: {
          guest: { select: { firstName: true, lastName: true } },
          apartment: { include: { translations: { where: { locale: "bg" } } } },
        },
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          guest: { select: { firstName: true, lastName: true } },
          apartment: { include: { translations: { where: { locale: "bg" } } } },
        },
      }),
    ]);

  // Revenue: confirmed bookings that touch this month (full booking value).
  const revenue = monthBookings
    .filter((b) => b.status === BookingStatus.CONFIRMED)
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const bookedNights =
    monthBookings.reduce((s, b) => s + nightsWithin(b.checkIn, b.checkOut, monthStart, monthEnd), 0) +
    externalMonth.reduce((s, b) => s + nightsWithin(b.checkIn, b.checkOut, monthStart, monthEnd), 0);
  const occupancy =
    apartmentCount > 0 ? Math.round((bookedNights / (daysInMonth * apartmentCount)) * 100) : 0;

  const monthName = now.toLocaleDateString("bg-BG", { month: "long" });

  const stats = [
    { icon: Euro, label: `Приход · ${monthName}`, value: `€${revenue.toFixed(0)}`, tile: "bg-gold text-navy" },
    { icon: Percent, label: `Заетост · ${monthName}`, value: `${occupancy}%`, tile: "bg-navy text-gold" },
    { icon: CalendarCheck, label: "Резервации този месец", value: String(monthBookings.length), tile: "bg-brand-teal text-white" },
    { icon: LogIn, label: "Настанявания · 7 дни", value: String(upcoming.length), tile: "bg-navy text-white" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">Табло</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/bookings/new"
            className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-navy hover:bg-gold-pale"
          >
            <Plus className="h-4 w-4" />
            Нова резервация
          </Link>
          <Link
            href="/admin/calendar"
            className="flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
          >
            <CalendarDays className="h-4 w-4" />
            Календар
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, tile }) => (
          <div key={label} className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tile}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-extrabold text-navy">{value}</p>
            <p className="mt-1 text-xs font-medium text-navy/50">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Check-ins / check-outs */}
        <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-navy">
            <LogIn className="h-4 w-4 text-gold-deep" />
            Настанявания — следващите 7 дни
          </h2>
          <div className="space-y-2">
            {upcoming.map((b) => (
              <Link
                key={b.id}
                href={`/admin/bookings/${b.id}`}
                className="flex items-center gap-3 rounded-lg border border-navy/5 bg-gray-50 px-3 py-2.5 text-sm hover:border-gold"
              >
                <span className="w-14 shrink-0 font-bold text-navy">{fmtDate(b.checkIn)}</span>
                <span className="font-medium text-navy">
                  {b.guest.firstName} {b.guest.lastName}
                </span>
                <span className="ml-auto text-xs text-navy/50">
                  {b.apartment.translations[0]?.name} · {b.guestCount} гости
                </span>
              </Link>
            ))}
            {upcoming.length === 0 && (
              <p className="py-4 text-center text-sm text-navy/40">Няма предстоящи настанявания</p>
            )}
          </div>

          <h2 className="mb-3 mt-5 flex items-center gap-2 font-bold text-navy">
            <LogOut className="h-4 w-4 text-gold-deep" />
            Напускания — днес и утре
          </h2>
          <div className="space-y-2">
            {departures.map((b) => (
              <Link
                key={b.id}
                href={`/admin/bookings/${b.id}`}
                className="flex items-center gap-3 rounded-lg border border-navy/5 bg-gray-50 px-3 py-2.5 text-sm hover:border-gold"
              >
                <span className="w-14 shrink-0 font-bold text-navy">{fmtDate(b.checkOut)}</span>
                <span className="font-medium text-navy">
                  {b.guest.firstName} {b.guest.lastName}
                </span>
                <span className="ml-auto text-xs text-navy/50">{b.apartment.translations[0]?.name}</span>
              </Link>
            ))}
            {departures.length === 0 && (
              <p className="py-4 text-center text-sm text-navy/40">Няма напускания днес/утре</p>
            )}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-navy">Последни резервации</h2>
          <div className="space-y-2">
            {recent.map((b) => {
              const st = STATUS_BG[b.status] ?? { label: b.status, cls: "bg-gray-100 text-gray-600" };
              return (
                <Link
                  key={b.id}
                  href={`/admin/bookings/${b.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-navy/5 bg-gray-50 px-3 py-2.5 text-sm hover:border-gold"
                >
                  <span className="font-medium text-navy">
                    {b.guest.firstName} {b.guest.lastName}
                  </span>
                  <span className="text-xs text-navy/50">
                    {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} · {b.apartment.translations[0]?.name}
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-navy/60">{SOURCE_BG[b.source] ?? b.source}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>
                      {st.label}
                    </span>
                    <span className="font-bold text-navy">€{Number(b.totalAmount).toFixed(0)}</span>
                  </span>
                </Link>
              );
            })}
            {recent.length === 0 && (
              <p className="py-4 text-center text-sm text-navy/40">Все още няма резервации</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
