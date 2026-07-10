import { useTranslations } from "next-intl";
import { Percent, MessageCircle, Clock } from "lucide-react";

const items = [
  {
    key: "saving",
    Icon: Percent,
    tile: "bg-gold",
    icon: "text-navy",
  },
  {
    key: "direct",
    Icon: MessageCircle,
    tile: "bg-navy dark:bg-navy dark:border dark:border-white/15",
    icon: "text-gold",
  },
  {
    key: "flexible",
    Icon: Clock,
    tile: "bg-brand-teal",
    icon: "text-white",
  },
] as const;

export function USPSection() {
  const t = useTranslations("home.usp");

  return (
    <section className="bg-card px-6 py-[76px]" aria-labelledby="usp-heading">
      <div className="mx-auto max-w-[1080px] text-center">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-gold-link dark:text-gold">
          {t("eyebrow")}
        </p>
        <h2
          id="usp-heading"
          className="mb-10 text-[clamp(24px,3vw,32px)] font-bold leading-tight text-foreground"
        >
          {t("title")}
        </h2>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[22px] text-left">
          {items.map(({ key, Icon, tile, icon }) => (
            <div
              key={key}
              className="rounded-[18px] border border-navy/6 bg-background p-[30px] dark:border-border"
            >
              <div className={`mb-[18px] flex h-[46px] w-[46px] items-center justify-center rounded-[13px] ${tile}`}>
                <Icon className={`h-[21px] w-[21px] ${icon}`} aria-hidden />
              </div>
              <h3 className="mb-2 text-lg font-bold leading-snug text-foreground">{t(key)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(`${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
