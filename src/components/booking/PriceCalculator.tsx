"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertCircle } from "lucide-react";
import { calculatePrice } from "@/lib/pricing";
import { addDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Apartment, PricingRule } from "@prisma/client";

interface BlockedDate {
  start: Date;
  end: Date;
  source: string;
}

interface Props {
  apartment: Apartment & { pricingRules: PricingRule[] };
  blockedDates: BlockedDate[];
  locale: string;
}

export function PriceCalculator({ apartment: apt, blockedDates }: Props) {
  const t = useTranslations("apartment");
  const router = useRouter();

  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);

  const checkIn = range?.from ? format(range.from, "yyyy-MM-dd") : "";
  const checkOut = range?.to ? format(range.to, "yyyy-MM-dd") : "";

  // Booked/blocked periods, mapped to inclusive day ranges for the calendar.
  // `end` is the checkout day (exclusive) — it stays selectable as a new check-in.
  const disabledDays = useMemo(
    () => [
      { before: new Date() },
      ...blockedDates.map((b) => ({
        from: new Date(b.start),
        to: addDays(new Date(b.end), -1),
      })),
    ],
    [blockedDates]
  );

  function isDateBlocked(dateStr: string): boolean {
    const date = new Date(dateStr);
    return blockedDates.some(
      (b) => date >= new Date(b.start) && date < new Date(b.end)
    );
  }

  const breakdown = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    if (ci >= co) return null;

    return calculatePrice({
      basePriceEur: apt.basePriceEur,
      cleaningFeeEur: apt.cleaningFeeEur,
      weekendUpliftPct: apt.weekendUpliftPct,
      checkIn: ci,
      checkOut: co,
      guestCount: guests,
      pricingRules: apt.pricingRules,
      applyDirectDiscount: true,
    });
  }, [checkIn, checkOut, guests, apt]);

  const isAvailable = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    for (let d = new Date(checkIn); d < new Date(checkOut); d.setDate(d.getDate() + 1)) {
      const ds = d.toISOString().split("T")[0];
      if (ds && isDateBlocked(ds)) return false;
    }
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, blockedDates]);

  function handleBook(type: "instant" | "request") {
    if (!checkIn || !checkOut || !isAvailable) return;
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
      type,
    });
    router.push(`/booking/${apt.slug}?${params.toString()}`);
  }

  return (
    <Card className="shadow-lg border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            €{Number(apt.basePriceEur).toFixed(0)}
          </span>
          <span className="text-base font-normal text-muted-foreground">{t("perNight")}</span>
        </CardTitle>
        <Badge
          variant="secondary"
          className="w-fit text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900"
        >
          {t("directDiscountApplied")}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date range picker — booked dates are greyed out */}
        <div>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border px-3 py-2">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {t("checkIn")}
              </span>
              <span className="text-sm text-foreground">
                {range?.from ? format(range.from, "d MMM yyyy") : "—"}
              </span>
            </div>
            <div className="rounded-lg border border-border px-3 py-2">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {t("checkOut")}
              </span>
              <span className="text-sm text-foreground">
                {range?.to ? format(range.to, "d MMM yyyy") : "—"}
              </span>
            </div>
          </div>
          <div className="flex justify-center rounded-lg border border-border">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              disabled={disabledDays}
              excludeDisabled
              min={Math.max(1, apt.minStayNights)}
              numberOfMonths={1}
              showOutsideDays={false}
            />
          </div>
          {range?.from && (
            <button
              type="button"
              onClick={() => setRange(undefined)}
              className="mt-1.5 text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              {t("clearDates")}
            </button>
          )}
        </div>

        <div>
          <Label htmlFor="calc-guests" className="text-xs font-semibold mb-1 block">
            {t("guestsMax", { count: apt.maxGuests })}
          </Label>
          <Input
            id="calc-guests"
            type="number"
            min={1}
            max={apt.maxGuests}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="text-sm"
          />
        </div>

        {/* Availability indicator */}
        {isAvailable === false && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-md p-3">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden />
            {t("notAvailable")}
          </div>
        )}

        {/* Price breakdown */}
        {breakdown && isAvailable !== false && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("priceBreakdown.nights", { rate: `€${breakdown.nightlyRateEur.toFixed(2)}`, nights: breakdown.nights })}</span>
              <span>€{breakdown.subtotalEur.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t("priceBreakdown.cleaning")}</span>
              <span>€{breakdown.cleaningFeeEur.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t("priceBreakdown.touristTax")}</span>
              <span>€{breakdown.touristTaxEur.toFixed(2)}</span>
            </div>
            {breakdown.directDiscountEur > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>{t("priceBreakdown.directDiscount")}</span>
                <span>−€{breakdown.directDiscountEur.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-foreground">
              <span>{t("priceBreakdown.total")}</span>
              <div className="text-right">
                <div>€{breakdown.totalEur.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground font-normal">
                  {t("priceBreakdown.inBgn", { amount: breakdown.totalBgn.toFixed(2) })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Book buttons */}
        <div className="space-y-2">
          <Button
            className="w-full rounded-full bg-gold font-bold text-navy hover:bg-gold-pale"
            disabled={!checkIn || !checkOut || !isAvailable}
            onClick={() => handleBook("instant")}
          >
            {t("bookAndPay")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={!checkIn || !checkOut}
            onClick={() => handleBook("request")}
          >
            {t("requestBooking")}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" aria-hidden />
          {t("securedNote")}
        </div>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          {t("disclaimer")}
        </p>
      </CardContent>
    </Card>
  );
}
