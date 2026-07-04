import { useTranslations } from "next-intl";
import { Percent, MessageCircle, Clock } from "lucide-react";

const icons = {
  saving: Percent,
  direct: MessageCircle,
  flexible: Clock,
} as const;

const colors = {
  saving: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    icon: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  direct: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  flexible: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    icon: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
} as const;

export function USPSection() {
  const t = useTranslations("home.usp");

  const items = [
    { key: "saving" as const },
    { key: "direct" as const },
    { key: "flexible" as const },
  ];

  return (
    <section className="py-20 bg-background" aria-labelledby="usp-heading">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-3">
            Direct booking
          </p>
          <h2
            id="usp-heading"
            className="text-3xl md:text-4xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            {t("title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map(({ key }) => {
            const Icon = icons[key];
            const c = colors[key];
            return (
              <div
                key={key}
                className={`rounded-2xl p-8 ${c.bg} border border-border/50 flex flex-col items-start gap-5 hover:shadow-md transition-shadow`}
              >
                <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" aria-hidden />
                </div>
                <div>
                  <h3 className={`font-bold text-xl mb-2 ${c.text}`}>
                    {t(key)}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed">
                    {t(`${key}Desc`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
