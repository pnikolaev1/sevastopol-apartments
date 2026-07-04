import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, ChevronDown, MessageCircle } from "lucide-react";

export function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <section
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Deep sea gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, #0d2b4e 0%, #1a4a7a 35%, #1e6fa8 65%, #2d8db5 100%)",
        }}
        aria-hidden
      />

      {/* Subtle shimmer overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%),
                            radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.10) 0%, transparent 50%)`,
        }}
        aria-hidden
      />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />

      <div className="relative z-10 container mx-auto px-4 text-center max-w-5xl py-24">
        <Badge
          variant="secondary"
          className="mb-8 text-sm px-5 py-2 bg-white/15 text-white border-white/25 backdrop-blur-sm font-medium"
        >
          <Tag className="w-3.5 h-3.5 mr-2 text-amber-300" aria-hidden />
          {t("directDiscount")}
        </Badge>

        <h1
          id="hero-heading"
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] mb-7 text-balance tracking-tight"
        >
          {t("headline")}
        </h1>

        <p className="text-xl sm:text-2xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
          {t("subheadline")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/apartments">
            <Button
              size="lg"
              className="bg-white text-[#1a4a7a] hover:bg-white/95 font-semibold px-10 py-6 text-base shadow-xl shadow-black/20 rounded-xl transition-all hover:scale-105"
            >
              {t("cta")}
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-transparent border-2 border-white/50 text-white hover:bg-white/15 font-semibold px-10 py-6 text-base rounded-xl backdrop-blur-sm transition-all hover:border-white/80"
            >
              <MessageCircle className="w-4 h-4 mr-2" aria-hidden />
              {t("contactOwner")}
            </Button>
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-white/60 text-sm">
          <span className="flex items-center gap-2">
            <span className="text-amber-300 text-base">★★★★★</span>
            {t("superhost")}
          </span>
          <span className="w-px h-4 bg-white/20" aria-hidden />
          <span>{t("freeCancellation")}</span>
          <span className="w-px h-4 bg-white/20" aria-hidden />
          <span>{t("instantBooking")}</span>
        </div>
      </div>

      {/* Wave bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden" aria-hidden>
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full block"
          preserveAspectRatio="none"
        >
          <path
            d="M0 40 C240 80 480 0 720 40 C960 80 1200 0 1440 40 L1440 80 L0 80 Z"
            fill="oklch(0.99 0.004 80)"
          />
        </svg>
      </div>

      {/* Scroll indicator */}
      <a
        href="#apartments"
        className="absolute bottom-14 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors animate-bounce"
        aria-label="Scroll to apartments"
      >
        <ChevronDown className="w-7 h-7" />
      </a>
    </section>
  );
}
