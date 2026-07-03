import { PrismaClient, BookingSource } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { config } from "dotenv";

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
    { key: "sea_view", icon: "Waves" },
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

  const apartments = [
    {
      slug: "apartment-1-studio",
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      sqm: 35,
      floor: 2,
      basePriceEur: 45,
      weekendUpliftPct: 15,
      cleaningFeeEur: 20,
      minStayNights: 2,
      icalSecret: crypto.randomBytes(32).toString("hex"),
      translations: {
        bg: {
          name: "Студио Апартамент 1",
          shortDesc: "Уютно студио за двама, на 2-ри етаж, близо до плажа на Варна.",
          description: `Добре дошли в нашето уютно студио в сърцето на Варна! Апартаментът е напълно обзаведен и оборудван с всичко необходимо за комфортен престой.

Разполага с просторна спалня, пълно оборудвана кухня с кафемашина, хладилник и микровълнова печка, удобна баня с душ и балкон с изглед към морето.

Идеалното място за двойки или пътуващи сами, търсещи спокойствие и комфорт на крачка от плажа.`,
        },
        en: {
          name: "Studio Apartment 1",
          shortDesc: "Cosy studio for two, 2nd floor, steps from Varna beach and Sea Garden.",
          description: `Welcome to our cosy studio apartment in the heart of Varna! Fully furnished and equipped with everything you need for a comfortable stay.

Features a spacious sleeping area, fully equipped kitchen with coffee maker, fridge and microwave, comfortable bathroom with shower, and a balcony with sea glimpses.

Perfect for couples or solo travellers looking for peace and comfort a stone's throw from the beach.`,
        },
        ro: {
          name: "Studio Apartament 1",
          shortDesc: "Studio confortabil pentru doi, etaj 2, lângă plaja din Varna și Grădina Mării.",
          description: `Bine ați venit în studioul nostru confortabil din inima Varnei! Complet mobilat și echipat cu tot ce aveți nevoie pentru un sejur plăcut.

Dispune de o zonă de dormit spațioasă, bucătărie complet echipată cu espressor, frigider și microunde, baie confortabilă cu duș și balcon cu priveliște spre mare.

Ideal pentru cupluri sau călători singuri care caută liniște și confort la câțiva pași de plajă.`,
        },
      },
      amenityKeys: ["wifi", "air_conditioning", "tv", "kitchen", "coffee_maker", "balcony", "towels", "hair_dryer"],
      pricingRules: [
        { name: "High Season (Jul-Aug)", type: "SEASONAL" as const, startDate: "2025-07-01", endDate: "2025-08-31", multiplier: 1.4 },
        { name: "Shoulder Season (Jun, Sep)", type: "SEASONAL" as const, startDate: "2025-06-01", endDate: "2025-06-30", multiplier: 1.15 },
        { name: "7+ nights discount", type: "LENGTH_OF_STAY" as const, minNights: 7, discountPct: 5 },
        { name: "14+ nights discount", type: "LENGTH_OF_STAY" as const, minNights: 14, discountPct: 10 },
      ],
    },
    {
      slug: "apartment-2-one-bedroom",
      maxGuests: 4,
      bedrooms: 1,
      bathrooms: 1,
      sqm: 55,
      floor: 3,
      basePriceEur: 65,
      weekendUpliftPct: 15,
      cleaningFeeEur: 25,
      minStayNights: 2,
      icalSecret: crypto.randomBytes(32).toString("hex"),
      translations: {
        bg: {
          name: "Апартамент с Една Спалня 2",
          shortDesc: "Просторен апартамент с отделна спалня за до 4-ма, 3-ти етаж, Варна.",
          description: `Просторен апартамент с отделна спалня в центъра на Варна. Идеален за малки семейства или групи до 4 души.

Разполага с отделна спалня с двойно легло, хол с разтегателен диван, напълно оборудвана кухня, баня и голям балкон. Климатик в спалнята и хола.

На 5 минути пеша от плажа и Морската градина — едно от най-предпочитаните ни настанявания.`,
        },
        en: {
          name: "One-Bedroom Apartment 2",
          shortDesc: "Spacious one-bedroom for up to 4 guests, 3rd floor, central Varna.",
          description: `Spacious one-bedroom apartment in central Varna, ideal for small families or groups of up to 4.

Features a separate bedroom with a double bed, living room with sofa bed, fully equipped kitchen, bathroom, and a large balcony. Air conditioning in both bedroom and living room.

Just 5 minutes' walk to the beach and Sea Garden — one of our most popular apartments.`,
        },
        ro: {
          name: "Apartament cu Un Dormitor 2",
          shortDesc: "Apartament spațios cu dormitor separat pentru până la 4 persoane, etaj 3, Varna.",
          description: `Apartament spațios cu dormitor separat în centrul Varnei, ideal pentru familii mici sau grupuri de până la 4 persoane.

Dispune de dormitor separat cu pat dublu, living cu canapea extensibilă, bucătărie complet echipată, baie și balcon mare. Aer condiționat în dormitor și living.

La 5 minute de mers pe jos de plajă și Grădina Mării — unul dintre cele mai populare apartamentele noastre.`,
        },
      },
      amenityKeys: ["wifi", "air_conditioning", "tv", "kitchen", "washing_machine", "coffee_maker", "balcony", "towels", "hair_dryer", "iron"],
      pricingRules: [
        { name: "High Season (Jul-Aug)", type: "SEASONAL" as const, startDate: "2025-07-01", endDate: "2025-08-31", multiplier: 1.4 },
        { name: "Shoulder Season (Jun, Sep)", type: "SEASONAL" as const, startDate: "2025-06-01", endDate: "2025-06-30", multiplier: 1.15 },
        { name: "7+ nights discount", type: "LENGTH_OF_STAY" as const, minNights: 7, discountPct: 5 },
        { name: "14+ nights discount", type: "LENGTH_OF_STAY" as const, minNights: 14, discountPct: 10 },
      ],
    },
    {
      slug: "apartment-3-sea-view",
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      sqm: 70,
      floor: 5,
      basePriceEur: 85,
      weekendUpliftPct: 20,
      cleaningFeeEur: 30,
      minStayNights: 3,
      icalSecret: crypto.randomBytes(32).toString("hex"),
      translations: {
        bg: {
          name: "Апартамент с Морска Гледка 3",
          shortDesc: "Двуспален апартамент с панорамна морска гледка, 5-ти етаж, Варна.",
          description: `Нашето премиум настаняване — двуспален апартамент на 5-ти етаж с невероятна панорамна гледка към Черно море.

Апартаментът разполага с две отделни спални, просторен хол с морска гледка, напълно оборудвана кухня с всички необходими уреди, баня и тоалетна. Балконът ви позволява да се наслаждавате на красивите морски изгреви.

Идеален за семейства или приятели, търсещи незабравимо изживяване в Черноморска Варна.`,
        },
        en: {
          name: "Sea View Apartment 3",
          shortDesc: "Two-bedroom apartment with panoramic Black Sea views, 5th floor, Varna.",
          description: `Our premium apartment — a two-bedroom on the 5th floor with stunning panoramic views of the Black Sea.

Features two separate bedrooms, a spacious sea-view living room, fully equipped kitchen with all appliances, bathroom and WC. The balcony lets you enjoy spectacular Black Sea sunrises.

Ideal for families or friends seeking an unforgettable experience on the Bulgarian Black Sea coast.`,
        },
        ro: {
          name: "Apartament cu Vedere la Mare 3",
          shortDesc: "Apartament cu două dormitoare și priveliște panoramică la Marea Neagră, etaj 5, Varna.",
          description: `Apartamentul nostru premium — cu două dormitoare la etajul 5, cu priveliști spectaculoase la Marea Neagră.

Dispune de două dormitoare separate, living spațios cu vedere la mare, bucătărie complet echipată cu toate aparatele, baie și WC. Balconul vă permite să vă bucurați de răsăriturile superbe ale Mării Negre.

Ideal pentru familii sau prieteni care caută o experiență de neuitat pe coasta bulgărească a Mării Negre.`,
        },
      },
      amenityKeys: ["wifi", "air_conditioning", "tv", "kitchen", "washing_machine", "sea_view", "balcony", "coffee_maker", "towels", "hair_dryer", "iron", "elevator"],
      pricingRules: [
        { name: "High Season (Jul-Aug)", type: "SEASONAL" as const, startDate: "2025-07-01", endDate: "2025-08-31", multiplier: 1.5 },
        { name: "Shoulder Season (Jun, Sep)", type: "SEASONAL" as const, startDate: "2025-06-01", endDate: "2025-06-30", multiplier: 1.2 },
        { name: "7+ nights discount", type: "LENGTH_OF_STAY" as const, minNights: 7, discountPct: 5 },
        { name: "14+ nights discount", type: "LENGTH_OF_STAY" as const, minNights: 14, discountPct: 10 },
      ],
    },
  ];

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
