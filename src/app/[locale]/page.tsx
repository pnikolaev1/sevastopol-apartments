import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { USPSection } from "@/components/home/USPSection";
import { ApartmentsPreview } from "@/components/home/ApartmentsPreview";
import { AboutSection } from "@/components/home/AboutSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { ContactCTA } from "@/components/home/ContactCTA";
import { getListApartments } from "@/lib/db/apartments";

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

  const apartments = (await getListApartments(locale)).slice(0, 3);

  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <ApartmentsPreview apartments={apartments} locale={locale} />
        <USPSection />
        <ReviewsSection />
        <AboutSection />
        <ContactCTA />
      </main>
      <Footer />
    </>
  );
}
