import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ApartmentPlaceholder } from "./ApartmentPlaceholder";
import { Users, BedDouble, Maximize2, Bath, CalendarX } from "lucide-react";
import type {
  Apartment,
  ApartmentTranslation,
  ApartmentPhoto,
  ApartmentAmenity,
  Amenity,
} from "@prisma/client";

type ApartmentWithRelations = Apartment & {
  translations: ApartmentTranslation[];
  photos: ApartmentPhoto[];
  amenities: (ApartmentAmenity & { amenity: Amenity })[];
};

interface Props {
  apartment: ApartmentWithRelations;
  locale: string;
  isAvailable?: boolean;
}

export async function ApartmentCard({ apartment: apt, locale, isAvailable = true }: Props) {
  const [tApt, tHome, tList, tAmenities] = await Promise.all([
    getTranslations({ locale, namespace: "apartment" }),
    getTranslations({ locale, namespace: "home.apartments" }),
    getTranslations({ locale, namespace: "apartments" }),
    getTranslations({ locale, namespace: "amenities" }),
  ]);
  const amenityLabel = (key: string) =>
    tAmenities.has(key as never) ? tAmenities(key as never) : key.replace(/_/g, " ");

  const translation = apt.translations[0];
  const photo = apt.photos[0];
  const price = Number(apt.basePriceEur);

  return (
    <div className={isAvailable ? "" : "opacity-60"}>
      <Link href={`/apartments/${apt.slug}`}>
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col">
          <div className="relative h-56 bg-muted overflow-hidden">
            {photo ? (
              <Image
                src={photo.url}
                alt={translation?.name ?? apt.slug}
                fill
                className={`object-cover transition-transform duration-500 ${isAvailable ? "group-hover:scale-105" : ""}`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <ApartmentPlaceholder />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            {isAvailable ? (
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-white/95 text-gray-900 font-semibold shadow-sm">
                  {tHome("from")} €{price.toFixed(0)}{tHome("perNight")}
                </Badge>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="bg-white/90 rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                  <CalendarX className="w-4 h-4 text-destructive" aria-hidden />
                  {tList("unavailable")}
                </div>
              </div>
            )}
          </div>

          <CardContent className="p-5 flex-1 flex flex-col">
            <h2
              className="font-bold text-foreground text-xl mb-2"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              {translation?.name ?? apt.slug}
            </h2>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
              {translation?.shortDesc}
            </p>

            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" aria-hidden />
                {tApt("sleeps", { count: apt.maxGuests })}
              </span>
              <span className="flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-primary" aria-hidden />
                {tApt("bedrooms", { count: apt.bedrooms })}
              </span>
              <span className="flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-primary" aria-hidden />
                {tApt("bathrooms", { count: apt.bathrooms })}
              </span>
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-primary" aria-hidden />
                {tApt("sqm", { count: apt.sqm })}
              </span>
            </div>

            {apt.amenities.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {apt.amenities.slice(0, 4).map(({ amenity }) => (
                  <Badge key={amenity.id} variant="secondary" className="text-xs capitalize">
                    {amenityLabel(amenity.key)}
                  </Badge>
                ))}
                {apt.amenities.length > 4 && (
                  <Badge variant="secondary" className="text-xs text-muted-foreground">
                    {tHome("moreAmenities", { count: apt.amenities.length - 4 })}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
