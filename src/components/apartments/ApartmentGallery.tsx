"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Grid2X2, X } from "lucide-react";
import { ApartmentPlaceholder } from "./ApartmentPlaceholder";
import type { ApartmentPhoto } from "@prisma/client";

interface Props {
  photos: ApartmentPhoto[];
  name: string;
}

/**
 * Photo gallery: preview grid on the page, an Airbnb-style full-screen
 * scrollable list behind "Show all photos", and a full-screen lightbox that
 * letterboxes any orientation (object-contain against the whole viewport).
 */
export function ApartmentGallery({ photos, name }: Props) {
  const t = useTranslations("apartment.gallery");
  const [gridOpen, setGridOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxOpen = lightboxIndex !== null;

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : i === 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : i === photos.length - 1 ? 0 : i + 1));
  }, [photos.length]);

  // Lock page scroll while an overlay is open.
  useEffect(() => {
    if (!gridOpen && !lightboxOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [gridOpen, lightboxOpen]);

  // Keyboard: Esc closes the topmost overlay, arrows navigate the lightbox.
  useEffect(() => {
    if (!gridOpen && !lightboxOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (lightboxOpen) setLightboxIndex(null);
        else setGridOpen(false);
      } else if (lightboxOpen && e.key === "ArrowLeft") {
        prev();
      } else if (lightboxOpen && e.key === "ArrowRight") {
        next();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gridOpen, lightboxOpen, prev, next]);

  if (photos.length === 0) {
    return <ApartmentPlaceholder className="h-[42vh] min-h-64 max-h-[460px]" label={name} />;
  }

  const primary = photos[0];
  const rest = photos.slice(1, 5);
  const current = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      {/* ── Preview grid ─────────────────────────────────────────────── */}
      <div className="relative">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[60vh] min-h-64 max-h-[500px]">
          <div
            className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden rounded-l-xl"
            onClick={() => setLightboxIndex(0)}
          >
            <Image
              src={primary?.url ?? ""}
              alt={primary?.alt || name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          {Array.from({ length: 4 }).map((_, i) => {
            const photo = rest[i];
            const isLast = i === 3 && photos.length > 5;

            return (
              <div
                key={i}
                className={`relative cursor-pointer overflow-hidden ${
                  i === 1 ? "rounded-tr-xl" : i === 3 ? "rounded-br-xl" : ""
                }`}
                onClick={() => (isLast ? setGridOpen(true) : setLightboxIndex(photo ? i + 1 : 0))}
              >
                {photo ? (
                  <>
                    <Image
                      src={photo.url}
                      alt={photo.alt || `${name} ${i + 2}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                      sizes="25vw"
                    />
                    {isLast && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                        <Grid2X2 className="w-6 h-6 mb-1" aria-hidden />
                        <span className="text-sm font-semibold">
                          {t("morePhotos", { count: photos.length - 5 })}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-md transition-colors hover:bg-gold-pale"
          onClick={() => setGridOpen(true)}
        >
          <Grid2X2 className="w-4 h-4" aria-hidden />
          {t("showAll")}
        </button>
      </div>

      {/* ── All photos (Airbnb-style scrollable sheet) ───────────────── */}
      {gridOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("showAll")}
          className="fixed inset-0 z-[80] overflow-y-auto bg-background"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
            <button
              type="button"
              onClick={() => setGridOpen(false)}
              aria-label={t("close")}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
            >
              <X className="h-5 w-5 text-foreground" aria-hidden />
            </button>
            <span className="text-sm font-semibold text-foreground">{name}</span>
            <span className="w-9 text-right text-xs text-muted-foreground">{photos.length}</span>
          </div>

          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 p-4 pb-16 sm:p-6">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className={`group relative overflow-hidden rounded-lg ${
                  i % 3 === 0 ? "col-span-2 aspect-[3/2]" : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={photo.url}
                  alt={photo.alt || `${name} ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes={i % 3 === 0 ? "(max-width: 768px) 100vw, 768px" : "(max-width: 768px) 50vw, 384px"}
                  loading={i < 3 ? "eager" : "lazy"}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Full-screen lightbox ─────────────────────────────────────── */}
      {lightboxOpen && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt || name}
          className="fixed inset-0 z-[90] flex flex-col bg-black"
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label={t("close")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5 text-white" aria-hidden />
            </button>
            <span className="text-sm text-white/70">
              {(lightboxIndex ?? 0) + 1} / {photos.length}
            </span>
            <span className="w-10" aria-hidden />
          </div>

          {/* object-contain against the full viewport handles landscape and
              portrait photos alike — the image scales to whichever dimension
              limits it. */}
          <div className="relative min-h-0 flex-1">
            <Image
              key={current.id}
              src={current.url}
              alt={current.alt || `${name} photo ${(lightboxIndex ?? 0) + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          <div className="flex items-center justify-center gap-4 px-4 py-4">
            <button
              type="button"
              onClick={prev}
              aria-label={t("previous")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5 text-white" aria-hidden />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={t("next")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-5 w-5 text-white" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
