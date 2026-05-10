"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";

interface Props {
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: string;
}

export function AvailabilityFilter({ defaultCheckIn, defaultCheckOut, defaultGuests }: Props) {
  const t = useTranslations("apartments.filter");
  const router = useRouter();
  const pathname = usePathname();

  const [checkIn, setCheckIn] = useState(defaultCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(defaultCheckOut ?? "");
  const [guests, setGuests] = useState(defaultGuests ?? "");

  const today = new Date().toISOString().split("T")[0] ?? "";

  function handleSearch() {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleClear() {
    setCheckIn("");
    setCheckOut("");
    setGuests("");
    router.push(pathname);
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <Label htmlFor="filter-checkin" className="text-xs font-semibold text-muted-foreground mb-1.5 block">
            {t("checkIn")}
          </Label>
          <Input
            id="filter-checkin"
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="filter-checkout" className="text-xs font-semibold text-muted-foreground mb-1.5 block">
            {t("checkOut")}
          </Label>
          <Input
            id="filter-checkout"
            type="date"
            value={checkOut}
            min={checkIn || today}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="filter-guests" className="text-xs font-semibold text-muted-foreground mb-1.5 block">
            {t("guests")}
          </Label>
          <Input
            id="filter-guests"
            type="number"
            min={1}
            max={8}
            value={guests}
            placeholder="1–8"
            onChange={(e) => setGuests(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Search className="w-4 h-4 mr-2" aria-hidden />
            {t("search")}
          </Button>
          {(checkIn || checkOut || guests) && (
            <Button variant="outline" size="icon" onClick={handleClear} aria-label={t("clear")}>
              <X className="w-4 h-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
