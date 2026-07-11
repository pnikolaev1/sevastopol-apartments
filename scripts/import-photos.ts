/**
 * Optimizes the raw apartment photography in `public/images/<source folder>`
 * into web-sized WebP files under `public/images/apartments/<slug>/`, then
 * syncs the ApartmentPhoto rows to match (first photo = primary/cover).
 *
 * Raw originals are gitignored; only the optimized WebPs are committed.
 * Idempotent — safe to re-run after adding/reordering photos below.
 *
 *   npx tsx scripts/import-photos.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const PUBLIC = path.join(process.cwd(), "public");
const MAX_WIDTH = 1600;
const QUALITY = 78;

type Pick = { file: string; alt: string };

/** Curated selection + order per apartment. First entry is the cover photo. */
const APARTMENTS: Array<{ slug: string; sourceDir: string; picks: Pick[] }> = [
  {
    slug: "apartment-1-studio",
    sourceDir: "images/apartment 1",
    picks: [
      { file: "_DSC9563.jpg", alt: "Living area with blue corner sofa and dining table" },
      { file: "_DSC9299-Pano.jpg", alt: "Double bed with coastal striped bedding" },
      { file: "_DSC9309-2.jpg", alt: "Breakfast tray served on the bed" },
      { file: "_DSC0611.jpg", alt: "Open-plan kitchen and living area" },
      { file: "_DSC0613.jpg", alt: "Fully equipped kitchen with oven" },
      { file: "_DSC9576.jpg", alt: "Corner sofa with coffee table" },
      { file: "_DSC9592.jpg", alt: "Studio layout with sofa and bed" },
      { file: "_DSC9597.jpg", alt: "Sofa bed prepared with fresh towels" },
      { file: "_DSC9610.jpg", alt: "Private terrace with garden swing" },
      { file: "_DSC9619.jpg", alt: "Terrace dining table" },
      { file: "_DSC0605.jpg", alt: "Bathroom with shower and washing machine" },
      { file: "_DSC0608.jpg", alt: "Bathroom vanity with toiletries" },
      { file: "_DSC0620.jpg", alt: "Kitchen hob and kettle" },
      { file: "_DSC9581.jpg", alt: "Work desk with mirror" },
      { file: "_DSC9627.jpg", alt: "Terrace overlooking the courtyard" },
    ],
  },
  {
    slug: "apartment-2-one-bedroom",
    sourceDir: "images/apartment 2",
    picks: [
      { file: "_DSC9249-Pano.jpg", alt: "Living room with corner sofa and dining area" },
      { file: "_DSC0548.jpg", alt: "Blue kitchen with dining table" },
      { file: "_DSC0570.jpg", alt: "Fully equipped blue kitchen" },
      { file: "_DSC9196-Pano.jpg", alt: "Bedroom with double bed and patterned feature wall" },
      { file: "_DSC9206.jpg", alt: "Bedroom with navy throw blanket" },
      { file: "_DSC9270.jpg", alt: "Breakfast tray with croissants on the bed" },
      { file: "_DSC0567.jpg", alt: "Grey sofa with yellow accents" },
      { file: "_DSC9258.jpg", alt: "Dining table with yellow chairs" },
      { file: "_DSC0572.jpg", alt: "Kitchen with oven, dishwasher and washing machine" },
      { file: "_DSC0575.jpg", alt: "Bathroom with patterned tiles" },
      { file: "_DSC0579.jpg", alt: "Walk-in shower" },
      { file: "_DSC9629.jpg", alt: "Large private terrace with greenery" },
      { file: "_DSC9636.jpg", alt: "Terrace dining under the pergola" },
      { file: "_DSC9654.jpg", alt: "Terrace table set for dinner" },
      { file: "_DSC0591.jpg", alt: "Breakfast tray served in the bedroom" },
    ],
  },
  {
    slug: "apartment-3-sea-view",
    sourceDir: "images/apartment 3",
    picks: [
      { file: "_DSC2178.jpg", alt: "Bedroom with double bed and warm wood interior" },
      { file: "_DSC2183.jpg", alt: "Bedroom with armchair by the window" },
      { file: "_DSC2197.jpg", alt: "Double bed with upholstered headboard" },
      { file: "_DSC2162.jpg", alt: "Modern kitchen with dining table" },
      { file: "_DSC2169.jpg", alt: "Kitchen with yellow accent chairs" },
      { file: "_DSC2161.jpg", alt: "Living area with sofa and dining corner" },
      { file: "_DSC2228.jpg", alt: "Bright room with natural light" },
      { file: "_DSC2215.jpg", alt: "Coffee tray served on the bed" },
      { file: "_DSC2199.jpg", alt: "Bathroom with shower" },
      { file: "_DSC2201.jpg", alt: "Walk-in shower cabin" },
      { file: "_DSC2160.jpg", alt: "Balcony with bistro table" },
      { file: "_DSC2222.jpg", alt: "Sunny balcony seating" },
      { file: "_DSC2174.jpg", alt: "Entryway with coat rack" },
      { file: "_DSC2193.jpg", alt: "Gold wall decor detail" },
      { file: "_DSC2232.jpg", alt: "Kitchen hob and kettle" },
    ],
  },
];

