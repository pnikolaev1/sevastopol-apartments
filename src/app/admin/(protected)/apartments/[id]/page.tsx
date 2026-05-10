import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ApartmentEditor from "./_ApartmentEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const apt = await prisma.apartment.findUnique({
    where: { id },
    include: { translations: { where: { locale: "en" } } },
  });
  return { title: apt?.translations[0]?.name ?? "Edit Apartment" };
}

export default async function ApartmentEditorPage({ params }: PageProps) {
  const { id } = await params;

  const apartment = await prisma.apartment.findUnique({
    where: { id },
    include: {
      translations: true,
      amenities: { include: { amenity: true } },
      pricingRules: { orderBy: { type: "asc" } },
    },
  });

  if (!apartment) notFound();

  const allAmenities = await prisma.amenity.findMany({ orderBy: { key: "asc" } });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/apartments" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          {apartment.translations.find((t) => t.locale === "en")?.name ?? apartment.slug}
        </h1>
      </div>

      <ApartmentEditor apartment={apartment} allAmenities={allAmenities} />
    </div>
  );
}
