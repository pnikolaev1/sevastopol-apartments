import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function ContactCTA() {
  const t = useTranslations("home.contact");

  return (
    <section className="py-20 bg-primary text-primary-foreground" aria-labelledby="cta-heading">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <MessageCircle className="w-12 h-12 mx-auto mb-6 opacity-80" aria-hidden />
        <h2 id="cta-heading" className="text-3xl font-bold mb-4">
          {t("title")}
        </h2>
        <p className="text-primary-foreground/80 mb-8 text-lg">
          {t("desc")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
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
              variant="outline"
              className="border-white/60 text-white hover:bg-white/10 font-semibold px-8"
            >
              WhatsApp Us
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
