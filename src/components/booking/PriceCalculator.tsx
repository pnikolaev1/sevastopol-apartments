"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertCircle } from "lucide-react";
import { calculatePrice } from "@/lib/pricing";
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

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const today = new Date().toISOString().split("T")[0] ?? "";

  function isDateBlocked(dateStr: string): boolean {
    const date = new Date(dateStr);
    return blockedDates.some(
      (b) => date >= b.start && date < b.end
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
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground">
            €{Number(apt.basePriceEur).toFixed(0)}
          </span>
          <span className="text-base font-normal text-muted-foreground">{t("perNight" as never)}/night</span>
        </CardTitle>
        <Badge variant="secondary" className="w-fit text-emerald-700 bg-emerald-50 border-emerald-200">
          10% direct discount applied
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="calc-checkin" className="text-xs font-semibold mb-1 block">
              {t("priceBreakdown.nightly" as never)}
            </Label>
            <Input
              id="calc-checkin"
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => setCheckIn(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="calc-checkout" className="text-xs font-semibold mb-1 block">
              Check-out
            </Label>
            <Input
              id="calc-checkout"
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => setCheckOut(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="calc-guests" className="text-xs font-semibold mb-1 block">
            Guests (max {apt.maxGuests})
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
            These dates are not available.
          </div>
        )}

        {/* Price breakdown */}
        {breakdown && isAvailable !== false && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>€{breakdown.nightlyRateEur.toFixed(2)} × {breakdown.nights} nights</span>
              <span>€{breakdown.subtotalEur.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Cleaning fee</span>
              <span>€{breakdown.cleaningFeeEur.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tourist tax</span>
              <span>€{breakdown.touristTaxEur.toFixed(2)}</span>
            </div>
            {breakdown.directDiscountEur > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Direct discount (10%)</span>
                <span>−€{breakdown.directDiscountEur.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-foreground">
              <span>Total</span>
              <div className="text-right">
                <div>€{breakdown.totalEur.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground font-normal">
                  ≈ {breakdown.totalBgn.toFixed(2)} BGN
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Book buttons */}
        <div className="space-y-2">
          <Button
            className="w-full bg-primary hover:bg-primary/90 font-semibold"
            disabled={!checkIn || !checkOut || !isAvailable}
            onClick={() => handleBook("instant")}
          >
            Book Now & Pay
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={!checkIn || !checkOut}
            onClick={() => handleBook("request")}
          >
            Request Booking
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" aria-hidden />
          Secured by Stripe · 3D Secure enabled
        </div>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          {t("disclaimer")}
        </p>
      </CardContent>
    </Card>
  );
}
