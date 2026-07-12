import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

interface Props {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export const dynamic = "force-dynamic";

// This page is reachable by anyone holding the booking id (no session). Mask the
// email so a leaked/shared confirmation URL does not expose the full address.
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const shown = local.slice(0, 2);
  return `${shown}${"*".repeat(Math.max(1, local.length - shown.length))}@${domain}`;
}

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const [{ locale, id }, sp] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "booking" });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      guest: true,
      apartment: { include: { translations: { where: { locale } } } },
    },
  });

  if (!booking) notFound();

  // Group checkout: show every apartment booked and paid together.
  const groupBookings = booking.groupId
    ? await prisma.booking.findMany({
        where: { groupId: booking.groupId },
        include: { apartment: { include: { translations: { where: { locale } } } } },
        orderBy: { createdAt: "asc" },
      })
    : null;
  const groupTotal = groupBookings
    ? groupBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)
    : Number(booking.totalAmount);
  const totalGuests = groupBookings
    ? groupBookings.reduce((sum, b) => sum + b.guestCount, 0)
    : booking.guestCount;

  const aptName = booking.apartment.translations[0]?.name ?? booking.apartment.slug;
  const isRequest = sp.type === "request";

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 max-w-xl">
          <Card className="shadow-lg">
            <CardContent className="pt-10 pb-8 text-center space-y-6">
              {isRequest ? (
                <Clock className="w-16 h-16 text-amber-500 mx-auto" aria-hidden />
              ) : (
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" aria-hidden />
              )}

              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {isRequest ? t("requestSent.title") : t("confirmation.title")}
                </h1>
                <p className="text-muted-foreground">
                  {isRequest
                    ? t("requestSent.desc")
                    : t("confirmation.thankYou", { name: booking.guest.firstName })}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-5 text-left space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("confirmation.bookingRef")}</span>
                  <span className="font-mono text-xs font-medium">{booking.id.slice(0, 12)}…</span>
                </div>
                {groupBookings ? (
                  groupBookings.map((b) => (
                    <div key={b.id} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {b.apartment.translations[0]?.name ?? b.apartment.slug}
                      </span>
                      <span className="font-medium">
                        {b.guestCount} · €{Number(b.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Apartment</span>
                    <span className="font-medium">{aptName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("confirmation.checkIn")}</span>
                  <span className="font-medium">{format(booking.checkIn, "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("confirmation.checkOut")}</span>
                  <span className="font-medium">{format(booking.checkOut, "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("confirmation.guests")}</span>
                  <span className="font-medium">{totalGuests}</span>
                </div>
                {!isRequest && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("confirmation.total")}</span>
                    <span className="font-semibold text-foreground">€{groupTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {isRequest && (
                <p className="text-xs text-muted-foreground">{t("requestSent.expire")}</p>
              )}
              {!isRequest && (
                <p className="text-xs text-muted-foreground">
                  {t("confirmation.emailSent", { email: maskEmail(booking.guest.email) })}
                </p>
              )}

              <Link href="/">
                <Button variant="outline" className="w-full">
                  {t("confirmation.backHome")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
