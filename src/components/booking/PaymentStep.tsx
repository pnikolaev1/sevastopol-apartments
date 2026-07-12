"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

/**
 * Card entry + confirm step shared by the single-apartment and group
 * checkout forms. Wrap in <Elements stripe={stripePromise} options={{clientSecret}}>.
 */
export function PaymentStep({
  bookingId,
  locale,
}: {
  bookingId: string;
  locale: string;
}) {
  const t = useTranslations("booking");
  const stripe = useStripe();
  const elements = useElements();
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
      toast.error(error.message ?? t("errors.paymentFailed"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-full bg-gold font-bold text-navy hover:bg-gold-pale"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("processing")}</>
        ) : (
          t("form.submit")
        )}
      </Button>
    </form>
  );
}
