/** Resolves a photo caption for the visitor's locale, falling back to the
 *  base `alt` (EN) when no translation was entered in the admin. */
export function resolvePhotoAlt(
  photo: { alt: string; altTranslations?: unknown },
  locale: string
): string {
  const t = photo.altTranslations;
  if (t && typeof t === "object" && !Array.isArray(t)) {
    const localized = (t as Record<string, unknown>)[locale];
    if (typeof localized === "string" && localized.trim().length > 0) return localized;
  }
  return photo.alt;
}
