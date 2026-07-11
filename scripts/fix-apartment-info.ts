/**
 * One-time data correction (2026-07-12), per the owner:
 *  - all three apartments are one-bedroom, 1st floor, double bed + sofa bed
 *  - guests: 4 / 4 / 3 · sizes: 50 / 50 / 45 m² · no sea view anywhere
 *  - renamed to "Apartment 1/2/3"; apartment 3's slug loses "sea-view"
 *  - descriptions rewritten in all 4 languages around the real highlights
 *    (terrace with garden swing / large pergola terrace / sunny balcony,
 *    free private parking, self check-in)
 *
 *   npx tsx scripts/fix-apartment-info.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
config({ path: ".env.local" });

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }) });

import { APARTMENT_CONTENT } from "../prisma/apartment-content";

async function main() {
  // 1. Amenity catalog: drop the unused sea-view, add parking + self check-in
  await prisma.amenity.deleteMany({ where: { key: "sea_view" } });
  const parking = await prisma.amenity.upsert({
    where: { key: "parking" },
    create: { key: "parking", icon: "CircleParking" },
    update: {},
  });
  const selfCheckIn = await prisma.amenity.upsert({
    where: { key: "self_check_in" },
    create: { key: "self_check_in", icon: "KeyRound" },
    update: {},
  });

  for (const apt of APARTMENT_CONTENT.map((c) => ({ currentSlug: c.previousSlug ?? c.slug, newSlug: c.slug, maxGuests: c.maxGuests, sqm: c.sqm, translations: c.translations }))) {
    const existing = await prisma.apartment.findUnique({ where: { slug: apt.currentSlug } });
    if (!existing) {
      console.warn(`skip: ${apt.currentSlug} not found (already migrated?)`);
      continue;
    }

    await prisma.apartment.update({
      where: { id: existing.id },
      data: {
        slug: apt.newSlug ?? apt.currentSlug,
        floor: 1,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: apt.maxGuests,
        sqm: apt.sqm,
      },
    });

    for (const [locale, tr] of Object.entries(apt.translations)) {
      await prisma.apartmentTranslation.upsert({
        where: { apartmentId_locale: { apartmentId: existing.id, locale } },
        create: { apartmentId: existing.id, locale, ...tr },
        update: tr,
      });
    }

    // Assign the new amenities (idempotent)
    for (const amenity of [parking, selfCheckIn]) {
      await prisma.apartmentAmenity.upsert({
        where: { apartmentId_amenityId: { apartmentId: existing.id, amenityId: amenity.id } },
        create: { apartmentId: existing.id, amenityId: amenity.id },
        update: {},
      });
    }

    // Photo URLs follow the slug rename
    if (apt.newSlug && apt.newSlug !== apt.currentSlug) {
      const photos = await prisma.apartmentPhoto.findMany({ where: { apartmentId: existing.id } });
      for (const p of photos) {
        if (!p.url.includes(`/apartments/${apt.currentSlug}/`)) continue;
        await prisma.apartmentPhoto.update({
          where: { id: p.id },
          data: { url: p.url.replace(`/apartments/${apt.currentSlug}/`, `/apartments/${apt.newSlug}/`) },
        });
      }
    }

    console.log(`✓ ${apt.currentSlug} → ${apt.newSlug ?? apt.currentSlug}`);
  }
}

main().finally(() => prisma.$disconnect());
