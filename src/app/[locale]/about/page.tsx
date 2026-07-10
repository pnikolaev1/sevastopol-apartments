import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Waves, Star, Shield, Heart } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const values = [
    { icon: Shield, key: "cleanliness" },
    { icon: Star, key: "comfort" },
    { icon: Heart, key: "personal" },
    { icon: Waves, key: "location" },
  ] as const;

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background">
        <div className="border-b border-white/10 bg-navy py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-[-0.015em] text-white mb-4">{t("title")}</h1>
            <p className="text-white/65 text-lg leading-relaxed max-w-2xl mx-auto">{t("desc")}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {values.map(({ icon: Icon, key }) => (
              <div key={key} className="flex gap-4">
                <div className="w-12 h-12 rounded-[13px] bg-gold/15 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-gold-deep dark:text-gold" aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{t(`values.${key}.title`)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(`values.${key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
