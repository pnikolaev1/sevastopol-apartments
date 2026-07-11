"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Star, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALES = ["bg", "en", "ro", "de"] as const;
type Loc = (typeof LOCALES)[number];

export interface PhotoRow {
  id: string;
  url: string;
  alt: string;
  altTranslations: Partial<Record<Loc, string>> | null;
  position: number;
  isPrimary: boolean;
}

export default function PhotoManager({
  apartmentId,
  initialPhotos,
}: {
  apartmentId: string;
  initialPhotos: PhotoRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [photos, setPhotos] = useState<PhotoRow[]>(
    [...initialPhotos].sort((a, b) => a.position - b.position)
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function move(index: number, dir: -1 | 1) {
    setPhotos((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      const a = next[index]!;
      next[index] = next[j]!;
      next[j] = a;
      return next;
    });
  }

  function setCover(id: string) {
    setPhotos((prev) => prev.map((p) => ({ ...p, isPrimary: p.id === id })));
  }

  function setCaption(id: string, locale: Loc, value: string) {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              altTranslations: { ...(p.altTranslations ?? {}), [locale]: value },
              alt: locale === "en" ? value : p.alt,
            }
          : p
      )
    );
  }

  async function saveAll() {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await fetch("/api/admin/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentId,
          photos: photos.map((p, i) => ({
            id: p.id,
            position: i,
            alt: p.altTranslations?.en ?? p.alt,
            altTranslations: p.altTranslations ?? undefined,
            isPrimary: p.isPrimary,
          })),
        }),
      });
      if (res.ok) {
        setSuccess("Снимките са запазени");
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Грешка при запис");
      }
    });
  }

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        form.set("apartmentId", apartmentId);
        const res = await fetch("/api/admin/photos", { method: "POST", body: form });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error ?? `Качването на ${file.name} се провали`);
        setPhotos((prev) => [...prev, j.photo]);
      }
      setSuccess("Снимките са качени");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при качване");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string) {
    if (!confirm("Да изтрия ли тази снимка?")) return;
    setError("");
    const res = await fetch("/api/admin/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } else {
      setError("Грешка при изтриване");
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-navy/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-navy/60">
          Първата снимка е корицата в списъка. Използвайте стрелките за пренареждане.
        </p>
        <label className="flex cursor-pointer items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-hover">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Качи снимки
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => onUpload(e.target.files)}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className={cn(
              "overflow-hidden rounded-xl border",
              photo.isPrimary ? "border-gold ring-2 ring-gold/40" : "border-navy/10"
            )}
          >
            <div className="relative aspect-[4/3]">
              <Image src={photo.url} alt={photo.alt} fill className="object-cover" sizes="200px" />
              {photo.isPrimary && (
                <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-1 text-[10px] font-bold text-navy">
                  Корица
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-1 p-1.5">
              <div className="flex gap-0.5">
                <IconBtn label="Наляво/нагоре" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Надясно/надолу" onClick={() => move(i, 1)} disabled={i === photos.length - 1}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Направи корица" onClick={() => setCover(photo.id)}>
                  <Star className={cn("h-3.5 w-3.5", photo.isPrimary && "fill-gold text-gold")} />
                </IconBtn>
              </div>
              <div className="flex gap-0.5">
                <button
                  onClick={() => setExpanded(expanded === photo.id ? null : photo.id)}
                  className="rounded px-1.5 py-1 text-[11px] font-semibold text-navy/70 hover:bg-navy/5"
                >
                  Надписи
                </button>
                <IconBtn label="Изтрий" onClick={() => remove(photo.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </IconBtn>
              </div>
            </div>
            {expanded === photo.id && (
              <div className="space-y-1.5 border-t border-navy/10 p-2">
                {LOCALES.map((loc) => (
                  <div key={loc} className="flex items-center gap-1.5">
                    <span className="w-7 text-[10px] font-bold uppercase text-navy/50">{loc}</span>
                    <input
                      type="text"
                      value={photo.altTranslations?.[loc] ?? (loc === "en" ? photo.alt : "")}
                      onChange={(e) => setCaption(photo.id, loc, e.target.value)}
                      placeholder="Надпис…"
                      className="w-full rounded border border-navy/15 px-2 py-1 text-xs outline-none focus:border-gold"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {photos.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-navy/50">
            Няма снимки — качете първите с бутона горе.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={saveAll}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-navy hover:bg-gold-pale disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Запази подредбата и надписите
        </button>
        {success && <p className="text-sm text-green-600">{success}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded p-1 text-navy/70 hover:bg-navy/5 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
