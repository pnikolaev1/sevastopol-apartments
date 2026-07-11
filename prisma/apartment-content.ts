/**
 * Canonical apartment facts + marketing copy (all 4 locales).
 * Single source of truth shared by prisma/seed.ts and
 * scripts/fix-apartment-info.ts — keep the live admin panel authoritative
 * for day-to-day edits; this file is for fresh environments and migrations.
 *
 * Facts confirmed by the owner (2026-07-12): all apartments are one-bedroom
 * on the 1st floor with a double bed + fold-out sofa; no sea view; free
 * private on-site parking and self check-in.
 */

export interface ApartmentTranslationContent {
  name: string;
  shortDesc: string;
  description: string;
}

export interface ApartmentContent {
  slug: string;
  /** Slug used before the 2026-07 rename (redirect + migration source). */
  previousSlug?: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  floor: number;
  basePriceEur: number;
  weekendUpliftPct: number;
  cleaningFeeEur: number;
  minStayNights: number;
  amenityKeys: string[];
  translations: Record<"bg" | "en" | "ro" | "de", ApartmentTranslationContent>;
}

export const APARTMENT_CONTENT: ApartmentContent[] = [
  {
    slug: "apartment-1-studio",
    maxGuests: 4,
    bedrooms: 1,
    bathrooms: 1,
    sqm: 50,
    floor: 1,
    basePriceEur: 45,
    weekendUpliftPct: 15,
    cleaningFeeEur: 20,
    minStayNights: 2,
    amenityKeys: [
      "wifi", "air_conditioning", "tv", "kitchen", "coffee_maker", "balcony",
      "towels", "hair_dryer", "washing_machine", "parking", "self_check_in",
    ],
    translations: {
      en: {
        name: "Apartment 1",
        shortDesc: "One-bedroom apartment for up to 4 guests with a private terrace and garden swing, 1st floor, central Varna.",
        description:
          "Welcome to Apartment 1 — a bright one-bedroom apartment in the heart of Varna, fully furnished and equipped for a comfortable stay.\n\nThe bedroom has a double bed, and the living room offers a fold-out sofa for two more guests. You'll find a fully equipped kitchen with coffee maker, fridge and microwave, plus a bathroom with shower and washing machine. Outside, your private terrace with a garden swing is the perfect spot for morning coffee.\n\nFree private parking on site and self check-in make arrival easy. The beach, the Sea Garden and the city centre are all within a short walk.",
      },
      bg: {
        name: "Апартамент 1",
        shortDesc: "Апартамент с една спалня за до 4 гости, с частна тераса и градинска люлка, 1-ви етаж, център на Варна.",
        description:
          "Добре дошли в Апартамент 1 — светъл апартамент с една спалня в сърцето на Варна, напълно обзаведен и оборудван за комфортен престой.\n\nСпалнята разполага с двойно легло, а в дневната има разтегателен диван за още двама гости. Кухнята е напълно оборудвана с кафемашина, хладилник и микровълнова, а банята е с душ и пералня. Отвън ви очаква частна тераса с градинска люлка — идеалното място за сутрешното кафе.\n\nБезплатен частен паркинг на място и самостоятелно настаняване правят пристигането лесно. Плажът, Морската градина и центърът са на кратка разходка пеша.",
      },
      ro: {
        name: "Apartament 1",
        shortDesc: "Apartament cu un dormitor pentru până la 4 oaspeți, cu terasă privată și balansoar de grădină, etajul 1, centrul Varnei.",
        description:
          "Bun venit în Apartamentul 1 — un apartament luminos cu un dormitor în inima Varnei, complet mobilat și utilat pentru un sejur confortabil.\n\nDormitorul are un pat dublu, iar livingul oferă o canapea extensibilă pentru încă doi oaspeți. Bucătăria este complet utilată cu cafetieră, frigider și cuptor cu microunde, iar baia are duș și mașină de spălat. Afară vă așteaptă terasa privată cu balansoar de grădină — locul perfect pentru cafeaua de dimineață.\n\nParcarea privată gratuită la fața locului și check-in-ul autonom fac sosirea ușoară. Plaja, Grădina Mării și centrul orașului sunt la câțiva pași.",
      },
      de: {
        name: "Apartment 1",
        shortDesc: "Apartment mit einem Schlafzimmer für bis zu 4 Gäste, mit privater Terrasse und Gartenschaukel, 1. Etage, Zentrum von Varna.",
        description:
          "Willkommen in Apartment 1 — einem hellen Apartment mit einem Schlafzimmer im Herzen von Varna, komplett möbliert und für einen komfortablen Aufenthalt ausgestattet.\n\nDas Schlafzimmer hat ein Doppelbett, im Wohnzimmer steht ein Schlafsofa für zwei weitere Gäste. Die voll ausgestattete Küche bietet Kaffeemaschine, Kühlschrank und Mikrowelle, das Badezimmer Dusche und Waschmaschine. Draußen erwartet Sie die private Terrasse mit Gartenschaukel — perfekt für den Morgenkaffee.\n\nKostenloser Privatparkplatz vor Ort und Self-Check-in machen die Anreise unkompliziert. Strand, Meeresgarten und Stadtzentrum sind bequem zu Fuß erreichbar.",
      },
    },
  },
  {
    slug: "apartment-2-one-bedroom",
    maxGuests: 4,
    bedrooms: 1,
    bathrooms: 1,
    sqm: 50,
    floor: 1,
    basePriceEur: 65,
    weekendUpliftPct: 15,
    cleaningFeeEur: 25,
    minStayNights: 2,
    amenityKeys: [
      "wifi", "air_conditioning", "tv", "kitchen", "washing_machine", "coffee_maker",
      "balcony", "towels", "hair_dryer", "iron", "parking", "self_check_in",
    ],
    translations: {
      en: {
        name: "Apartment 2",
        shortDesc: "One-bedroom apartment for up to 4 guests with a large pergola terrace, 1st floor, central Varna.",
        description:
          "Apartment 2 is a spacious one-bedroom apartment in central Varna, ideal for small families or groups of up to 4.\n\nIt features a bedroom with a double bed, a living room with a fold-out sofa, a fully equipped kitchen with oven and dishwasher, and a bathroom with a walk-in shower. The highlight is the large private terrace with a pergola and outdoor dining area — perfect for long summer evenings. Air conditioning in both rooms.\n\nFree private parking on site and self check-in included. Just a few minutes' walk to the beach and the Sea Garden — one of our most popular apartments.",
      },
      bg: {
        name: "Апартамент 2",
        shortDesc: "Апартамент с една спалня за до 4 гости, с голяма тераса с пергола, 1-ви етаж, център на Варна.",
        description:
          "Апартамент 2 е просторен апартамент с една спалня в центъра на Варна — идеален за малки семейства или компании до 4 души.\n\nРазполага със спалня с двойно легло, дневна с разтегателен диван, напълно оборудвана кухня с фурна и съдомиялна и баня с душ кабина. Акцентът е голямата частна тераса с пергола и кът за хранене на открито — идеална за дългите летни вечери. Климатик и в двете стаи.\n\nБезплатен частен паркинг на място и самостоятелно настаняване. Само на няколко минути пеша от плажа и Морската градина — един от най-търсените ни апартаменти.",
      },
      ro: {
        name: "Apartament 2",
        shortDesc: "Apartament cu un dormitor pentru până la 4 oaspeți, cu terasă mare cu pergolă, etajul 1, centrul Varnei.",
        description:
          "Apartamentul 2 este un apartament spațios cu un dormitor în centrul Varnei — ideal pentru familii mici sau grupuri de până la 4 persoane.\n\nDispune de un dormitor cu pat dublu, living cu canapea extensibilă, bucătărie complet utilată cu cuptor și mașină de spălat vase și baie cu cabină de duș. Punctul forte este terasa privată mare cu pergolă și zonă de luat masa în aer liber — perfectă pentru serile lungi de vară. Aer condiționat în ambele camere.\n\nParcare privată gratuită la fața locului și check-in autonom. La doar câteva minute de mers pe jos de plajă și de Grădina Mării — unul dintre cele mai căutate apartamente ale noastre.",
      },
      de: {
        name: "Apartment 2",
        shortDesc: "Apartment mit einem Schlafzimmer für bis zu 4 Gäste, mit großer Pergola-Terrasse, 1. Etage, Zentrum von Varna.",
        description:
          "Apartment 2 ist ein geräumiges Apartment mit einem Schlafzimmer im Zentrum von Varna — ideal für kleine Familien oder Gruppen bis zu 4 Personen.\n\nEs bietet ein Schlafzimmer mit Doppelbett, ein Wohnzimmer mit Schlafsofa, eine voll ausgestattete Küche mit Backofen und Geschirrspüler sowie ein Badezimmer mit ebenerdiger Dusche. Das Highlight ist die große private Terrasse mit Pergola und Essbereich im Freien — perfekt für lange Sommerabende. Klimaanlage in beiden Räumen.\n\nKostenloser Privatparkplatz vor Ort und Self-Check-in inklusive. Nur wenige Gehminuten zum Strand und zum Meeresgarten — eines unserer beliebtesten Apartments.",
      },
    },
  },
  {
    slug: "apartment-3",
    previousSlug: "apartment-3-sea-view",
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    sqm: 45,
    floor: 1,
    basePriceEur: 85,
    weekendUpliftPct: 20,
    cleaningFeeEur: 30,
    minStayNights: 3,
    amenityKeys: [
      "wifi", "air_conditioning", "tv", "kitchen", "washing_machine", "balcony",
      "coffee_maker", "towels", "hair_dryer", "iron", "parking", "self_check_in",
    ],
    translations: {
      en: {
        name: "Apartment 3",
        shortDesc: "Cosy one-bedroom apartment for up to 3 guests with a sunny balcony, 1st floor, central Varna.",
        description:
          "Apartment 3 is our cosiest apartment — a warm, wood-accented one-bedroom in the centre of Varna.\n\nIt offers a bedroom with a double bed and an upholstered headboard, a living area with a sofa bed for a third guest, a modern fully equipped kitchen, and a bathroom with a walk-in shower. The sunny balcony with a bistro table is ideal for your morning coffee.\n\nFree private parking on site and self check-in included. The beach, the Sea Garden and the pedestrian centre are all within easy walking distance.",
      },
      bg: {
        name: "Апартамент 3",
        shortDesc: "Уютен апартамент с една спалня за до 3 гости, със слънчев балкон, 1-ви етаж, център на Варна.",
        description:
          "Апартамент 3 е най-уютният ни апартамент — с топъл дървен интериор и една спалня, в центъра на Варна.\n\nПредлага спалня с двойно легло с тапицирана табла, дневен кът с разтегателен диван за трети гост, модерна напълно оборудвана кухня и баня с душ кабина. Слънчевият балкон с малка маса е идеален за сутрешното кафе.\n\nБезплатен частен паркинг на място и самостоятелно настаняване. Плажът, Морската градина и пешеходният център са на лесно разстояние пеша.",
      },
      ro: {
        name: "Apartament 3",
        shortDesc: "Apartament confortabil cu un dormitor pentru până la 3 oaspeți, cu balcon însorit, etajul 1, centrul Varnei.",
        description:
          "Apartamentul 3 este cel mai primitor apartament al nostru — cu interior cald, cu accente de lemn, și un dormitor, în centrul Varnei.\n\nOferă un dormitor cu pat dublu cu tăblie tapițată, o zonă de zi cu canapea extensibilă pentru un al treilea oaspete, o bucătărie modernă complet utilată și o baie cu cabină de duș. Balconul însorit cu masă bistro este ideal pentru cafeaua de dimineață.\n\nParcare privată gratuită la fața locului și check-in autonom. Plaja, Grădina Mării și centrul pietonal sunt la distanță mică de mers pe jos.",
      },
      de: {
        name: "Apartment 3",
        shortDesc: "Gemütliches Apartment mit einem Schlafzimmer für bis zu 3 Gäste, mit sonnigem Balkon, 1. Etage, Zentrum von Varna.",
        description:
          "Apartment 3 ist unser gemütlichstes Apartment — mit warmem, holzbetontem Interieur und einem Schlafzimmer, im Zentrum von Varna.\n\nEs bietet ein Schlafzimmer mit Doppelbett und gepolstertem Kopfteil, einen Wohnbereich mit Schlafsofa für einen dritten Gast, eine moderne, voll ausgestattete Küche und ein Badezimmer mit ebenerdiger Dusche. Der sonnige Balkon mit Bistrotisch ist ideal für den Morgenkaffee.\n\nKostenloser Privatparkplatz vor Ort und Self-Check-in inklusive. Strand, Meeresgarten und Fußgängerzone sind bequem zu Fuß erreichbar.",
      },
    },
  },
];
