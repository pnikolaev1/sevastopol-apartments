"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

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
}

type TabId = "general" | "translations" | "amenities" | "pricing" | "ical";

export default function ApartmentEditor({ apartment, allAmenities }: Props) {
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
      const res = await fetch(`/api/admin/apartments/${apartment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ general, translations, amenities: Array.from(selectedAmenities), ical }),
      });
      if (res.ok) {
        setSuccess("Saved successfully");
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Save failed");
      }
    });
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "general", label: "General" },
    { id: "translations", label: "Translations" },
    { id: "amenities", label: "Amenities" },
    { id: "pricing", label: "Pricing Rules" },
    { id: "ical", label: "iCal" },
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
            <label htmlFor="active" className="text-sm font-medium text-gray-700">Apartment is active (visible on site)</label>
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
            <Field label="Base price (€/night)" type="number">
              <input
                type="number"
                step="0.01"
                min={0}
                value={general.basePriceEur}
                onChange={(e) => setGeneral((p) => ({ ...p, basePriceEur: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </Field>
            <Field label="Cleaning fee (€)" type="number">
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
                <Field label="Name">
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => setTranslations((p) => ({ ...p, [locale]: { ...(p[locale] ?? { name: "", shortDesc: "", description: "" }), name: e.target.value } }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </Field>
                <Field label="Short description">
                  <input
                    type="text"
                    value={t.shortDesc}
                    onChange={(e) => setTranslations((p) => ({ ...p, [locale]: { ...(p[locale] ?? { name: "", shortDesc: "", description: "" }), shortDesc: e.target.value } }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </Field>
                <Field label="Description">
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

      {/* Pricing rules (read-only display) */}
      {activeTab === "pricing" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-4">Pricing rules are managed via database seed. Contact developer to modify.</p>
          <div className="space-y-2">
            {apartment.pricingRules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm">
                <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${rule.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {rule.type}
                </span>
                <span className="font-medium text-gray-900">{rule.name}</span>
                <span className="text-gray-500 ml-auto">
                  {rule.multiplier ? `×${Number(rule.multiplier).toFixed(2)}` : ""}
                  {rule.discountPct ? `-${rule.discountPct}%` : ""}
                  {rule.minNights ? ` ≥${rule.minNights}n` : ""}
                </span>
              </div>
            ))}
            {apartment.pricingRules.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No pricing rules configured</p>
            )}
          </div>
        </div>
      )}

      {/* iCal */}
      {activeTab === "ical" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Paste the iCal export URL from Booking.com and/or Airbnb to enable automatic availability sync every 15 minutes.
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
            <strong>Your outbound iCal feed URL:</strong><br />
            <code className="text-xs break-all">{process.env.NEXT_PUBLIC_APP_URL}/api/ical/{apartment.id}</code><br />
            <span className="text-xs">Add this URL in Booking.com / Airbnb to block dates from direct bookings.</span>
          </div>
        </div>
      )}

      {/* Save bar */}
      {activeTab !== "pricing" && (
        <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4">
          <button
            onClick={save}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
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
  maxGuests: "Max guests",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  sqm: "Area (m²)",
  floor: "Floor",
  minStayNights: "Min stay (nights)",
  weekendUpliftPct: "Weekend uplift (%)",
};
