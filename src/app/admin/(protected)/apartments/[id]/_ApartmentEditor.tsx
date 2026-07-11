"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import PhotoManager, { type PhotoRow } from "./_PhotoManager";
import PromotionsManager, { type RuleRow } from "./_PromotionsManager";

interface Translation {
  id: string;
  locale: string;
  name: string;
  shortDesc: string;
  description: string;
}

interface Amenity {
  id: string;
  key: string;
  icon: string;
}

interface ApartmentAmenity {
  amenityId: string;
  amenity: Amenity;
}

interface PricingRule {
  id: string;
  type: string;
  name: string;
  active: boolean;
  startDate: Date | null;
  endDate: Date | null;
  multiplier: number | string | { valueOf(): string } | null;
  minNights: number | null;
  discountPct: number | null;
}

interface ApartmentData {
  id: string;
  slug: string;
  active: boolean;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  floor: number;
  basePriceEur: number | string | { valueOf(): string };
  weekendUpliftPct: number;
  cleaningFeeEur: number | string | { valueOf(): string };
  minStayNights: number;
  bookingIcalUrl: string | null;
  airbnbIcalUrl: string | null;
  translations: Translation[];
  amenities: ApartmentAmenity[];
  pricingRules: PricingRule[];
}

interface Props {
  apartment: ApartmentData;
  allAmenities: Amenity[];
  photos: PhotoRow[];
}

type TabId = "general" | "translations" | "amenities" | "photos" | "pricing" | "ical";

