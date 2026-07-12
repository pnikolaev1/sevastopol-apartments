import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/db/prisma";
import { checkAvailability } from "@/lib/availability";
import { calculatePrice } from "@/lib/pricing";
import { allocateGuests } from "@/lib/group-booking";
import { GroupBookingForm } from "@/components/booking/GroupBookingForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ apts?: string; checkIn?: string; checkOut?: string; guests?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking.group" });
  return { title: t("title") };
}

export default async function GroupBookingPage({ params, searchParams }: Props) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);

  const slugs = (sp.apts ?? "").split(",").filter(Boolean);
  const guests = Number(sp.guests ?? 0);
  const { checkIn: checkInStr, checkOut: checkOutStr } = sp;

  if (slugs.length < 2 || slugs.length > 3 || !checkInStr || !checkOutStr || !guests) {
    redirect("/apartments");
  }

  const checkIn = new Date(`${checkInStr}T00:00:00.000Z`);
  const checkOut = new Date(`${checkOutStr}T00:00:00.000Z`);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    redirect("/apartments");
  }

  const apartments = await prisma.apartment.findMany({
    where: { slug: { in: slugs }, active: true },
    include: {
      translations: { where: { locale } },
      pricingRules: { where: { active: true } },
      dateOverrides: { where: { priceEur: { not: null } } },
    },
  });
  if (apartments.length !== slugs.length) notFound();
  apartments.sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));

  const allocation = allocateGuests(guests, apartments);
  if (!allocation) redirect(`/apartments?checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=${guests}`);

  // Availability pre-check for a friendly early exit (the group API re-checks
  // atomically under locks before creating anything).
  for (const apt of apartments) {
    const availability = await checkAvailability(apt.id, checkIn, checkOut);
    if (!availability.available) {
      redirect(`/apartments?checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=${guests}&unavailable=${apt.slug}`);
    }
  }

  const items = apartments.map((apt) => {
    const guestCount = allocation.get(apt.id) ?? 1;
    const pricing = calculatePrice({
      basePriceEur: apt.basePriceEur,
      cleaningFeeEur: apt.cleaningFeeEur,
      weekendUpliftPct: apt.weekendUpliftPct,
      checkIn,
      checkOut,
      guestCount,
      pricingRules: apt.pricingRules,
      dateOverrides: apt.dateOverrides,
      applyDirectDiscount: true,
    });
    return {
      id: apt.id,
      name: apt.translations[0]?.name ?? apt.slug,
      guestCount,
      pricing,
    };
  });

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <GroupBookingForm
            items={items}
            checkIn={checkInStr}
            checkOut={checkOutStr}
            guests={guests}
            locale={locale}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
