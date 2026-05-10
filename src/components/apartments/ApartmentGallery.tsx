"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Grid2X2 } from "lucide-react";
import type { ApartmentPhoto } from "@prisma/client";

interface Props {
  photos: ApartmentPhoto[];
  name: string;
}

export function ApartmentGallery({ photos, name }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="h-72 bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
        <span className="text-6xl">🏠</span>
      </div>
    );
  }

  const primary = photos[0];
  const rest = photos.slice(1, 5);

  function openLightbox(index: number) {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }

  function prev() {
    setCurrentIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }

  function next() {
    setCurrentIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }

  return (
    <>
      <div className="relative">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[60vh] min-h-64 max-h-[500px]">
          {/* Primary photo */}
          <div
            className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden rounded-l-xl"
            onClick={() => openLightbox(0)}
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

          {/* Secondary photos */}
          {Array.from({ length: 4 }).map((_, i) => {
            const photo = rest[i];
            const isLast = i === 3 && photos.length > 5;

            return (
              <div
                key={i}
                className={`relative cursor-pointer overflow-hidden ${
                  i === 1 ? "rounded-tr-xl" : i === 3 ? "rounded-br-xl" : ""
                }`}
                onClick={() => openLightbox(photo ? i + 1 : 0)}
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
                        <span className="text-sm font-semibold">+{photos.length - 5} photos</span>
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

        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-4 right-4 shadow-md"
          onClick={() => openLightbox(0)}
        >
          <Grid2X2 className="w-4 h-4 mr-2" aria-hidden />
          Show all photos
        </Button>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full p-2 bg-black border-none">
          <div className="relative aspect-video">
            <Image
              src={photos[currentIndex]?.url ?? ""}
              alt={photos[currentIndex]?.alt || `${name} photo ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />

            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
              onClick={prev}
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
              onClick={next}
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
