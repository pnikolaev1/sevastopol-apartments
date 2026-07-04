import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Users, BedDouble, Bath, Maximize2, Building2,
  Wifi, AirVent, Tv, Utensils, WashingMachine,
  Waves, ParkingSquare, Wind, Coffee,
  Ban, PawPrint, PartyPopper, Cigarette,
  Wand2, Shirt, ArrowUpDown, Droplets,
  Thermometer, ShieldCheck, Laptop, DoorOpen,
  Car, UtensilsCrossed, Sunset, Key,
} from "lucide-react";
import type {
  Apartment,
  ApartmentTranslation,
  ApartmentAmenity,
  Amenity,
  PricingRule,
} from "@prisma/client";

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi,
  air_conditioning: AirVent,
  tv: Tv,
  kitchen: Utensils,
  kitchen_supplies: UtensilsCrossed,
  washing_machine: WashingMachine,
  dryer: WashingMachine,
  sea_view: Waves,
  garden_view: Sunset,
  parking: Car,
  free_parking: Car,
  parking_garage: Car,
  balcony: Wind,
  patio: Wind,
  coffee_maker: Coffee,
  hair_dryer: Wand2,
  iron: Shirt,
  elevator: ArrowUpDown,
  towels: Bath,
  linens: Bath,
  hot_water: Droplets,
  heating: Thermometer,
  smoke_detector: ShieldCheck,
  carbon_monoxide_detector: ShieldCheck,
  workspace: Laptop,
  dedicated_workspace: Laptop,
  private_entrance: DoorOpen,
  keypad: Key,
  self_checkin: Key,
};

type ApartmentWithRelations = Apartment & {
  translations: ApartmentTranslation[];
  amenities: (ApartmentAmenity & { amenity: Amenity })[];
  pricingRules: PricingRule[];
};

interface Props {
  apartment: ApartmentWithRelations;
  translation: ApartmentTranslation | undefined;
  locale: string;
}

export function ApartmentDetails({ apartment: apt, translation }: Props) {
  const t = useTranslations("apartment");
  const tAmenities = useTranslations("amenities");
  const amenityLabel = (key: string) =>
    tAmenities.has(key as never) ? tAmenities(key as never) : key.replace(/_/g, " ");

  const stats = [
    { icon: Users, label: t("sleeps", { count: apt.maxGuests }) },
    { icon: BedDouble, label: t("bedrooms", { count: apt.bedrooms }) },
    { icon: Bath, label: t("bathrooms", { count: apt.bathrooms }) },
    { icon: Maximize2, label: t("sqm", { count: apt.sqm }) },
    { icon: Building2, label: t("floor", { number: apt.floor }) },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Title & stats */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          {translation?.name ?? apt.slug}
        </h1>
        <div className="flex flex-wrap gap-3">
          {stats.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Icon className="w-4 h-4 text-primary" aria-hidden />
              {label}
            </span>
          ))}
        </div>
      </div>

      <Separator />

      {/* Description */}
      {translation?.description && (
        <div>
          <h2 className="text-xl font-semibold mb-3">{t("overview")}</h2>
          <div
            className="prose prose-sm max-w-none text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: translation.description.replace(/\n/g, "<br/>") }}
          />
        </div>
      )}

      <Separator />

      {/* Amenities */}
      {apt.amenities.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">{t("amenities")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {apt.amenities.map(({ amenity }) => {
              const Icon = AMENITY_ICONS[amenity.key] ?? ShieldCheck;
              return (
                <div key={amenity.id} className="flex items-center gap-2 text-sm">
                  <Icon className="w-5 h-5 text-primary shrink-0" aria-hidden />
                  <span className="text-foreground capitalize">{amenityLabel(amenity.key)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Separator />

      {/* House Rules */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("houseRules")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Building2, text: t("houseRulesContent.checkIn") },
            { icon: Building2, text: t("houseRulesContent.checkOut") },
            { icon: Cigarette, text: t("houseRulesContent.noSmoking") },
            { icon: PawPrint, text: t("houseRulesContent.noPets") },
            { icon: PartyPopper, text: t("houseRulesContent.noParties") },
            { icon: Users, text: t("houseRulesContent.maxGuests", { count: apt.maxGuests }) },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Icon className="w-4 h-4 mt-0.5 shrink-0 text-foreground" aria-hidden />
              {text}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Cancellation */}
      <div>
        <h2 className="text-xl font-semibold mb-3">{t("cancellation")}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("cancellationContent")}
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800 leading-relaxed">
          <Ban className="w-4 h-4 inline mr-1.5 align-text-bottom" aria-hidden />
          {t("disclaimer")}
        </p>
      </div>
    </div>
  );
}
