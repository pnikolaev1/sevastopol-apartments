import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ApartmentGallery } from "@/components/apartments/ApartmentGallery";
import { ApartmentDetails } from "@/components/apartments/ApartmentDetails";
import { PriceCalculator } from "@/components/booking/PriceCalculator";
import { prisma } from "@/lib/db/prisma";
import { getBlockedDates } from "@/lib/availability";
import { resolvePhotoAlt } from "@/lib/photo-alt";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  const apt = await prisma.apartment.findUnique({
    where: { slug },
    include: { translations: { where: { locale } }, photos: { where: { isPrimary: true }, take: 1 } },
  });

  if (!apt) return { title: "Not Found" };

  const t = apt.translations[0];

  return {
    title: t?.name ?? slug,
    description: t?.shortDesc,
    openGraph: {
      title: t?.name ?? slug,
      description: t?.shortDesc,
      images: apt.photos[0] ? [apt.photos[0].url] : [],
      type: "website",
    },
  };
}

export const dynamic = "force-dynamic";

export default async function ApartmentPage({ params }: Props) {
  const { locale, slug } = await params;

  const apt = await prisma.apartment.findUnique({
    where: { slug, active: true },
    include: {
      translations: { where: { locale } },
      photos: { orderBy: { position: "asc" } },
      amenities: { include: { amenity: true } },
      pricingRules: { where: { active: true } },
      dateOverrides: { where: { priceEur: { not: null } } },
    },
  });

  if (!apt) notFound();

  const translation = apt.translations[0];
  const blockedDates = await getBlockedDates(apt.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Apartment",
    name: translation?.name ?? apt.slug,
    description: translation?.description,
    numberOfRooms: apt.bedrooms,
    occupancy: { "@type": "QuantitativeValue", maxValue: apt.maxGuests },
    floorSize: { "@type": "QuantitativeValue", value: apt.sqm, unitCode: "MTK" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Varna",
      addressCountry: "BG",
    },
    offers: {
      "@type": "Offer",
      price: Number(apt.basePriceEur),
      priceCurrency: "EUR",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main id="main-content">
        <ApartmentGallery
          photos={apt.photos.map((p) => ({ ...p, alt: resolvePhotoAlt(p, locale) }))}
          name={translation?.name ?? slug}
        />
        <div className="container mx-auto px-4 max-w-7xl py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <ApartmentDetails
                apartment={apt}
                translation={translation}
                locale={locale}
              />
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <PriceCalculator
                  apartment={apt}
                  blockedDates={blockedDates}
                  locale={locale}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
