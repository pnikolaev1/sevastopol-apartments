import type { PricingRule } from "@prisma/client";

export const TOURIST_TAX_BGN_PER_PERSON_NIGHT = 1;
export const BGN_TO_EUR = 1 / 1.95583;
export const DIRECT_DISCOUNT_PCT = 10;

interface PriceInput {
  // Prisma Decimal serializes to string on the client; accept both
  basePriceEur: number | string | { valueOf(): string };
  cleaningFeeEur: number | string | { valueOf(): string };
  weekendUpliftPct: number;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
  pricingRules: PricingRule[];
  applyDirectDiscount: boolean;
}

export interface PriceBreakdown {
  nights: number;
  nightlyRateEur: number;
  subtotalEur: number;
  cleaningFeeEur: number;
  touristTaxEur: number;
  directDiscountEur: number;
  totalEur: number;
  totalBgn: number;
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((checkOut.getTime() - checkIn.getTime()) / msPerDay);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6; // Fri/Sat night
}

function getSeasonalMultiplier(date: Date, rules: PricingRule[]): number {
  for (const rule of rules) {
    if (rule.type !== "SEASONAL" || !rule.active) continue;
    if (!rule.startDate || !rule.endDate || !rule.multiplier) continue;
    if (date >= rule.startDate && date <= rule.endDate) {
      return Number(rule.multiplier);
    }
  }
  return 1;
}

function getLosDiscount(nights: number, rules: PricingRule[]): number {
  let maxDiscount = 0;
  for (const rule of rules) {
    if (rule.type !== "LENGTH_OF_STAY" || !rule.active) continue;
    if (!rule.minNights || !rule.discountPct) continue;
    if (nights >= rule.minNights && rule.discountPct > maxDiscount) {
      maxDiscount = rule.discountPct;
    }
  }
  return maxDiscount;
}

export function calculatePrice(input: PriceInput): PriceBreakdown {
  const {
    basePriceEur,
    cleaningFeeEur,
    weekendUpliftPct,
    checkIn,
    checkOut,
    guestCount,
    pricingRules,
    applyDirectDiscount,
  } = input;

  const nights = calculateNights(checkIn, checkOut);
  const base = Number(basePriceEur);

  // Calculate per-night rate with seasonal + weekend adjustments
  let totalNightlySum = 0;
  const current = new Date(checkIn);
  for (let i = 0; i < nights; i++) {
    let nightRate = base;
    nightRate *= getSeasonalMultiplier(current, pricingRules);
    if (isWeekend(current)) {
      nightRate *= 1 + weekendUpliftPct / 100;
    }
    totalNightlySum += nightRate;
    current.setDate(current.getDate() + 1);
  }

  const avgNightlyRate = nights > 0 ? totalNightlySum / nights : base;
  let subtotal = totalNightlySum;

  // Length-of-stay discount applied to nightly subtotal
  const losPct = getLosDiscount(nights, pricingRules);
  if (losPct > 0) {
    subtotal = subtotal * (1 - losPct / 100);
  }

  const cleaning = Number(cleaningFeeEur);
  const touristTaxBgn = guestCount * nights * TOURIST_TAX_BGN_PER_PERSON_NIGHT;
  const touristTaxEur = touristTaxBgn * BGN_TO_EUR;

  const preTotalEur = subtotal + cleaning + touristTaxEur;

  const directDiscountEur = applyDirectDiscount
    ? (subtotal * DIRECT_DISCOUNT_PCT) / 100
    : 0;

  const totalEur = preTotalEur - directDiscountEur;
  const totalBgn = totalEur / BGN_TO_EUR;

  return {
    nights,
    nightlyRateEur: Math.round(avgNightlyRate * 100) / 100,
    subtotalEur: Math.round(subtotal * 100) / 100,
    cleaningFeeEur: Math.round(cleaning * 100) / 100,
    touristTaxEur: Math.round(touristTaxEur * 100) / 100,
    directDiscountEur: Math.round(directDiscountEur * 100) / 100,
    totalEur: Math.round(totalEur * 100) / 100,
    totalBgn: Math.round(totalBgn * 100) / 100,
  };
}
