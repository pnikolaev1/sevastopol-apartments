import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

type LegalSection = { h: string; p: string };

export async function LegalPage({
  locale,
  page,
}: {
  locale: string;
  page: "terms" | "privacy" | "cookies";
}) {
  const t = await getTranslations({ locale, namespace: "legal" });
  const sections = t.raw(`${page}.sections`) as LegalSection[];

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background">
        <div className="border-b border-white/10 bg-navy py-12">
          <div className="container mx-auto max-w-3xl px-4">
            <h1 className="text-3xl font-bold tracking-[-0.015em] text-white md:text-4xl">
              {t(`${page}.title`)}
            </h1>
            <p className="mt-3 text-sm text-white/55">{t("updated")}</p>
          </div>
        </div>

        <div className="container mx-auto max-w-3xl px-4 py-12">
          <div className="space-y-8">
            {sections.map(({ h, p }) => (
              <section key={h}>
                <h2 className="mb-2 text-lg font-bold text-foreground">{h}</h2>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{p}</p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function legalMetadata(page: "terms" | "privacy" | "cookies") {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "legal" });
    return { title: t(`${page}.title`), robots: { index: true, follow: true } };
  };
}
