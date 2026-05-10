import { useTranslations } from "next-intl";
import { Percent, MessageCircle, Clock } from "lucide-react";

const icons = {
  saving: Percent,
  direct: MessageCircle,
  flexible: Clock,
} as const;

export function USPSection() {
  const t = useTranslations("home.usp");

  const items = [
    { key: "saving", icon: icons.saving, color: "text-emerald-600 bg-emerald-50" },
    { key: "direct", icon: icons.direct, color: "text-primary bg-primary/10" },
    { key: "flexible", icon: icons.flexible, color: "text-amber-600 bg-amber-50" },
  ] as const;

  return (
    <section className="py-16 bg-white border-b border-border" aria-labelledby="usp-heading">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 id="usp-heading" className="text-2xl font-bold text-center text-foreground mb-10">
          {t("title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map(({ key, icon: Icon, color }) => (
            <div key={key} className="flex flex-col items-center text-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}>
                <Icon className="w-7 h-7" aria-hidden />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-1">
                  {t(`${key}`)}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(`${key}Desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
