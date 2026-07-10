"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "cookie-consent";
const CHANGE_EVENT = "cookie-consent-change";

export function subscribeToConsent(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getConsent(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return "unavailable"; // storage blocked — don't nag
  }
}

/**
 * GDPR/ePrivacy consent banner. The site currently sets only strictly
 * necessary cookies/storage (locale, theme, this choice), so the banner is
 * informational — but it records the visitor's choice so analytics can be
 * gated on `localStorage["cookie-consent"] === "all"` if added later.
 */
export function CookieBanner() {
  const t = useTranslations("cookies.banner");
  // Server snapshot pretends consent exists so nothing flashes during SSR;
  // the client snapshot reads the real value after hydration.
  const consent = useSyncExternalStore(subscribeToConsent, getConsent, () => "ssr");

  function choose(value: "all" | "necessary") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-[70] p-4 sm:p-5"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-[20px] border border-white/12 bg-navy p-5 shadow-[0_18px_40px_rgba(5,15,30,0.45)] sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="mb-1 text-sm font-bold text-white">{t("title")}</p>
          <p className="text-[13px] leading-relaxed text-white/65">
            {t("desc")}{" "}
            <Link
              href="/legal/cookies"
              className="font-semibold text-gold underline-offset-2 hover:underline"
            >
              {t("policy")}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => choose("necessary")}
            className="rounded-full border border-white/28 px-5 py-2.5 text-[13px] font-semibold leading-none text-white transition-colors hover:bg-white/10"
          >
            {t("necessaryOnly")}
          </button>
          <button
            type="button"
            onClick={() => choose("all")}
            className="rounded-full bg-gold px-5 py-2.5 text-[13px] font-bold leading-none text-navy transition-colors hover:bg-gold-pale"
          >
            {t("acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
