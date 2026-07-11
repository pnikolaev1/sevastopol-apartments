import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ManualBookingForm from "./_ManualBookingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Нова резервация" };

export default async function NewBookingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const apartments = await prisma.apartment.findMany({
    orderBy: { slug: "asc" },
    select: {
      id: true,
      slug: true,
      maxGuests: true,
      translations: { where: { locale: "bg" }, select: { name: true } },
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/bookings"
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold text-navy">Нова ръчна резервация</h1>
      </div>
      <p className="text-sm text-navy/60">
        За резервации по телефон или WhatsApp — датите се блокират веднага и се
        синхронизират към Booking.com/Airbnb чрез iCal.
      </p>
      <ManualBookingForm
        apartments={apartments.map((a) => ({
          id: a.id,
          name: a.translations[0]?.name ?? a.slug,
          maxGuests: a.maxGuests,
        }))}
      />
    </div>
  );
}
