import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import crypto from "node:crypto";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { APARTMENTS_TAG } from "@/lib/db/apartments";
import { uploadApartmentPhoto, deleteApartmentPhoto } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { z } from "zod";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_WIDTH = 1600;

/** Upload a new photo (multipart: file, apartmentId, alt?). */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const apartmentId = form.get("apartmentId");
  const alt = (form.get("alt") ?? "") as string;

  if (!(file instanceof File) || typeof apartmentId !== "string") {
    return NextResponse.json({ error: "file and apartmentId are required" }, { status: 422 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large (max 25 MB)" }, { status: 413 });
  }

  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: { id: true, slug: true, _count: { select: { photos: true } } },
  });
  if (!apartment) return NextResponse.json({ error: "Apartment not found" }, { status: 404 });

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "File is not a readable image" }, { status: 422 });
  }

  const path = `${apartment.slug}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.webp`;

  let url: string;
  try {
    url = await uploadApartmentPhoto(path, webp, "image/webp");
  } catch (err) {
    logger.error("Photo upload failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 502 }
    );
  }

  const photo = await prisma.apartmentPhoto.create({
    data: {
      apartmentId,
      url,
      alt: alt.slice(0, 300),
      altTranslations: alt ? { en: alt.slice(0, 300) } : undefined,
      position: apartment._count.photos,
      isPrimary: apartment._count.photos === 0,
    },
  });

  revalidateTag(APARTMENTS_TAG, "max");
  return NextResponse.json({ photo });
}

const patchSchema = z.object({
  apartmentId: z.string(),
  photos: z.array(
    z.object({
      id: z.string(),
      position: z.number().int().min(0),
      alt: z.string().max(300),
      altTranslations: z
        .record(z.enum(["bg", "en", "ro", "de"]), z.string().max(300))
        .optional(),
      isPrimary: z.boolean(),
    })
  ),
});

/** Reorder photos / edit captions / set the cover. */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 });

  const { apartmentId, photos } = parsed.data;

  await prisma.$transaction(
    photos.map((p) =>
      prisma.apartmentPhoto.update({
        // Scope by apartmentId so photo ids can't be re-pointed cross-apartment.
        where: { id: p.id, apartmentId },
        data: {
          position: p.position,
          alt: p.alt,
          altTranslations: p.altTranslations,
          isPrimary: p.isPrimary,
        },
      })
    )
  );

  revalidateTag(APARTMENTS_TAG, "max");
  return NextResponse.json({ ok: true });
}

const deleteSchema = z.object({ id: z.string() });

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 });

  const photo = await prisma.apartmentPhoto.findUnique({ where: { id: parsed.data.id } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.apartmentPhoto.delete({ where: { id: photo.id } });
  try {
    await deleteApartmentPhoto(photo.url);
  } catch (err) {
    // The DB row is gone (photo no longer shows); a stranded storage object
    // is only a cleanup concern.
    logger.error("Failed to delete storage object", err);
  }

  revalidateTag(APARTMENTS_TAG, "max");
  return NextResponse.json({ ok: true });
}
