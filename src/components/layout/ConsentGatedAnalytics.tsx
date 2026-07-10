"use client";

import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";
import { subscribeToConsent, getConsent } from "./CookieBanner";

/**
 * Loads Vercel Analytics only after the visitor clicked "Accept All" in the
 * cookie banner. Vercel Analytics is cookieless, but gating it keeps the
 * banner's promise ("we ask before analytics") literally true.
 */
export function ConsentGatedAnalytics() {
  const consent = useSyncExternalStore(subscribeToConsent, getConsent, () => null);
  if (consent !== "all") return null;
  return <Analytics />;
}
