import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, ChevronDown } from "lucide-react";

export function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <section
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Background gradient simulating sea/sand */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/60"
        aria-hidden
      />
      {/* Subtle wave pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
        <Badge
          variant="secondary"
          className="mb-6 text-sm px-4 py-1.5 bg-white/20 text-white border-white/30 backdrop-blur-sm"
        >
          <Tag className="w-3.5 h-3.5 mr-1.5" aria-hidden />
          {t("directDiscount")}
        </Badge>

        <h1
          id="hero-heading"
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
        >
          {t("headline")}
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t("subheadline")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/apartments">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-3 text-base shadow-lg"
            >
              {t("cta")}
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              size="lg"
              variant="outline"
              className="border-white/60 text-white hover:bg-white/10 font-semibold px-8 py-3 text-base backdrop-blur-sm"
            >
              Contact Owner
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#apartments"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-colors animate-bounce"
        aria-label="Scroll to apartments"
      >
        <ChevronDown className="w-8 h-8" />
      </a>
    </section>
  );
}
