import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "@/i18n/navigation";
import {
  Waves,
  Star,
  Shield,
  Heart,
  MapPin,
  ExternalLink,
  KeyRound,
  CircleParking,
  Clock,
  Languages,
  ArrowRight,
} from "lucide-react";

const MAPS_URL = "https://maps.google.com/?q=ul.+Lyuben+Karavelov+7,+9002+Varna,+Bulgaria";
const BOOKING_URL = "https://www.booking.com/hotel/bg/sevastopol-apartments-varna.html";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, tHome] = await Promise.all([
    getTranslations({ locale, namespace: "about" }),
    getTranslations({ locale, namespace: "home.about" }),
  ]);

  const values = [
    { icon: Shield, key: "cleanliness" },
    { icon: Star, key: "comfort" },
    { icon: Heart, key: "personal" },
    { icon: Waves, key: "location" },
  ] as const;

  const practical = [
    { icon: Clock, key: "checkin" },
    { icon: KeyRound, key: "selfCheckIn" },
    { icon: CircleParking, key: "parking" },
    { icon: Languages, key: "languages" },
  ] as const;

  const stats = [
    { value: "2018", label: tHome("statSince") },
    { value: "3", label: tHome("statApartments") },
    { value: "9.8", label: t("ratingLabel"), href: BOOKING_URL },
    { value: tHome("statBeachValue"), label: tHome("statBeach") },
  ];

  const eyebrowCls = "mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-gold-link dark:text-gold";

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-white/10 bg-navy py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-[-0.015em] text-white mb-4">{t("title")}</h1>
            <p className="text-white/65 text-lg leading-relaxed max-w-2xl mx-auto">{t("desc")}</p>
          </div>
        </div>

        {/* Our story */}
        <section className="px-4 py-16">
          <div className="container mx-auto flex max-w-5xl flex-wrap items-center gap-12">
            <div className="relative h-80 flex-[1_1_320px] overflow-hidden rounded-[22px]">
              <Image
                src="/images/varna/sign.webp"
                alt="Sevastopol Apartments sign at the entrance"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="flex-[1_1_380px]">
              <p className={eyebrowCls}>{t("story.eyebrow")}</p>
              <h2 className="mb-4 text-[clamp(24px,3vw,30px)] font-bold leading-[1.25] text-foreground">
                {t("story.title")}
              </h2>
              <p className="mb-4 text-[15.5px] leading-[1.7] text-muted-foreground">{t("story.p1")}</p>
              <p className="text-[15.5px] leading-[1.7] text-muted-foreground">{t("story.p2")}</p>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="bg-navy px-4 py-10">
          <div className="container mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center sm:grid-cols-4">
            {stats.map(({ value, label, href }) => {
              const inner = (
                <>
                  <div className="text-3xl font-extrabold text-gold">{value}</div>
                  <div className="mt-1 text-[12.5px] font-medium leading-snug text-white/60">{label}</div>
                </>
              );
              return href ? (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="group">
                  {inner}
                  <span className="mt-1 block text-[11px] text-gold/70 underline-offset-2 group-hover:underline">
                    {t("reviewsCta")}
                  </span>
                </a>
              ) : (
                <div key={label}>{inner}</div>
              );
            })}
          </div>
        </section>

        {/* Values */}
        <section className="px-4 py-16">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {values.map(({ icon: Icon, key }) => (
                <div key={key} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-gold/15">
                    <Icon className="h-6 w-6 text-gold-deep dark:text-gold" aria-hidden />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">{t(`values.${key}.title`)}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{t(`values.${key}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Building & location */}
        <section className="bg-card px-4 py-16">
          <div className="container mx-auto flex max-w-5xl flex-wrap-reverse items-center gap-12">
            <div className="flex-[1_1_380px]">
              <p className={eyebrowCls}>{t("building.eyebrow")}</p>
              <h2 className="mb-4 text-[clamp(24px,3vw,30px)] font-bold leading-[1.25] text-foreground">
                {t("building.title")}
              </h2>
              <p className="mb-5 text-[15.5px] leading-[1.7] text-muted-foreground">{t("building.desc")}</p>
              <p className="mb-5 flex items-start gap-2 text-sm text-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep dark:text-gold" aria-hidden />
                ul. „Lyuben Karavelov“ 7, 9002 Varna
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-hover dark:bg-gold dark:text-navy dark:hover:bg-gold-pale"
                >
                  {t("building.mapCta")}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
                <Link
                  href="/area-guide"
                  className="flex items-center gap-1.5 rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-gold dark:border-border"
                >
                  {t("building.guideCta")}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
            <div className="relative h-80 flex-[1_1_320px] overflow-hidden rounded-[22px]">
              <Image
                src="/images/varna/entrance.webp"
                alt="Entrance of the Sevastopol Apartments building"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>

        {/* Practical info */}
        <section className="px-4 py-16">
          <div className="container mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-[clamp(22px,3vw,28px)] font-bold text-foreground">
              {t("practical.title")}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {practical.map(({ icon: Icon, key }) => (
                <div
                  key={key}
                  className="flex items-center gap-3.5 rounded-[18px] border border-navy/6 bg-card p-5 dark:border-border"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gold/15">
                    <Icon className="h-5 w-5 text-gold-deep dark:text-gold" aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-foreground">{t(`practical.${key}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-navy px-4 py-14 text-center">
          <h2 className="mb-6 text-[clamp(22px,3vw,28px)] font-bold text-white">{t("cta.title")}</h2>
          <Link
            href="/apartments"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-[15px] text-sm font-bold leading-none text-navy transition-colors hover:bg-gold-pale"
          >
            {t("cta.button")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
