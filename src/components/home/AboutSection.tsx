import { useTranslations } from "next-intl";
import { ApartmentPlaceholder } from "@/components/apartments/ApartmentPlaceholder";

export function AboutSection() {
  const t = useTranslations("about");
  const tHome = useTranslations("home.about");

  const stats = [
    { value: "2018", label: tHome("statSince") },
    { value: "3", label: tHome("statApartments") },
    { value: tHome("statBeachValue"), label: tHome("statBeach") },
  ];

  return (
    <section id="about" className="bg-background px-6 py-[76px]" aria-labelledby="about-heading">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-12">
        {/* Varna / Sea Garden photo (placeholder until real photography is wired in) */}
        <div className="h-80 flex-[1_1_320px] overflow-hidden rounded-[22px]">
          <ApartmentPlaceholder />
        </div>

        <div className="flex-[1_1_360px]">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-gold-link dark:text-gold">
            {tHome("eyebrow")}
          </p>
          <h2
            id="about-heading"
            className="mb-4 text-[clamp(24px,3vw,30px)] font-bold leading-[1.25] text-foreground"
          >
            {t("title")}
          </h2>
          <p className="mb-6 text-[15.5px] leading-[1.7] text-muted-foreground">{t("desc")}</p>

          <div className="flex flex-wrap gap-8">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <div className="text-[26px] font-extrabold leading-none text-foreground">{value}</div>
                <div className="mt-1 text-[12.5px] font-medium leading-snug text-muted-foreground">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