export default function ApartmentEditor({ apartment, allAmenities, photos }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // General fields
  const [general, setGeneral] = useState({
    active: apartment.active,
    maxGuests: apartment.maxGuests,
    bedrooms: apartment.bedrooms,
    bathrooms: apartment.bathrooms,
    sqm: apartment.sqm,
    floor: apartment.floor,
    basePriceEur: Number(apartment.basePriceEur),
    weekendUpliftPct: apartment.weekendUpliftPct,
    cleaningFeeEur: Number(apartment.cleaningFeeEur),
    minStayNights: apartment.minStayNights,
  });

  // Translations
  const [translations, setTranslations] = useState<Partial<Record<"bg" | "en" | "ro" | "de", { name: string; shortDesc: string; description: string }>>>(
    Object.fromEntries(
      apartment.translations.map((t) => [t.locale, { name: t.name, shortDesc: t.shortDesc, description: t.description }])
    )
  );

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(
    new Set(apartment.amenities.map((a) => a.amenityId))
  );

  // iCal
  const [ical, setIcal] = useState({
    bookingIcalUrl: apartment.bookingIcalUrl ?? "",
    airbnbIcalUrl: apartment.airbnbIcalUrl ?? "",
  });

  function toggleAmenity(id: string) {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function save() {
    setError("");
    setSuccess("");
    startTransition(async () => {
      // Locales the owner hasn't filled in yet are omitted rather than sent
      // as empty strings (which would fail validation).
      const filledTranslations = Object.fromEntries(
        Object.entries(translations).filter(
          ([, t]) => t.name.trim() && t.shortDesc.trim() && t.description.trim()
        )
      );
      const res = await fetch(`/api/admin/apartments/${apartment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general,
          translations: filledTranslations,
          amenities: Array.from(selectedAmenities),
          ical,
        }),
      });
      if (res.ok) {
        setSuccess("Записано успешно");
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Грешка при запис");
      }
    });
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "general", label: "Основни" },
    { id: "translations", label: "Описания" },
    { id: "amenities", label: "Удобства" },
    { id: "photos", label: "Снимки" },
    { id: "pricing", label: "Промоции" },
    { id: "ical", label: "iCal синхронизация" },
  ];

  return (
    <div className="space-y-5">
      {/* Tab nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* General */}
      {activeTab === "general" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <input
              id="active"
              type="checkbox"
              checked={general.active}
              onChange={(e) => setGeneral((p) => ({ ...p, active: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">Апартаментът е активен (вижда се на сайта)</label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(["maxGuests", "bedrooms", "bathrooms", "sqm", "floor", "minStayNights", "weekendUpliftPct"] as const).map((field) => (
              <Field key={field} label={fieldLabels[field] ?? field} type="number">
                <input
                  type="number"
                  min={0}
                  value={general[field]}
                  onChange={(e) => setGeneral((p) => ({ ...p, [field]: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </Field>
            ))}
            <Field label="Базова цена (€/нощ)" type="number">
              <input
                type="number"
                step="0.01"
                min={0}
                value={general.basePriceEur}
                onChange={(e) => setGeneral((p) => ({ ...p, basePriceEur: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </Field>
            <Field label="Такса почистване (€)" type="number">
              <input
                type="number"
                step="0.01"
                min={0}
                value={general.cleaningFeeEur}
                onChange={(e) => setGeneral((p) => ({ ...p, cleaningFeeEur: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </Field>
          </div>
        </div>
      )}

      {/* Translations */}
      {activeTab === "translations" && (
        <div className="space-y-4">
          {(["bg", "en", "ro", "de"] as const).map((locale) => {
            const t = translations[locale] ?? { name: "", shortDesc: "", description: "" };
            const flag = { bg: "🇧🇬", en: "🇬🇧", ro: "🇷🇴", de: "🇩🇪" }[locale];
            return (
              <div key={locale} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">{flag} {locale.toUpperCase()}</h3>
                <Field label="Име">
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => setTranslations((p) => ({ ...p, [locale]: { ...(p[locale] ?? { name: "", shortDesc: "", description: "" }), name: e.target.value } }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </Field>
                <Field label="Кратко описание">
                  <input
                    type="text"
                    value={t.shortDesc}
                    onChange={(e) => setTranslations((p) => ({ ...p, [locale]: { ...(p[locale] ?? { name: "", shortDesc: "", description: "" }), shortDesc: e.target.value } }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </Field>
                <Field label="Пълно описание">
                  <textarea
                    rows={8}
                    value={t.description}
                    onChange={(e) => setTranslations((p) => ({ ...p, [locale]: { ...(p[locale] ?? { name: "", shortDesc: "", description: "" }), description: e.target.value } }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y"
                  />
                </Field>
              </div>
            );
          })}
        </div>
      )}

      {/* Amenities */}
      {activeTab === "amenities" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allAmenities.map((amenity) => (
              <label key={amenity.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAmenities.has(amenity.id)}
                  onChange={() => toggleAmenity(amenity.id)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 capitalize">{amenity.key.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Photos */}
      {activeTab === "photos" && (
        <PhotoManager apartmentId={apartment.id} initialPhotos={photos} />
      )}

      {/* Promotions & pricing rules */}
      {activeTab === "pricing" && (
        <PromotionsManager
          apartmentId={apartment.id}
          initialRules={apartment.pricingRules.map(
            (r): RuleRow => ({
              id: r.id,
              type: r.type as RuleRow["type"],
              name: r.name,
              active: r.active,
              startDate: r.startDate ? new Date(r.startDate).toISOString() : null,
              endDate: r.endDate ? new Date(r.endDate).toISOString() : null,
              multiplier: r.multiplier !== null ? Number(r.multiplier) : null,
              minNights: r.minNights,
              discountPct: r.discountPct,
              daysBeforeCheckIn:
                (r as { daysBeforeCheckIn?: number | null }).daysBeforeCheckIn ?? null,
            })
          )}
        />
      )}

      {/* iCal */}
      {activeTab === "ical" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Поставете iCal адреса от Booking.com и/или Airbnb за автоматична синхронизация на заетостта на всеки 15 минути.
          </p>
          <Field label="Booking.com iCal URL">
            <input
              type="url"
              placeholder="https://ical.booking.com/…"
              value={ical.bookingIcalUrl}
              onChange={(e) => setIcal((p) => ({ ...p, bookingIcalUrl: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </Field>
          <Field label="Airbnb iCal URL">
            <input
              type="url"
              placeholder="https://www.airbnb.com/calendar/ical/…"
              value={ical.airbnbIcalUrl}
              onChange={(e) => setIcal((p) => ({ ...p, airbnbIcalUrl: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </Field>
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
            <strong>Вашият изходящ iCal адрес:</strong><br />
            <code className="text-xs break-all">{process.env.NEXT_PUBLIC_APP_URL}/api/ical/{apartment.id}</code><br />
            <span className="text-xs">Добавете този адрес в Booking.com / Airbnb, за да блокира датите от директни резервации.</span>
          </div>
        </div>
      )}

      {/* Save bar */}
      {activeTab !== "pricing" && activeTab !== "photos" && (
        <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4">
          <button
            onClick={save}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Запази промените
          </button>
          {success && <p className="text-sm text-green-600">{success}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

function Field({ label, children, type }: { label: string; children: React.ReactNode; type?: string }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

const fieldLabels: Record<string, string> = {
  maxGuests: "Макс. гости",
  bedrooms: "Спални",
  bathrooms: "Бани",
  sqm: "Площ (м²)",
  floor: "Етаж",
  minStayNights: "Мин. престой (нощувки)",
  weekendUpliftPct: "Надценка уикенд (%)",
};
