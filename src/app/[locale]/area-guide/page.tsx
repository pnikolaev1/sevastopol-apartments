import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MapPin, Bus } from "lucide-react";

type Spot = { title: string; desc: string; dist: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "areaGuide" });
  return { title: t("title") };
}

export default async function AreaGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "areaGuide" });
  const spots = t.raw("spots") as Spot[];

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background">
        <div className="border-b border-white/10 bg-navy py-14">
          <div className="container mx-auto max-w-5xl px-4">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-gold">
              {t("eyebrow")}
            </p>
            <h1 className="mb-4 text-3xl font-bold tracking-[-0.015em] text-white md:text-4xl">
              {t("title")}
            </h1>
            <p className="max-w-2xl text-[15.5px] leading-relaxed text-white/65">{t("intro")}</p>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4 py-14">
          <div className="mb-12 flex flex-wrap items-center gap-10">
            <div className="relative h-64 flex-[1_1_300px] overflow-hidden rounded-[22px]">
              <Image
                src="/images/varna/facade.webp"
                alt="Sevastopol Apartments building in central Varna"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="flex-[1_1_320px]">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gold/15">
                  <Bus className="h-5 w-5 text-gold-deep dark:text-gold" aria-hidden />
                </span>
                <h2 className="text-lg font-bold text-foreground">{t("gettingAround")}</h2>
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {t("gettingAroundDesc")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 min-[880px]:grid-cols-4">
            {spots.map(({ title, desc, dist }) => (
              <div
                key={title}
                className="flex flex-col rounded-[18px] border border-navy/6 bg-card p-6 dark:border-border"
              >
                <h3 className="mb-2 font-bold leading-snug text-foreground">{title}</h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                <span className="flex w-fit items-center gap-1.5 rounded-full bg-gold/14 px-3 py-1.5 text-xs font-semibold leading-none text-gold-deep dark:bg-gold/20 dark:text-gold-pale">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {dist}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
