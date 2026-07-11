import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import RateCalendar from "./_RateCalendar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Календар и цени" };

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const apartments = await prisma.apartment.findMany({
    orderBy: { slug: "asc" },
    select: {
      id: true,
      slug: true,
      basePriceEur: true,
      weekendUpliftPct: true,
      minStayNights: true,
      translations: { where: { locale: "bg" }, select: { name: true } },
      pricingRules: {
        where: { active: true, type: "SEASONAL" },
        select: { startDate: true, endDate: true, multiplier: true },
      },
    },
  });

  return (
    <RateCalendar
      apartments={apartments.map((a) => ({
        id: a.id,
        name: a.translations[0]?.name ?? a.slug,
        basePriceEur: Number(a.basePriceEur),
        weekendUpliftPct: a.weekendUpliftPct,
        minStayNights: a.minStayNights,
        seasonalRules: a.pricingRules.map((r) => ({
          startDate: r.startDate?.toISOString() ?? null,
          endDate: r.endDate?.toISOString() ?? null,
          multiplier: r.multiplier ? Number(r.multiplier) : null,
        })),
      }))}
    />
  );
}
