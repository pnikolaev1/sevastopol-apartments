import { useTranslations } from "next-intl";
import { MapPin, Waves, TreePine, Building2, Plane } from "lucide-react";

export function LocationSection() {
  const t = useTranslations("home.location");

  const highlights = [
    { icon: Waves, label: t("beach"), chip: "bg-blue-50 dark:bg-blue-950/40", fg: "text-blue-600 dark:text-blue-400" },
    { icon: TreePine, label: t("seaGarden"), chip: "bg-emerald-50 dark:bg-emerald-950/40", fg: "text-emerald-600 dark:text-emerald-400" },
    { icon: Building2, label: t("centre"), chip: "bg-amber-50 dark:bg-amber-950/40", fg: "text-amber-600 dark:text-amber-400" },
    { icon: Plane, label: t("airport"), chip: "bg-purple-50 dark:bg-purple-950/40", fg: "text-purple-600 dark:text-purple-400" },
  ] as const;

  return (
    <section className="py-24 bg-secondary/30" aria-labelledby="location-heading">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="flex items-center gap-2 text-accent font-semibold text-sm uppercase tracking-widest mb-4">
              <MapPin className="w-4 h-4" aria-hidden />
              Varna, Bulgaria
            </div>
            <h2
              id="location-heading"
              className="text-3xl md:text-4xl font-bold text-foreground mb-5"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              {t("title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-10 text-lg">
              {t("desc")}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {highlights.map(({ icon: Icon, label, chip, fg }) => (
                <div key={label} className={`flex items-center gap-3 rounded-xl p-4 ${chip} border border-border/40`}>
                  <div className="w-9 h-9 rounded-lg bg-background/60 flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${fg}`} aria-hidden />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-xl h-96 border border-border ring-1 ring-border/20">
            <iframe
              title="Sevastopol Apartments location — Varna, Bulgaria"
              src="https://www.openstreetmap.org/export/embed.html?bbox=27.9100%2C43.2050%2C27.9500%2C43.2150&layer=mapnik&marker=43.2100%2C27.9300"
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
