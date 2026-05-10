import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ApartmentCard } from "@/components/apartments/ApartmentCard";
import { AvailabilityFilter } from "@/components/apartments/AvailabilityFilter";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "apartments" });
  return { title: t("title") };
}

export default async function ApartmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);

  const apartments = await prisma.apartment.findMany({
    where: { active: true },
    include: {
      translations: { where: { locale } },
      photos: { where: { isPrimary: true }, take: 1 },
      amenities: { include: { amenity: true }, take: 6 },
    },
  });

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background">
        <div className="bg-primary/5 border-b border-border py-10">
          <div className="container mx-auto px-4 max-w-7xl">
            <h1 className="text-3xl font-bold text-foreground mb-6">
              {(await getTranslations({ locale, namespace: "apartments" }))("title")}
            </h1>
            <AvailabilityFilter
              defaultCheckIn={sp.checkIn}
              defaultCheckOut={sp.checkOut}
              defaultGuests={sp.guests}
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apartments.map((apt) => (
              <ApartmentCard key={apt.id} apartment={apt} locale={locale} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
