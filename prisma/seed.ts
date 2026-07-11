import { PrismaClient, BookingSource } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { config } from "dotenv";
import { APARTMENT_CONTENT } from "./apartment-content";

config({ path: ".env.local" });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database…");

  // ─── Admin user ──────────────────────────────────────────────────────────────
  // The admin password must be supplied via env — never commit a real credential.
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "5areood@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must be set (min 12 chars) before seeding. " +
        "Add it to .env.local (e.g. SEED_ADMIN_PASSWORD=$(openssl rand -base64 18)).",
    );
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      totpEnabled: false,
    },
    update: { passwordHash },
  });
  console.log(`✓ Admin user seeded (${adminEmail})`);

  // ─── Amenities ────────────────────────────────────────────────────────────────
  const amenities = [
    { key: "wifi", icon: "Wifi" },
    { key: "air_conditioning", icon: "AirVent" },
    { key: "tv", icon: "Tv" },
    { key: "kitchen", icon: "Utensils" },
    { key: "washing_machine", icon: "WashingMachine" },
    { key: "parking", icon: "CircleParking" },
    { key: "self_check_in", icon: "KeyRound" },
    { key: "balcony", icon: "Wind" },
    { key: "coffee_maker", icon: "Coffee" },
    { key: "hair_dryer", icon: "Wind" },
    { key: "iron", icon: "Package" },
    { key: "towels", icon: "Package" },
    { key: "elevator", icon: "ArrowUp" },
  ];

  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { key: amenity.key },
      create: amenity,
      update: { icon: amenity.icon },
    });
  }
  console.log("✓ Amenities seeded");

  // ─── Apartments ────────────────────────────────────────────────────────────────
  // Data sourced from Airbnb listings 43448044, 43448119, 45986912 & Booking.com

  const STANDARD_RULES = [
    { name: "High Season (Jul-Aug)", type: "SEASONAL" as const, startDate: "2025-07-01", endDate: "2025-08-31", multiplier: 1.4, minNights: undefined, discountPct: undefined },
    { name: "Shoulder Season (Jun, Sep)", type: "SEASONAL" as const, startDate: "2025-06-01", endDate: "2025-06-30", multiplier: 1.15, minNights: undefined, discountPct: undefined },
    { name: "7+ nights discount", type: "LENGTH_OF_STAY" as const, startDate: undefined, endDate: undefined, multiplier: undefined, minNights: 7, discountPct: 5 },
    { name: "14+ nights discount", type: "LENGTH_OF_STAY" as const, startDate: undefined, endDate: undefined, multiplier: undefined, minNights: 14, discountPct: 10 },
  ];

  // Facts + copy live in prisma/apartment-content.ts (shared with migrations)
  const apartments = APARTMENT_CONTENT.map(({ previousSlug: _prev, ...content }) => ({
    ...content,
    icalSecret: crypto.randomBytes(24).toString("hex"),
    pricingRules: STANDARD_RULES,
  }));

  for (const aptData of apartments) {
    const { translations, amenityKeys, pricingRules, ...aptBase } = aptData;

    const apt = await prisma.apartment.upsert({
      where: { slug: aptBase.slug },
      create: {
        ...aptBase,
        basePriceEur: aptBase.basePriceEur,
        cleaningFeeEur: aptBase.cleaningFeeEur,
      },
      update: {
        maxGuests: aptBase.maxGuests,
        bedrooms: aptBase.bedrooms,
        bathrooms: aptBase.bathrooms,
        sqm: aptBase.sqm,
        floor: aptBase.floor,
        basePriceEur: aptBase.basePriceEur,
        weekendUpliftPct: aptBase.weekendUpliftPct,
        cleaningFeeEur: aptBase.cleaningFeeEur,
        minStayNights: aptBase.minStayNights,
      },
    });

    // Translations
    for (const [locale, trans] of Object.entries(translations)) {
      await prisma.apartmentTranslation.upsert({
        where: { apartmentId_locale: { apartmentId: apt.id, locale } },
        create: { apartmentId: apt.id, locale, ...trans },
        update: { ...trans },
      });
    }

    // Amenities
    for (const key of amenityKeys) {
      const amenity = await prisma.amenity.findUnique({ where: { key } });
      if (!amenity) continue;
      await prisma.apartmentAmenity.upsert({
        where: { apartmentId_amenityId: { apartmentId: apt.id, amenityId: amenity.id } },
        create: { apartmentId: apt.id, amenityId: amenity.id },
        update: {},
      });
    }

    // Pricing rules
    await prisma.pricingRule.deleteMany({ where: { apartmentId: apt.id } });
    for (const rule of pricingRules) {
      await prisma.pricingRule.create({
        data: {
          apartmentId: apt.id,
          name: rule.name,
          type: rule.type,
          active: true,
          startDate: rule.startDate ? new Date(rule.startDate) : null,
          endDate: rule.endDate ? new Date(rule.endDate) : null,
          multiplier: rule.multiplier ?? null,
          minNights: rule.minNights ?? null,
          discountPct: rule.discountPct ?? null,
        },
      });
    }

    console.log(`✓ Apartment seeded: ${apt.slug}`);
  }

  console.log("\n✅ Database seeded successfully!");
  console.log("\n⚠️  SECURITY: Change the admin password after first login.");
  console.log("   Go to /admin → Settings → Change Password");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
