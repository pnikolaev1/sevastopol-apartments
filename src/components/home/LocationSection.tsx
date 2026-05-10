import { useTranslations } from "next-intl";
import { MapPin, Waves, TreePine, Building2, Plane } from "lucide-react";

export function LocationSection() {
  const t = useTranslations("home.location");

  const highlights = [
    { icon: Waves, label: t("beach") },
    { icon: TreePine, label: t("seaGarden") },
    { icon: Building2, label: t("centre") },
    { icon: Plane, label: t("airport") },
  ] as const;

  return (
    <section className="py-20 bg-secondary/40" aria-labelledby="location-heading">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 text-primary mb-3">
              <MapPin className="w-5 h-5" aria-hidden />
              <span className="text-sm font-semibold uppercase tracking-wider">Varna, Bulgaria</span>
            </div>
            <h2 id="location-heading" className="text-3xl font-bold text-foreground mb-4">
              {t("title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {t("desc")}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {highlights.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" aria-hidden />
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* OpenStreetMap embed */}
          <div className="rounded-2xl overflow-hidden shadow-lg h-80 border border-border">
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
