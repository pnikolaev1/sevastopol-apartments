import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/db/prisma";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://sevastopolapartments.com";

/** Path for a locale, honouring localePrefix "as-needed" (default has none). */
function localizedUrl(locale: string, path: string) {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${BASE_URL}${prefix}${path}` || BASE_URL;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/apartments",
    "/about",
    "/contact",
    "/legal/terms",
    "/legal/privacy",
    "/legal/cookies",
  ];

  let apartmentSlugs: string[] = [];
  try {
    const apartments = await prisma.apartment.findMany({
      where: { active: true },
      select: { slug: true },
    });
    apartmentSlugs = apartments.map((a) => a.slug);
  } catch {
    // DB unavailable (e.g. during build) — ship the static routes only.
  }

  const paths = [
    ...staticPaths,
    ...apartmentSlugs.map((slug) => `/apartments/${slug}`),
  ];

  return paths.map((path) => ({
    url: localizedUrl(routing.defaultLocale, path),
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/legal") ? 0.3 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, localizedUrl(locale, path)])
      ),
    },
  }));
}
