import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { ApartmentPlaceholder } from "@/components/apartments/ApartmentPlaceholder";
import { ArrowRight } from "lucide-react";
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
  const tAmenities = useTranslations("amenities");
  const amenityLabel = (key: string) =>
    tAmenities.has(key as never) ? tAmenities(key as never) : key.replace(/_/g, " ");

  return (
    <section id="apartments" className="bg-background px-6 pb-2 pt-16" aria-labelledby="apartments-heading">
      <div className="mx-auto max-w-[1160px]">
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-3">
          <h2
            id="apartments-heading"
            className="text-[clamp(24px,3vw,30px)] font-bold leading-tight tracking-[-0.01em] text-foreground"
          >
            {t("title")}
          </h2>
          <Link
            href="/apartments"
            className="flex items-center gap-1.5 text-sm font-semibold text-gold-link transition-colors hover:text-gold-deep dark:text-gold dark:hover:text-gold-pale"
          >
            {t("viewAll")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 min-[880px]:grid-cols-3">
          {apartments.map((apt) => {
            const translation = apt.translations[0];
            const photo = apt.photos[0];
            const price = Number(apt.basePriceEur);
            const shownAmenities = apt.amenities.slice(0, 3);
            const moreCount = apt.amenities.length - shownAmenities.length;
            const metaLine = [
              t("guests", { count: apt.maxGuests }),
              t("bedrooms", { count: apt.bedrooms }),
              t("sqm", { count: apt.sqm }),
            ].join(" · ");

            return (
              <Link key={apt.id} href={`/apartments/${apt.slug}`} className="group">
                <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-navy/8 bg-card shadow-[0_1px_3px_rgba(13,31,53,0.06)] transition-all duration-200 ease-out group-hover:-translate-y-[3px] group-hover:shadow-[0_14px_30px_rgba(13,31,53,0.16)] dark:border-border">
                  <div className="relative h-[210px] overflow-hidden bg-muted">
                    {photo ? (
                      <Image
                        src={photo.url}
                        alt={translation?.name ?? "Apartment"}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 880px) 100vw, 33vw"
                      />
                    ) : (
                      <ApartmentPlaceholder />
                    )}
                    <span className="absolute bottom-3 left-3 rounded-full bg-navy px-[13px] py-2 text-[13px] font-bold leading-none text-white shadow-[0_2px_8px_rgba(13,31,53,0.25)] dark:border dark:border-white/15">
                      {t("from")} €{price.toFixed(0)} {t("perNight")}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col px-5 pb-5 pt-[18px]">
                    <h3 className="mb-1 text-[17px] font-bold leading-snug text-foreground">
                      {translation?.name ?? apt.slug}
                    </h3>
                    <p className="mb-3.5 text-[13.5px] leading-normal text-muted-foreground">
                      {metaLine}
                    </p>

                    {shownAmenities.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {shownAmenities.map(({ amenity }) => (
                          <span
                            key={amenity.id}
                            className="rounded-full bg-gold/14 px-[11px] py-1.5 text-[11.5px] font-medium capitalize leading-none text-gold-deep dark:bg-gold/20 dark:text-gold-pale"
                          >
                            {amenityLabel(amenity.key)}
                          </span>
                        ))}
                        {moreCount > 0 && (
                          <span className="rounded-full bg-gold/15 px-[11px] py-1.5 text-[11.5px] font-medium leading-none text-gold-link dark:bg-gold/20 dark:text-gold-pale">
                            {t("moreAmenities", { count: moreCount })}
                          </span>
                        )}
                      </div>
                    )}

                    <span className="mt-auto block rounded-full bg-navy py-3 text-center text-sm font-semibold leading-none text-white transition-colors group-hover:bg-navy-hover dark:bg-gold dark:text-navy dark:group-hover:bg-gold-pale">
                      {t("viewApartment")}
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}

          {apartments.length === 0 && (
            <div className="py-20 text-center text-muted-foreground min-[880px]:col-span-3">
              <span className="mb-4 block text-5xl">🏠</span>
              <p>Apartments loading soon...</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
