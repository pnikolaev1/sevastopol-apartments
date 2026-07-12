"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentStep, stripePromise } from "./PaymentStep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, FlaskConical, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { PriceBreakdown } from "@/lib/pricing";

const IS_STRIPE_TEST = process.env.NEXT_PUBLIC_STRIPE_MODE !== "live";

const buildGuestSchema = (agreeTermsMessage: string) =>
  z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().min(7).max(20),
    country: z.string().min(2).max(100),
    specialRequests: z.string().max(500).optional(),
    agreeTerms: z.boolean().refine((v) => v === true, { message: agreeTermsMessage }),
  });

type GuestFormData = z.infer<ReturnType<typeof buildGuestSchema>>;

export interface GroupItem {
  id: string;
  name: string;
  guestCount: number;
  pricing: PriceBreakdown;
}

interface Props {
  items: GroupItem[];
  checkIn: string;
  checkOut: string;
  guests: number;
  locale: string;
}

export function GroupBookingForm({ items, checkIn, checkOut, guests, locale }: Props) {
  const t = useTranslations("booking");
  const tApt = useTranslations("apartment");
  const [step, setStep] = useState<"details" | "payment">("details");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<GuestFormData>({
    resolver: zodResolver(buildGuestSchema(t("form.agreeTermsError"))),
  });

  const totalEur = Math.round(items.reduce((s, i) => s + i.pricing.totalEur, 0) * 100) / 100;
  const totalBgn = Math.round(items.reduce((s, i) => s + i.pricing.totalBgn, 0) * 100) / 100;
  const discountEur = Math.round(items.reduce((s, i) => s + i.pricing.directDiscountEur, 0) * 100) / 100;
  const nights = items[0]?.pricing.nights ?? 0;

  async function onDetailsSubmit(data: GuestFormData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/booking/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentIds: items.map((i) => i.id),
          checkIn,
          checkOut,
          guests,
          guest: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            country: data.country,
            locale,
          },
          specialRequests: data.specialRequests,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? t("errors.generic"));
      }

      const result = (await res.json()) as { bookingId: string; clientSecret?: string };
      setBookingId(result.bookingId);
      setClientSecret(result.clientSecret ?? null);
      setStep("payment");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  const linkCls = "font-medium text-gold-deep underline-offset-2 hover:underline dark:text-gold";

  return (
    <div className="space-y-6">
      {IS_STRIPE_TEST && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div className="text-sm">
            <span className="font-semibold">TEST MODE — NO REAL CHARGES.</span>{" "}
            Use card <span className="font-mono font-semibold">4242 4242 4242 4242</span>, any
            future expiry, any CVC.
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("group.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(checkIn), "MMM d")} – {format(new Date(checkOut), "MMM d, yyyy")} ·{" "}
          {tApt("guests", { count: guests })}
        </p>
      </div>

      <Badge variant="secondary" className="flex w-fit items-center gap-1.5 px-3 py-1 text-sm">
        <Users className="h-3.5 w-3.5" aria-hidden />
        {t("group.badge", { count: items.length })}
      </Badge>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          {step === "details" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("steps.details")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onDetailsSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">{t("form.firstName")}</Label>
                      <Input id="firstName" {...form.register("firstName")} />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{t("form.lastName")}</Label>
                      <Input id="lastName" {...form.register("lastName")} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">{t("form.email")}</Label>
                    <Input id="email" type="email" {...form.register("email")} />
                    {form.formState.errors.email && (
                      <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="phone">{t("form.phone")}</Label>
                      <Input id="phone" type="tel" {...form.register("phone")} />
                    </div>
                    <div>
                      <Label htmlFor="country">{t("form.country")}</Label>
                      <Input id="country" {...form.register("country")} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="specialRequests">{t("form.specialRequests")}</Label>
                    <Textarea id="specialRequests" rows={3} {...form.register("specialRequests")} />
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      id="agreeTerms"
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                      {...form.register("agreeTerms")}
                    />
                    <Label htmlFor="agreeTerms" className="text-sm leading-snug cursor-pointer">
                      {t.rich("form.agreeTermsRich", {
                        terms: (chunks) => (
                          <Link href="/legal/terms" target="_blank" className={linkCls}>{chunks}</Link>
                        ),
                        privacy: (chunks) => (
                          <Link href="/legal/privacy" target="_blank" className={linkCls}>{chunks}</Link>
                        ),
                      })}
                    </Label>
                  </div>
                  {form.formState.errors.agreeTerms && (
                    <p className="text-xs text-destructive">{form.formState.errors.agreeTerms.message}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-gold font-bold text-navy hover:bg-gold-pale"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("processing")}</>
                    ) : (
                      t("form.continuePayment")
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : clientSecret && bookingId ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("steps.payment")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
                  <PaymentStep bookingId={bookingId} locale={locale} />
                </Elements>
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-4">
                  <Shield className="w-3.5 h-3.5" aria-hidden />
                  {t("payment.securedBy")} · {t("payment.threeDSecure")}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Combined price summary */}
        <div className="lg:col-span-2">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-base">{t("priceSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-muted-foreground">
                  <span>
                    {item.name}
                    <span className="block text-xs">{tApt("guests", { count: item.guestCount })} · {tApt("nights", { count: nights })}</span>
                  </span>
                  <span className="font-medium text-foreground">€{item.pricing.totalEur.toFixed(2)}</span>
                </div>
              ))}
              {discountEur > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>{tApt("priceBreakdown.directDiscount")}</span>
                  <span>{t("group.discountIncluded")}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-foreground text-base">
                <span>{tApt("priceBreakdown.total")}</span>
                <div className="text-right">
                  <div>€{totalEur.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {tApt("priceBreakdown.inBgn", { amount: totalBgn.toFixed(2) })}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("group.onePayment")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
