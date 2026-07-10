"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search, Minus, Plus } from "lucide-react";

const MIN_GUESTS = 1;
const MAX_GUESTS = 8;

export function SearchPanel() {
  const tFilter = useTranslations("apartments.filter");
  const tHero = useTranslations("home.hero");
  const router = useRouter();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const guestsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!guestsOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (guestsRef.current && !guestsRef.current.contains(e.target as Node)) {
        setGuestsOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [guestsOpen]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query: Record<string, string> = { guests: String(guests) };
    if (checkIn) query.checkIn = checkIn;
    if (checkOut) query.checkOut = checkOut;
    router.push({ pathname: "/apartments", query });
  }

  const fieldLabel =
    "block text-[10px] font-bold uppercase tracking-[0.06em] text-[#22303B] mb-0.5";

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2.5 rounded-[22px] border border-white/12 bg-white/6 p-3.5"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="min-w-0 flex-1 rounded-[14px] bg-white px-4 py-2.5">
          <label htmlFor="hero-check-in" className={fieldLabel}>
            {tFilter("checkIn")}
          </label>
          <input
            id="hero-check-in"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-[13px] text-[#22303B] outline-none"
          />
        </div>
        <div className="min-w-0 flex-1 rounded-[14px] bg-white px-4 py-2.5">
          <label htmlFor="hero-check-out" className={fieldLabel}>
            {tFilter("checkOut")}
          </label>
          <input
            id="hero-check-out"
            type="date"
            value={checkOut}
            min={checkIn || undefined}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-[13px] text-[#22303B] outline-none"
          />
        </div>
        <div ref={guestsRef} className="relative min-w-0 sm:flex-[0.8]">
          <button
            type="button"
            onClick={() => setGuestsOpen((v) => !v)}
            aria-expanded={guestsOpen}
            aria-haspopup="dialog"
            className="w-full rounded-[14px] bg-white px-4 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            <span className={fieldLabel}>{tFilter("guests")}</span>
            <span className="block text-[13px] text-[#22303B]">
              {tHero("guestsCount", { count: guests })}
            </span>
          </button>
          {guestsOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-[60] flex min-w-[180px] items-center gap-3.5 rounded-2xl border border-navy/6 bg-white px-4 py-3.5 shadow-[0_18px_40px_rgba(5,15,30,0.35)]">
              <span className="flex-1 text-sm font-medium text-[#22303B]">
                {tFilter("guests")}
              </span>
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(MIN_GUESTS, g - 1))}
                disabled={guests <= MIN_GUESTS}
                aria-label="−"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-navy/20 bg-white text-[#22303B] disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span className="min-w-4 text-center text-[15px] font-semibold text-[#22303B]" aria-live="polite">
                {guests}
              </span>
              <button
                type="button"
                onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))}
                disabled={guests >= MAX_GUESTS}
                aria-label="+"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-navy/20 bg-white text-[#22303B] disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-[14px] bg-gold p-3.5 text-sm font-bold leading-none text-navy transition-colors hover:bg-gold-pale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        <Search className="h-4 w-4" strokeWidth={2.4} aria-hidden />
        {tHero("checkAvailability")}
      </button>
    </form>
  );
}
