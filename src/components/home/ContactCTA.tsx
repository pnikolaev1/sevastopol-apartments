import { useTranslations } from "next-intl";

export function ContactCTA() {
  const t = useTranslations("home.contact");

  return (
    <section id="contact" className="bg-navy px-6 py-[60px] text-center" aria-labelledby="cta-heading">
      <h2
        id="cta-heading"
        className="mb-2.5 text-[clamp(22px,3vw,28px)] font-bold leading-tight text-white"
      >
        {t("title")}
      </h2>
      <p className="mx-auto mb-[26px] max-w-xl text-[15px] leading-relaxed text-white/60">
        {t("desc")}
      </p>
      <a
        href="https://wa.me/35989436230?text=Hello%2C%20I%27m%20interested%20in%20booking%20a%20Sevastopol%20apartment%20in%20Varna"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-[15px] text-sm font-bold leading-none text-navy transition-colors hover:bg-gold-pale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        {t("cta")}
      </a>
    </section>
  );
}