/** Building/common-area shots used by static pages (hero, About, Area Guide). */
const GENERAL: Array<{ file: string; out: string }> = [
  { file: "_DSC9749.jpg", out: "building.webp" },
  { file: "_DSC9742.jpg", out: "facade.webp" },
  { file: "_DSC0642.jpg", out: "sign.webp" },
  { file: "_DSC0645.jpg", out: "entrance.webp" },
];

function outName(file: string) {
  return (
    file
      .replace(/^_+/, "")
      .replace(/\.jpe?g$/i, "")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .toLowerCase() + ".webp"
  );
}

async function optimize(src: string, dest: string) {
  if (fs.existsSync(dest)) return; // already done
  await sharp(src)
    .rotate() // respect EXIF orientation
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(dest);
  const kb = Math.round(fs.statSync(dest).size / 1024);
  console.log(`  ${path.basename(dest)} (${kb} KB)`);
}

async function main() {
  // General shots
  const varnaDir = path.join(PUBLIC, "images", "varna");
  fs.mkdirSync(varnaDir, { recursive: true });
  console.log("General photos → /images/varna");
  for (const { file, out } of GENERAL) {
    await optimize(path.join(PUBLIC, "images", "general", file), path.join(varnaDir, out));
  }

  // Apartment photos + DB sync
  for (const { slug, sourceDir, picks } of APARTMENTS) {
    const destDir = path.join(PUBLIC, "images", "apartments", slug);
    fs.mkdirSync(destDir, { recursive: true });
    console.log(`${slug} → /images/apartments/${slug}`);

    const rows: { url: string; alt: string; position: number; isPrimary: boolean }[] = [];
    for (let i = 0; i < picks.length; i++) {
      const pick = picks[i];
      if (!pick) continue;
      const { file, alt } = pick;
      const src = path.join(PUBLIC, sourceDir, file);
      if (!fs.existsSync(src)) {
        console.warn(`  MISSING source: ${file} — skipped`);
        continue;
      }
      const name = outName(file);
      await optimize(src, path.join(destDir, name));
      rows.push({
        url: `/images/apartments/${slug}/${name}`,
        alt,
        position: i,
        isPrimary: i === 0,
      });
    }

    const apartment = await prisma.apartment.findUnique({
      where: { slug },
      include: { _count: { select: { photos: true } } },
    });
    if (!apartment) {
      console.warn(`  apartment ${slug} not found in DB — files optimized, rows skipped`);
      continue;
    }
    // The admin photo manager is the source of truth once photos exist —
    // never clobber captions/order the owner edited there.
    if (apartment._count.photos > 0) {
      console.log(`  photos already in DB — skipped (manage via admin panel)`);
      continue;
    }
    await prisma.apartmentPhoto.createMany({
      data: rows.map((r) => ({ ...r, apartmentId: apartment.id })),
    });
    console.log(`  ✓ ${rows.length} photos synced to DB`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
