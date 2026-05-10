import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { USPSection } from "@/components/home/USPSection";
import { ApartmentsPreview } from "@/components/home/ApartmentsPreview";
import { LocationSection } from "@/components/home/LocationSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { ContactCTA } from "@/components/home/ContactCTA";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.hero" });

  return {
    title: "Sevastopol Apartments Varna — Direct Booking",
    description: `${t("headline")}. ${t("subheadline")} ${t("directDiscount")}`,
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const apartments = await prisma.apartment.findMany({
    where: { active: true },
    include: {
      translations: { where: { locale } },
      photos: { where: { isPrimary: true }, take: 1 },
      amenities: { include: { amenity: true }, take: 6 },
    },
    take: 3,
  });

  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <USPSection />
        <ApartmentsPreview apartments={apartments} locale={locale} />
        <LocationSection />
        <ReviewsSection />
        <ContactCTA />
      </main>
      <Footer />
    </>
  );
}
