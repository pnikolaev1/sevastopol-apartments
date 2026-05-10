import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Users, BedDouble, Maximize2 } from "lucide-react";
import type { Apartment, ApartmentTranslation, ApartmentPhoto, ApartmentAmenity, Amenity } from "@prisma/client";

type ApartmentWithRelations = Apartment & {
  translations: ApartmentTranslation[];
  photos: ApartmentPhoto[];
  amenities: (ApartmentAmenity & { amenity: Amenity })[];
};

interface Props {
  apartments: ApartmentWithRelations[];
  locale: string;
}

export function ApartmentsPreview({ apartments, locale }: Props) {
  const t = useTranslations("home.apartments");

  return (
    <section id="apartments" className="py-20 bg-background" aria-labelledby="apartments-heading">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-end justify-between mb-10">
          <h2 id="apartments-heading" className="text-3xl font-bold text-foreground">
            {t("title")}
          </h2>
          <Link href="/apartments">
            <Button variant="outline">{t("viewAll")}</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apartments.map((apt) => {
            const translation = apt.translations[0];
            const photo = apt.photos[0];
            const price = Number(apt.basePriceEur);

            return (
              <Link key={apt.id} href={`/apartments/${apt.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer h-full">
                  <div className="relative h-52 bg-muted overflow-hidden">
                    {photo ? (
                      <Image
                        src={photo.url}
                        alt={translation?.name ?? "Apartment"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/30">
                        <span className="text-primary/60 text-4xl">🏠</span>
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-white/90 text-foreground">
                      {t("from")} €{price.toFixed(0)}
                      <span className="text-muted-foreground ml-1">{t("perNight")}</span>
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground text-lg mb-1">
                      {translation?.name ?? apt.slug}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {translation?.shortDesc}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" aria-hidden />
                        {t("guests", { count: apt.maxGuests })}
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-4 h-4" aria-hidden />
                        {t("bedrooms", { count: apt.bedrooms })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize2 className="w-4 h-4" aria-hidden />
                        {t("sqm", { count: apt.sqm })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
