import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ApartmentCard } from "@/components/apartments/ApartmentCard";
import { AvailabilityFilter } from "@/components/apartments/AvailabilityFilter";
import { getListApartments } from "@/lib/db/apartments";
import { checkAvailability } from "@/lib/availability";
import { Users } from "lucide-react";

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
  const t = await getTranslations({ locale, namespace: "apartments" });

  const checkIn = sp.checkIn ? new Date(sp.checkIn) : null;
  const checkOut = sp.checkOut ? new Date(sp.checkOut) : null;
  const guestCount = sp.guests ? parseInt(sp.guests, 10) : 0;

  const apartments = await getListApartments(locale);

  // Check availability when dates are provided
  const apartmentsWithAvailability = await Promise.all(
    apartments.map(async (apt) => {
      if (!checkIn || !checkOut) return { ...apt, isAvailable: true };
      const { available } = await checkAvailability(apt.id, checkIn, checkOut);
      return { ...apt, isAvailable: available };
    })
  );

  // Sort: available first, unavailable at the bottom
  const sorted = [
    ...apartmentsWithAvailability.filter((a) => a.isAvailable),
    ...apartmentsWithAvailability.filter((a) => !a.isAvailable),
  ];

  // Group suggestion: shown when guest count exceeds every single apartment's capacity
  const maxSingleCapacity = apartments.reduce((m, a) => Math.max(m, a.maxGuests), 0);
  const showGroupSuggestion = guestCount > 0 && guestCount > maxSingleCapacity && apartments.length > 1;
  const availableCount = apartmentsWithAvailability.filter((a) => a.isAvailable).length;

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background">
        {/* Header + filter */}
        <div className="border-b border-white/10 bg-navy py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.015em] text-white mb-8">
              {t("title")}
            </h1>
            <AvailabilityFilter
              defaultCheckIn={sp.checkIn}
              defaultCheckOut={sp.checkOut}
              defaultGuests={sp.guests}
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-7xl space-y-8">
          {/* Group suggestion banner */}
          {showGroupSuggestion && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-6 py-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-5 h-5 text-primary" aria-hidden />
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {checkIn && checkOut
                  ? t("groupSuggestion", { count: guestCount })
                  : t("groupSuggestionNoDates", { count: guestCount })}
              </p>
            </div>
          )}

          {/* Results count when filtering */}
          {(checkIn || checkOut || guestCount > 0) && (
            <p className="text-sm text-muted-foreground">
              {t("resultsCount", { available: availableCount, total: apartments.length })}
            </p>
          )}

          {/* Apartment grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sorted.map((apt) => (
              <ApartmentCard
                key={apt.id}
                apartment={apt}
                locale={locale}
                isAvailable={apt.isAvailable}
              />
            ))}
            {apartments.length === 0 && (
              <div className="lg:col-span-3 text-center py-20 text-muted-foreground">
                <span className="text-5xl mb-4 block">🌊</span>
                <p>{t("noResults")}</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
