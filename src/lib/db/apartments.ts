import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

/** Cache tag for all apartment content. Invalidate via revalidateTag on admin edits. */
export const APARTMENTS_TAG = "apartments";

/**
 * Active apartments with the fields needed for the home preview and the
 * listing grid (translation, primary photo, amenities). Deliberately excludes
 * pricingRules — those carry Dates/Decimals used in pricing math and must not
 * round-trip through the data cache. Consumers here only read the price via
 * Number(), so caching the Prisma result directly is safe.
 *
 * Cached for 5 minutes and tagged so admin edits can invalidate on demand;
 * availability is checked live elsewhere, so it is never served stale from here.
 */
export const getListApartments = unstable_cache(
  async (locale: string) =>
    prisma.apartment.findMany({
      where: { active: true },
      include: {
        translations: { where: { locale } },
        photos: { where: { isPrimary: true }, take: 1 },
        amenities: { include: { amenity: true }, take: 6 },
      },
      orderBy: { basePriceEur: "asc" },
    }),
  ["list-apartments"],
  { tags: [APARTMENTS_TAG], revalidate: 300 },
);
