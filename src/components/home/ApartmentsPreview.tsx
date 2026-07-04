import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ApartmentPlaceholder } from "@/components/apartments/ApartmentPlaceholder";
import { Users, BedDouble, Maximize2, ArrowRight } from "lucide-react";
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

export function ApartmentsPreview({ apartments }: Props) {
  const t = useTranslations("home.apartments");

  return (
    <section id="apartments" className="py-24 bg-secondary/30" aria-labelledby="apartments-heading">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
          <div>
            <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-3">
              {t("stayWith")}
            </p>
            <h2
              id="apartments-heading"
              className="text-3xl md:text-4xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              {t("title")}
            </h2>
          </div>
          <Link href="/apartments">
            <Button variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary hover:text-white transition-colors">
              {t("viewAll")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {apartments.map((apt) => {
            const translation = apt.translations[0];
            const photo = apt.photos[0];
            const price = Number(apt.basePriceEur);

            return (
              <Link key={apt.id} href={`/apartments/${apt.slug}`}>
                <article className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50 h-full flex flex-col">
                  <div className="relative h-60 bg-muted overflow-hidden">
                    {photo ? (
                      <Image
                        src={photo.url}
                        alt={translation?.name ?? "Apartment"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <ApartmentPlaceholder />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <Badge className="absolute top-4 left-4 bg-white/95 text-foreground font-semibold shadow-sm text-sm px-3 py-1">
                      {t("from")} €{price.toFixed(0)}
                      <span className="text-muted-foreground font-normal ml-1 text-xs">{t("perNight")}</span>
                    </Badge>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-foreground text-xl mb-2 group-hover:text-primary transition-colors" style={{ fontFamily: "var(--font-display, serif)" }}>
                      {translation?.name ?? apt.slug}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-5 line-clamp-2 leading-relaxed flex-1">
                      {translation?.shortDesc}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border/50">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary/60" aria-hidden />
                        {t("guests", { count: apt.maxGuests })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4 text-primary/60" aria-hidden />
                        {t("bedrooms", { count: apt.bedrooms })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Maximize2 className="w-4 h-4 text-primary/60" aria-hidden />
                        {t("sqm", { count: apt.sqm })}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}

          {apartments.length === 0 && (
            <div className="lg:col-span-3 text-center py-20 text-muted-foreground">
              <span className="text-5xl mb-4 block">🏠</span>
              <p>Apartments loading soon...</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
