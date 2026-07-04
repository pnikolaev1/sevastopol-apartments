"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { PriceBreakdown } from "@/lib/pricing";

const IS_STRIPE_TEST = process.env.NEXT_PUBLIC_STRIPE_MODE !== "live";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const guestSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  country: z.string().min(2).max(100),
  specialRequests: z.string().max(500).optional(),
  agreeTerms: z.boolean().refine((v) => v === true, { message: "You must agree to the terms" }),
});

type GuestFormData = z.infer<typeof guestSchema>;

interface BookingProps {
  apartment: { id: string; slug: string; name: string };
  checkIn: string;
  checkOut: string;
  guests: number;
  pricing: PriceBreakdown;
  bookingType: "instant" | "request";
  locale: string;
}

function PaymentStep({
  clientSecret,
  bookingId,
  locale,
}: {
  clientSecret: string;
  bookingId: string;
  locale: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/booking/confirmation/${bookingId}`,
      },
    });

    if (error) {
      toast.error(error.message ?? "Payment failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || loading} className="w-full bg-primary hover:bg-primary/90">
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
        ) : (
          "Confirm & Pay"
        )}
      </Button>
    </form>
  );
}

export function BookingForm({
  apartment,
  checkIn,
  checkOut,
  guests,
  pricing,
  bookingType,
  locale,
}: BookingProps) {
  const t = useTranslations("booking");
  const router = useRouter();
  const [step, setStep] = useState<"details" | "payment">("details");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
  });

  async function onDetailsSubmit(data: GuestFormData) {
    setSubmitting(true);
    try {
      const endpoint =
        bookingType === "instant" ? "/api/booking/confirm" : "/api/booking/request";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentId: apartment.id,
          checkIn,
          checkOut,
          guests,
          pricing,
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
        throw new Error(err.error ?? "Failed to create booking");
      }

      const result = (await res.json()) as {
        bookingId: string;
        clientSecret?: string;
      };

      if (bookingType === "request") {
        router.push(`/booking/confirmation/${result.bookingId}?type=request`);
        return;
      }

      setBookingId(result.bookingId);
      setClientSecret(result.clientSecret ?? null);
      setStep("payment");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {IS_STRIPE_TEST && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div className="text-sm">
            <span className="font-semibold">TEST MODE — NO REAL CHARGES.</span>{" "}
            Use card <span className="font-mono font-semibold">4242 4242 4242 4242</span>, any
            future expiry, any CVC. Your real payment details are never needed.
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {apartment.name} · {format(new Date(checkIn), "MMM d")} –{" "}
          {format(new Date(checkOut), "MMM d, yyyy")} · {guests} guest{guests !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Booking type badge */}
      <Badge
        variant={bookingType === "instant" ? "default" : "secondary"}
        className="text-sm px-3 py-1"
      >
        {bookingType === "instant" ? "Instant Book" : "Request to Book"}
      </Badge>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
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
                      {form.formState.errors.firstName && (
                        <p className="text-xs text-destructive mt-1">{form.formState.errors.firstName.message}</p>
                      )}
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
                      {t("form.agreeTerms")}
                    </Label>
                  </div>
                  {form.formState.errors.agreeTerms && (
                    <p className="text-xs text-destructive">{form.formState.errors.agreeTerms.message}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
                    ) : bookingType === "instant" ? (
                      "Continue to Payment"
                    ) : (
                      t("form.submitRequest")
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
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, appearance: { theme: "stripe" } }}
                >
                  <PaymentStep
                    clientSecret={clientSecret}
                    bookingId={bookingId}
                    locale={locale}
                  />
                </Elements>
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-4">
                  <Shield className="w-3.5 h-3.5" aria-hidden />
                  {t("payment.securedBy")} · {t("payment.threeDSecure")}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Price summary */}
        <div className="lg:col-span-2">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-base">Price Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>€{pricing.nightlyRateEur.toFixed(2)} × {pricing.nights} nights</span>
                <span>€{pricing.subtotalEur.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Cleaning fee</span>
                <span>€{pricing.cleaningFeeEur.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tourist tax</span>
                <span>€{pricing.touristTaxEur.toFixed(2)}</span>
              </div>
              {pricing.directDiscountEur > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Direct discount (10%)</span>
                  <span>−€{pricing.directDiscountEur.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-foreground text-base">
                <span>Total</span>
                <div className="text-right">
                  <div>€{pricing.totalEur.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    ≈ {pricing.totalBgn.toFixed(2)} BGN
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
