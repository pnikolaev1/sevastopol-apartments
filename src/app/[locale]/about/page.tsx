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
    { icon: Shield, title: "Cleanliness", desc: "Every apartment professionally cleaned before each stay." },
    { icon: Star, title: "Comfort", desc: "Quality bedding, fully equipped kitchens, reliable Wi-Fi." },
    { icon: Heart, title: "Personal Touch", desc: "The owner answers messages personally — usually within 1 hour." },
    { icon: Waves, title: "Great Location", desc: "Steps from the beach, Sea Garden, and city centre." },
  ];

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background">
        <div className="bg-primary/5 border-b border-border py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <Waves className="w-12 h-12 text-primary mx-auto mb-4" aria-hidden />
            <h1 className="text-4xl font-bold text-foreground mb-4">{t("title")}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">{t("desc")}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-primary" aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
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
