"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Lock, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeasonalRule {
  startDate: string | null;
  endDate: string | null;
  multiplier: number | null;
}

interface ApartmentInfo {
  id: string;
  name: string;
  basePriceEur: number;
  weekendUpliftPct: number;
  minStayNights: number;
  seasonalRules: SeasonalRule[];
}

interface Override {
  date: string;
  priceEur: string | number | null;
  closed: boolean;
  minNights: number | null;
}

interface CalBooking {
  id: string;
  checkIn: string;
  checkOut: string;
  status: string;
  source: string;
  guest: { firstName: string; lastName: string };
}

interface ExternalBlock {
  checkIn: string;
  checkOut: string;
  source: string;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const MONTHS = [
  "Януари", "Февруари", "Март", "Април", "Май", "Юни",
  "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември",
];

const SOURCE_STYLE: Record<string, { label: string; cls: string }> = {
  DIRECT: { label: "Директна", cls: "bg-navy text-white" },
  MANUAL: { label: "Ръчна", cls: "bg-gold text-navy" },
  AIRBNB: { label: "Airbnb", cls: "bg-rose-600 text-white" },
  BOOKING_COM: { label: "Booking", cls: "bg-blue-700 text-white" },
  external: { label: "Външна", cls: "bg-gray-400 text-white" },
};

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function RateCalendar({ apartments }: { apartments: ApartmentInfo[] }) {
  const [aptId, setAptId] = useState(apartments[0]?.id ?? "");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [external, setExternal] = useState<ExternalBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selStart, setSelStart] = useState<string | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);
  const [form, setForm] = useState({ price: "", closed: false, minNights: "" });

  const apt = apartments.find((a) => a.id === aptId);
  const monthKey = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`;

  const load = useCallback(async () => {
    if (!aptId) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/calendar?apartmentId=${aptId}&month=${monthKey}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOverrides(data.overrides.map((o: Override & { date: string }) => ({ ...o, date: o.date.slice(0, 10) })));
      setBookings(data.bookings);
      setExternal(data.external);
    } catch {
      setError("Грешка при зареждане на календара");
    } finally {
      setLoading(false);
    }
  }, [aptId, monthKey]);

  useEffect(() => {
    // Deferred to a microtask: the lint rule (rightly) forbids synchronous
    // setState inside an effect body, and load() flips loading state.
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const overrideByDay = useMemo(() => {
    const m = new Map<string, Override>();
    for (const o of overrides) m.set(o.date, o);
    return m;
  }, [overrides]);

  function computedPrice(dayIso: string): number {
    if (!apt) return 0;
    const o = overrideByDay.get(dayIso);
    if (o?.priceEur !== null && o?.priceEur !== undefined) return Number(o.priceEur);
    const d = new Date(`${dayIso}T00:00:00.000Z`);
    let rate = apt.basePriceEur;
    for (const r of apt.seasonalRules) {
      if (!r.startDate || !r.endDate || !r.multiplier) continue;
      if (d >= new Date(r.startDate) && d <= new Date(r.endDate)) {
        rate *= r.multiplier;
        break;
      }
    }
    const wd = d.getUTCDay();
    if (wd === 5 || wd === 6) rate *= 1 + apt.weekendUpliftPct / 100;
    return Math.round(rate);
  }

  function bookingFor(dayIso: string): { source: string; label: string; isStart: boolean } | null {
    const day = new Date(`${dayIso}T00:00:00.000Z`);
    for (const b of bookings) {
      const ci = new Date(b.checkIn);
      const co = new Date(b.checkOut);
      if (day >= ci && day < co) {
        return {
          source: b.source,
          label: `${b.guest.firstName} ${b.guest.lastName}`,
          isStart: iso(ci) === dayIso,
        };
      }
    }
    for (const e of external) {
      const ci = new Date(e.checkIn);
      const co = new Date(e.checkOut);
      if (day >= ci && day < co) {
        return { source: "external", label: e.source, isStart: iso(ci) === dayIso };
      }
    }
    return null;
  }

  // Calendar grid: weeks starting Monday
  const days = useMemo(() => {
    const first = new Date(month);
    const lead = (first.getUTCDay() + 6) % 7; // Mon = 0
    const start = new Date(first);
    start.setUTCDate(start.getUTCDate() - lead);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      cells.push(d);
    }
    return cells;
  }, [month]);

  const todayIso = iso(new Date());

  function clickDay(dayIso: string) {
    setError("");
    if (!selStart || (selStart && selEnd)) {
      setSelStart(dayIso);
      setSelEnd(null);
      const o = overrideByDay.get(dayIso);
      setForm({
        price: o?.priceEur !== null && o?.priceEur !== undefined ? String(Number(o.priceEur)) : "",
        closed: o?.closed ?? false,
        minNights: o?.minNights ? String(o.minNights) : "",
      });
    } else if (dayIso >= selStart) {
      setSelEnd(dayIso);
    } else {
      setSelStart(dayIso);
    }
  }

  const inSelection = (dayIso: string) =>
    selStart !== null && dayIso >= selStart && dayIso <= (selEnd ?? selStart);

  async function save(clear: boolean) {
    if (!selStart) return;
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        apartmentId: aptId,
        startDate: selStart,
        endDate: selEnd ?? selStart,
      };
      if (clear) {
        body.clear = true;
      } else {
        body.priceEur = form.price === "" ? null : Number(form.price);
        body.closed = form.closed;
        body.minNights = form.minNights === "" ? null : Number(form.minNights);
      }
      const res = await fetch("/api/admin/overrides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Грешка при запис");
      }
      setSelStart(null);
      setSelEnd(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">Календар и цени</h1>
        <div className="flex flex-wrap gap-2">
          {apartments.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setAptId(a.id);
                setSelStart(null);
                setSelEnd(null);
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                a.id === aptId
                  ? "bg-navy text-white"
                  : "bg-white text-navy border border-navy/15 hover:bg-navy/5"
              )}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        {/* Calendar */}
        <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setMonth((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() - 1, 1)))}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-navy/5"
              aria-label="Предишен месец"
            >
              <ChevronLeft className="h-5 w-5 text-navy" />
            </button>
            <div className="flex items-center gap-2 font-bold text-navy">
              {MONTHS[month.getUTCMonth()]} {month.getUTCFullYear()}
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gold-deep" />}
            </div>
            <button
              onClick={() => setMonth((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1)))}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-navy/5"
              aria-label="Следващ месец"
            >
              <ChevronRight className="h-5 w-5 text-navy" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="pb-1 text-center text-xs font-bold uppercase text-navy/50">
                {w}
              </div>
            ))}
            {days.map((d) => {
              const dayIso = iso(d);
              const inMonth = d.getUTCMonth() === month.getUTCMonth();
              const o = overrideByDay.get(dayIso);
              const bk = inMonth ? bookingFor(dayIso) : null;
              const src = bk ? (SOURCE_STYLE[bk.source] ?? SOURCE_STYLE.external) : null;
              const past = dayIso < todayIso;
              return (
                <button
                  key={dayIso}
                  onClick={() => inMonth && clickDay(dayIso)}
                  disabled={!inMonth}
                  className={cn(
                    "relative flex min-h-[76px] flex-col rounded-lg border p-1.5 text-left transition-colors",
                    inMonth ? "border-navy/10 bg-white hover:border-gold" : "border-transparent bg-transparent",
                    past && inMonth && "opacity-50",
                    o?.closed && inMonth && "bg-gray-100",
                    inSelection(dayIso) && inMonth && "ring-2 ring-gold border-gold"
                  )}
                >
                  {inMonth && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-semibold", dayIso === todayIso ? "flex h-5 w-5 items-center justify-center rounded-full bg-navy text-white" : "text-navy/70")}>
                          {d.getUTCDate()}
                        </span>
                        <span className="flex gap-0.5">
                          {o?.closed && <Lock className="h-3 w-3 text-gray-500" aria-label="Затворено" />}
                          {o?.priceEur !== null && o?.priceEur !== undefined && (
                            <Tag className="h-3 w-3 text-gold-deep" aria-label="Персонализирана цена" />
                          )}
                        </span>
                      </div>
                      <span className={cn("mt-auto text-[13px] font-bold", o?.priceEur !== null && o?.priceEur !== undefined ? "text-gold-deep" : "text-navy")}>
                        €{computedPrice(dayIso)}
                      </span>
                      {bk && src && (
                        <span
                          className={cn(
                            "mt-0.5 truncate rounded px-1 py-0.5 text-[10px] font-semibold leading-tight",
                            src.cls
                          )}
                          title={`${src.label}: ${bk.label}`}
                        >
                          {bk.isStart ? bk.label : "·"}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy/60">
            {Object.entries(SOURCE_STYLE).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-sm", v.cls.split(" ")[0])} />
                {v.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Затворено</span>
            <span className="flex items-center gap-1.5"><Tag className="h-3 w-3 text-gold-deep" /> Персонализирана цена</span>
          </div>
        </div>

        {/* Side panel */}
        <div className="h-fit rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-bold text-navy">Редакция на дати</h2>
          {!selStart ? (
            <p className="text-sm text-navy/60">
              Кликнете върху ден, за да го изберете. Кликнете втори ден, за да изберете период.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gold-deep">
                {selStart}
                {selEnd && selEnd !== selStart ? ` → ${selEnd}` : ""}
              </p>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-navy/60">
                  Цена на нощ (€)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder={`Базова: €${apt?.basePriceEur ?? ""}`}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
                <p className="mt-1 text-xs text-navy/50">Празно = автоматична цена</p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-navy">
                <input
                  type="checkbox"
                  checked={form.closed}
                  onChange={(e) => setForm((f) => ({ ...f, closed: e.target.checked }))}
                  className="h-4 w-4 accent-[#0d1f35]"
                />
                Затвори за резервации
              </label>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-navy/60">
                  Мин. нощувки
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder={`По подразбиране: ${apt?.minStayNights ?? 1}`}
                  value={form.minNights}
                  onChange={(e) => setForm((f) => ({ ...f, minNights: e.target.value }))}
                  className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => save(false)}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-navy hover:bg-gold-pale disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Запази
                </button>
                <button
                  onClick={() => save(true)}
                  disabled={saving}
                  className="rounded-full border border-navy/20 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5 disabled:opacity-60"
                >
                  Върни автоматичните настройки
                </button>
                <button
                  onClick={() => {
                    setSelStart(null);
                    setSelEnd(null);
                  }}
                  className="text-sm font-medium text-navy/60 hover:text-navy"
                >
                  Отказ
                </button>
              </div>
            </div>
          )}
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
