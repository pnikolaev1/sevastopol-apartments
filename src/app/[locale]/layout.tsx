import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { ConsentGatedAnalytics } from "@/components/layout/ConsentGatedAnalytics";
import type { Metadata } from "next";

type Locale = "bg" | "en" | "ro" | "de";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.hero" });

  return {
    alternates: {
      languages: {
        bg: "/",
        en: "/en",
        ro: "/ro",
        de: "/de",
        "x-default": "/",
      },
    },
    description: t("subheadline"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
      <CookieBanner />
      <ConsentGatedAnalytics />
      <Toaster richColors position="top-right" />
    </NextIntlClientProvider>
  );
}
