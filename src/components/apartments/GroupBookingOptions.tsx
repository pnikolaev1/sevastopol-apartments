"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Users, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GroupPickerItem {
  slug: string;
  name: string;
  maxGuests: number;
  /** Stay cost excluding tourist tax (which is linear in guests). */
  fixedEur: number;
}

interface Props {
  items: GroupPickerItem[];
  guests: number;
  nights: number;
  checkIn: string;
  checkOut: string;
  /** Tourist tax in EUR per guest for the whole stay. */
  taxPerGuestStayEur: number;
}

function comboTotal(items: GroupPickerItem[], guests: number, taxPerGuestStayEur: number) {
  return Math.round((items.reduce((s, i) => s + i.fixedEur, 0) + guests * taxPerGuestStayEur) * 100) / 100;
}

/**
 * Group-booking picker shown when the party is too large for one apartment:
 * ready-made combinations plus a build-your-own selector; both lead to the
 * combined single-payment checkout at /booking/group.
 */
export function GroupBookingOptions({ items, guests, nights, checkIn, checkOut, taxPerGuestStayEur }: Props) {
  const t = useTranslations("apartments.group");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const combos = useMemo(() => {
    const result: { members: GroupPickerItem[]; capacity: number; total: number }[] = [];
    const n = items.length;
    for (let size = 2; size <= Math.min(3, n); size++) {
      const pick = (start: number, chosen: GroupPickerItem[]) => {
        if (chosen.length === size) {
          const capacity = chosen.reduce((s, i) => s + i.maxGuests, 0);
          if (capacity >= guests && guests >= chosen.length) {
            result.push({ members: [...chosen], capacity, total: comboTotal(chosen, guests, taxPerGuestStayEur) });
          }
          return;
        }
        for (let i = start; i < n; i++) pick(i + 1, [...chosen, items[i]!]);
      };
      pick(0, []);
    }
    return result.sort((a, b) => a.total - b.total).slice(0, 3);
  }, [items, guests, taxPerGuestStayEur]);

  const selectedItems = items.filter((i) => selected.has(i.slug));
  const selectedCapacity = selectedItems.reduce((s, i) => s + i.maxGuests, 0);
  const selectionValid =
    selectedItems.length >= 2 &&
    selectedItems.length <= 3 &&
    selectedCapacity >= guests &&
    guests >= selectedItems.length;

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const bookHref = (slugs: string[]) => ({
    pathname: "/booking/group" as const,
    query: { apts: slugs.join(","), checkIn, checkOut, guests: String(guests) },
  });

  if (combos.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gold/40 bg-gold/5 p-6" aria-labelledby="group-heading">
      <div className="mb-1 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20">
          <Users className="h-5 w-5 text-gold-deep dark:text-gold" aria-hidden />
        </span>
        <h2 id="group-heading" className="text-lg font-bold text-foreground">
          {t("title", { count: guests })}
        </h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">{t("subtitle")}</p>

      {/* Suggested combinations */}
      <div className="grid gap-3 md:grid-cols-3">
        {combos.map((combo) => (
          <div
            key={combo.members.map((m) => m.slug).join("+")}
            className="flex flex-col rounded-xl border border-navy/10 bg-card p-4 dark:border-border"
          >
            <p className="font-bold text-foreground">
              {combo.members.map((m) => m.name).join(" + ")}
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              {t("capacity", { count: combo.capacity })} · {t("nights", { count: nights })}
            </p>
            <p className="mb-4 mt-auto text-xl font-extrabold text-foreground">
              €{combo.total.toFixed(0)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">{t("totalLabel")}</span>
            </p>
            <Link
              href={bookHref(combo.members.map((m) => m.slug))}
              className="flex items-center justify-center gap-1.5 rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-gold-pale"
            >
              {t("bookTogether")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ))}
      </div>

      {/* Build your own */}
      <div className="mt-5 border-t border-gold/30 pt-4">
        <p className="mb-3 text-sm font-semibold text-foreground">{t("customTitle")}</p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const isSelected = selected.has(item.slug);
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => toggle(item.slug)}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors",
                  isSelected
                    ? "border-gold bg-navy text-white"
                    : "border-navy/15 bg-card text-foreground hover:border-gold dark:border-border"
                )}
              >
                {isSelected && <Check className="h-4 w-4 text-gold" aria-hidden />}
                {item.name}
                <span className={cn("text-xs font-normal", isSelected ? "text-white/60" : "text-muted-foreground")}>
                  {t("capacity", { count: item.maxGuests })} · €{item.fixedEur.toFixed(0)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {selectionValid ? (
            <>
              <span className="text-sm text-muted-foreground">
                {t("capacity", { count: selectedCapacity })} ·{" "}
                <strong className="text-foreground">
                  €{comboTotal(selectedItems, guests, taxPerGuestStayEur).toFixed(0)}
                </strong>{" "}
                {t("totalLabel")}
              </span>
              <Link
                href={bookHref(selectedItems.map((i) => i.slug))}
                className="flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-gold-pale"
              >
                {t("bookTogether")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              {selectedItems.length > 0 && selectedCapacity < guests
                ? t("needCapacity", { count: guests })
                : t("customHint")}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
