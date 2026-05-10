import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone } from "lucide-react";

export function ContactCTA() {
  const t = useTranslations("home.contact");

  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0d2b4e 0%, #1a4a7a 50%, #1e6fa8 100%)",
      }}
      aria-labelledby="cta-heading"
    >
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />

      <div className="relative z-10 container mx-auto px-4 max-w-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-7 backdrop-blur-sm">
          <MessageCircle className="w-8 h-8 text-white" aria-hidden />
        </div>
        <h2
          id="cta-heading"
          className="text-3xl md:text-4xl font-bold text-white mb-5"
          style={{ fontFamily: "var(--font-display, serif)" }}
        >
          {t("title")}
        </h2>
        <p className="text-white/70 mb-10 text-lg leading-relaxed">
          {t("desc")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-white text-[#1a4a7a] hover:bg-white/95 font-semibold px-8 shadow-xl shadow-black/20 rounded-xl transition-all hover:scale-105"
            >
              {t("cta")}
            </Button>
          </Link>
          <a
            href="https://wa.me/35989436230?text=Hello%2C%20I%27m%20interested%20in%20booking%20a%20Sevastopol%20apartment%20in%20Varna"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className="bg-transparent border-2 border-white/40 text-white hover:bg-white/15 hover:border-white/70 font-semibold px-8 rounded-xl transition-all"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Us
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
