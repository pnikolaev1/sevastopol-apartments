import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Users, BedDouble, Maximize2, Bath } from "lucide-react";
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
}

export function ApartmentCard({ apartment: apt, locale }: Props) {
  const translation = apt.translations[0];
  const photo = apt.photos[0];
  const price = Number(apt.basePriceEur);

  return (
    <Link href={`/apartments/${apt.slug}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col">
        <div className="relative h-56 bg-muted overflow-hidden">
          {photo ? (
            <Image
              src={photo.url}
              alt={translation?.name ?? apt.slug}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/30">
              <span className="text-5xl">🏠</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-white/95 text-foreground font-semibold shadow-sm">
              From €{price.toFixed(0)}/night
            </Badge>
          </div>
        </div>

        <CardContent className="p-5 flex-1 flex flex-col">
          <h2 className="font-bold text-foreground text-xl mb-2">
            {translation?.name ?? apt.slug}
          </h2>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
            {translation?.shortDesc}
          </p>

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" aria-hidden />
              Up to {apt.maxGuests} guests
            </span>
            <span className="flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-primary" aria-hidden />
              {apt.bedrooms} bedroom{apt.bedrooms !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-primary" aria-hidden />
              {apt.bathrooms} bathroom{apt.bathrooms !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-primary" aria-hidden />
              {apt.sqm} m²
            </span>
          </div>

          {apt.amenities.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {apt.amenities.slice(0, 4).map(({ amenity }) => (
                <Badge key={amenity.id} variant="secondary" className="text-xs">
                  {amenity.key.replace(/_/g, " ")}
                </Badge>
              ))}
              {apt.amenities.length > 4 && (
                <Badge variant="secondary" className="text-xs text-muted-foreground">
                  +{apt.amenities.length - 4} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
