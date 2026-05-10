import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookingForm } from "@/components/booking/BookingForm";
import { prisma } from "@/lib/db/prisma";
import { calculatePrice } from "@/lib/pricing";
import { checkAvailability } from "@/lib/availability";

interface Props {
  params: Promise<{ locale: string; apartmentSlug: string }>;
  searchParams: Promise<{
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    type?: "instant" | "request";
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking" });
  return { title: t("title") };
}

export default async function BookingPage({ params, searchParams }: Props) {
  const [{ locale, apartmentSlug }, sp] = await Promise.all([params, searchParams]);

  if (!sp.checkIn || !sp.checkOut) {
    notFound();
  }

  const apt = await prisma.apartment.findUnique({
    where: { slug: apartmentSlug, active: true },
    include: {
      translations: { where: { locale } },
      pricingRules: { where: { active: true } },
    },
  });

  if (!apt) notFound();

  const checkIn = new Date(sp.checkIn);
  const checkOut = new Date(sp.checkOut);
  const guests = Number(sp.guests ?? 1);

  // Re-verify availability server-side before showing payment form
  const availability = await checkAvailability(apt.id, checkIn, checkOut);
  if (!availability.available) notFound();

  const pricing = calculatePrice({
    basePriceEur: apt.basePriceEur,
    cleaningFeeEur: apt.cleaningFeeEur,
    weekendUpliftPct: apt.weekendUpliftPct,
    checkIn,
    checkOut,
    guestCount: guests,
    pricingRules: apt.pricingRules,
    applyDirectDiscount: true,
  });

  const translation = apt.translations[0];

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <BookingForm
            apartment={{
              id: apt.id,
              slug: apt.slug,
              name: translation?.name ?? apt.slug,
            }}
            checkIn={sp.checkIn}
            checkOut={sp.checkOut}
            guests={guests}
            pricing={pricing}
            bookingType={sp.type ?? "instant"}
            locale={locale}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
