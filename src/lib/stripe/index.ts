import Stripe from "stripe";

let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  _stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return _stripe;
}

// Keep named export for backwards-compat with API routes
export const stripe = {
  paymentIntents: {
    create: (...args: Parameters<Stripe["paymentIntents"]["create"]>) => getStripe().paymentIntents.create(...args),
    retrieve: (...args: Parameters<Stripe["paymentIntents"]["retrieve"]>) => getStripe().paymentIntents.retrieve(...args),
  },
  refunds: {
    create: (...args: Parameters<Stripe["refunds"]["create"]>) => getStripe().refunds.create(...args),
  },
  webhooks: {
    constructEvent: (...args: Parameters<Stripe["webhooks"]["constructEvent"]>) =>
      getStripe().webhooks.constructEvent(...args),
  },
} as unknown as Stripe;

export const EUR_TO_BGN = parseFloat(
  process.env.NEXT_PUBLIC_EUR_TO_BGN ?? "1.95583"
);

export function toStripeAmount(eurAmount: number): number {
  return Math.round(eurAmount * 100);
}
