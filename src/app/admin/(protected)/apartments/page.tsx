import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Pencil, Eye } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Apartments" };

export default async function ApartmentsPage() {
  const apartments = await prisma.apartment.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      translations: { where: { locale: "en" } },
      _count: { select: { bookings: true, photos: true } },
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-gray-900">Apartments</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {apartments.map((apt) => {
          const trans = apt.translations[0];
          return (
            <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-medium text-gray-900">{trans?.name ?? apt.slug}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{apt.slug}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${apt.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {apt.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Guests" value={apt.maxGuests} />
                <Stat label="Beds" value={apt.bedrooms} />
                <Stat label="m²" value={apt.sqm} />
              </div>

              <div className="text-sm text-gray-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Base price</span>
                  <span className="font-medium">€{Number(apt.basePriceEur)}/night</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bookings</span>
                  <span>{apt._count.bookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Photos</span>
                  <span>{apt._count.photos}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Link
                  href={`/admin/apartments/${apt.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
                <Link
                  href={`/apartments/${apt.slug}`}
                  target="_blank"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2">
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
