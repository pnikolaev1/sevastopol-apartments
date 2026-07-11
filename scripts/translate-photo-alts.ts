/**
 * One-time backfill: adds { bg, ro, de } caption translations for the photos
 * imported by import-photos.ts (matched by their EN alt text). Photos added
 * later get their captions written directly in the admin photo manager.
 *
 *   npx tsx scripts/translate-photo-alts.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
config({ path: ".env.local" });

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }) });

const T: Record<string, { bg: string; ro: string; de: string }> = {
  "Living area with blue corner sofa and dining table": { bg: "Дневна със син ъглов диван и маса за хранене", ro: "Zonă de zi cu canapea albastră de colț și masă de luat masa", de: "Wohnbereich mit blauem Ecksofa und Esstisch" },
  "Double bed with coastal striped bedding": { bg: "Двойно легло с раирано спално бельо в морски стил", ro: "Pat dublu cu lenjerie în dungi în stil marin", de: "Doppelbett mit gestreifter Bettwäsche im Küstenstil" },
  "Breakfast tray served on the bed": { bg: "Поднос със закуска, сервиран на леглото", ro: "Tavă cu mic dejun servită pe pat", de: "Frühstückstablett auf dem Bett serviert" },
  "Open-plan kitchen and living area": { bg: "Кухня и дневна с отворен план", ro: "Bucătărie și zonă de zi în plan deschis", de: "Offene Küche und Wohnbereich" },
  "Fully equipped kitchen with oven": { bg: "Напълно оборудвана кухня с фурна", ro: "Bucătărie complet utilată cu cuptor", de: "Voll ausgestattete Küche mit Backofen" },
  "Corner sofa with coffee table": { bg: "Ъглов диван с холна маса", ro: "Canapea de colț cu măsuță de cafea", de: "Ecksofa mit Couchtisch" },
  "Studio layout with sofa and bed": { bg: "Студио с диван и легло", ro: "Garsonieră cu canapea și pat", de: "Studio-Aufteilung mit Sofa und Bett" },
  "Sofa bed prepared with fresh towels": { bg: "Разтегателен диван с чисти кърпи", ro: "Canapea extensibilă pregătită cu prosoape curate", de: "Schlafsofa mit frischen Handtüchern" },
  "Private terrace with garden swing": { bg: "Частна тераса с градинска люлка", ro: "Terasă privată cu balansoar de grădină", de: "Private Terrasse mit Gartenschaukel" },
  "Terrace dining table": { bg: "Маса за хранене на терасата", ro: "Masă de luat masa pe terasă", de: "Esstisch auf der Terrasse" },
  "Bathroom with shower and washing machine": { bg: "Баня с душ и пералня", ro: "Baie cu duș și mașină de spălat", de: "Badezimmer mit Dusche und Waschmaschine" },
  "Bathroom vanity with toiletries": { bg: "Мивка с тоалетни принадлежности", ro: "Lavoar cu articole de toaletă", de: "Waschtisch mit Pflegeprodukten" },
  "Kitchen hob and kettle": { bg: "Котлони и електрическа кана", ro: "Plită și fierbător", de: "Kochfeld und Wasserkocher" },
  "Work desk with mirror": { bg: "Работно бюро с огледало", ro: "Birou de lucru cu oglindă", de: "Schreibtisch mit Spiegel" },
  "Terrace overlooking the courtyard": { bg: "Тераса с изглед към вътрешния двор", ro: "Terasă cu vedere spre curtea interioară", de: "Terrasse mit Blick auf den Innenhof" },
  "Living room with corner sofa and dining area": { bg: "Хол с ъглов диван и кът за хранене", ro: "Living cu canapea de colț și zonă de luat masa", de: "Wohnzimmer mit Ecksofa und Essbereich" },
  "Blue kitchen with dining table": { bg: "Синя кухня с маса за хранене", ro: "Bucătărie albastră cu masă de luat masa", de: "Blaue Küche mit Esstisch" },
  "Fully equipped blue kitchen": { bg: "Напълно оборудвана синя кухня", ro: "Bucătărie albastră complet utilată", de: "Voll ausgestattete blaue Küche" },
  "Bedroom with double bed and patterned feature wall": { bg: "Спалня с двойно легло и декоративна стена", ro: "Dormitor cu pat dublu și perete decorativ", de: "Schlafzimmer mit Doppelbett und gemusterter Akzentwand" },
  "Bedroom with navy throw blanket": { bg: "Спалня с тъмносиньо одеяло", ro: "Dormitor cu pătură bleumarin", de: "Schlafzimmer mit dunkelblauer Decke" },
  "Breakfast tray with croissants on the bed": { bg: "Поднос със закуска и кроасани на леглото", ro: "Tavă cu mic dejun și croissante pe pat", de: "Frühstückstablett mit Croissants auf dem Bett" },
  "Grey sofa with yellow accents": { bg: "Сив диван с жълти акценти", ro: "Canapea gri cu accente galbene", de: "Graues Sofa mit gelben Akzenten" },
  "Dining table with yellow chairs": { bg: "Маса за хранене с жълти столове", ro: "Masă de luat masa cu scaune galbene", de: "Esstisch mit gelben Stühlen" },
  "Kitchen with oven, dishwasher and washing machine": { bg: "Кухня с фурна, съдомиялна и пералня", ro: "Bucătărie cu cuptor, mașină de spălat vase și mașină de spălat rufe", de: "Küche mit Backofen, Geschirrspüler und Waschmaschine" },
  "Bathroom with patterned tiles": { bg: "Баня с декоративни плочки", ro: "Baie cu plăci decorative", de: "Badezimmer mit gemusterten Fliesen" },
  "Walk-in shower": { bg: "Душ кабина", ro: "Cabină de duș walk-in", de: "Ebenerdige Dusche" },
  "Large private terrace with greenery": { bg: "Голяма частна тераса със зеленина", ro: "Terasă privată mare cu verdeață", de: "Große private Terrasse mit Grünpflanzen" },
  "Terrace dining under the pergola": { bg: "Хранене на терасата под перголата", ro: "Masă pe terasă sub pergolă", de: "Essen auf der Terrasse unter der Pergola" },
  "Terrace table set for dinner": { bg: "Маса на терасата, подредена за вечеря", ro: "Masă pe terasă aranjată pentru cină", de: "Terrassentisch für das Abendessen gedeckt" },
  "Breakfast tray served in the bedroom": { bg: "Поднос със закуска, сервиран в спалнята", ro: "Tavă cu mic dejun servită în dormitor", de: "Frühstückstablett im Schlafzimmer serviert" },
  "Bedroom with double bed and warm wood interior": { bg: "Спалня с двойно легло и топъл дървен интериор", ro: "Dormitor cu pat dublu și interior cald din lemn", de: "Schlafzimmer mit Doppelbett und warmem Holzinterieur" },
  "Bedroom with armchair by the window": { bg: "Спалня с кресло до прозореца", ro: "Dormitor cu fotoliu lângă fereastră", de: "Schlafzimmer mit Sessel am Fenster" },
  "Double bed with upholstered headboard": { bg: "Двойно легло с тапицирана табла", ro: "Pat dublu cu tăblie tapițată", de: "Doppelbett mit gepolstertem Kopfteil" },
  "Modern kitchen with dining table": { bg: "Модерна кухня с маса за хранене", ro: "Bucătărie modernă cu masă de luat masa", de: "Moderne Küche mit Esstisch" },
  "Kitchen with yellow accent chairs": { bg: "Кухня с жълти столове", ro: "Bucătărie cu scaune galbene", de: "Küche mit gelben Akzentstühlen" },
  "Living area with sofa and dining corner": { bg: "Дневна с диван и кът за хранене", ro: "Zonă de zi cu canapea și colț de luat masa", de: "Wohnbereich mit Sofa und Essecke" },
  "Bright room with natural light": { bg: "Светла стая с естествена светлина", ro: "Cameră luminoasă cu lumină naturală", de: "Helles Zimmer mit natürlichem Licht" },
  "Coffee tray served on the bed": { bg: "Поднос с кафе, сервиран на леглото", ro: "Tavă cu cafea servită pe pat", de: "Kaffeetablett auf dem Bett serviert" },
  "Bathroom with shower": { bg: "Баня с душ", ro: "Baie cu duș", de: "Badezimmer mit Dusche" },
  "Walk-in shower cabin": { bg: "Душ кабина", ro: "Cabină de duș", de: "Duschkabine" },
  "Balcony with bistro table": { bg: "Балкон с малка маса", ro: "Balcon cu masă bistro", de: "Balkon mit Bistrotisch" },
  "Sunny balcony seating": { bg: "Слънчев кът на балкона", ro: "Loc însorit pe balcon", de: "Sonniger Sitzplatz auf dem Balkon" },
  "Entryway with coat rack": { bg: "Антре със закачалка", ro: "Hol de intrare cu cuier", de: "Eingangsbereich mit Garderobe" },
  "Gold wall decor detail": { bg: "Златен декоративен детайл на стената", ro: "Detaliu decorativ auriu pe perete", de: "Goldenes Wanddekor-Detail" },
};

async function main() {
  const photos = await prisma.apartmentPhoto.findMany({ select: { id: true, alt: true, altTranslations: true } });
  let updated = 0;
  for (const photo of photos) {
    if (photo.altTranslations) continue; // don't clobber admin edits
    const tr = T[photo.alt];
    if (!tr) continue;
    await prisma.apartmentPhoto.update({
      where: { id: photo.id },
      data: { altTranslations: { en: photo.alt, ...tr } },
    });
    updated++;
  }
  console.log(`translated captions for ${updated}/${photos.length} photos`);
}

main().finally(() => prisma.$disconnect());
