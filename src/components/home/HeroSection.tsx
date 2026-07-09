import { useTranslations } from "next-intl";
import Image from "next/image";
import { SearchPanel } from "./SearchPanel";

export function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden bg-navy" aria-labelledby="hero-heading">
      <div className="mx-auto grid max-w-[1280px] items-stretch lg:grid-cols-[1.05fr_1fr]">
        {/* Copy + search */}
        <div className="w-full max-w-[660px] justify-self-center px-6 pb-12 pt-14 sm:px-8">
          <span className="inline-block rounded-full border border-gold/35 bg-gold/12 px-[18px] py-2 text-xs font-semibold leading-normal text-gold">
            {t("directDiscount")}
          </span>
          <h1
            id="hero-heading"
            className="mb-3.5 mt-5 text-[clamp(34px,4.2vw,46px)] font-extrabold leading-[1.1] tracking-[-0.025em] text-white text-balance"
          >
            {t("headline")}
          </h1>
          <p className="mb-8 text-[clamp(15px,1.6vw,16.5px)] leading-relaxed text-white/70">
            {t("subheadline")}
          </p>

          <SearchPanel />

          {/* Trust row */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[12.5px] font-medium leading-none text-white/55">
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-gold-pale" aria-hidden>
                ★★★★★
              </span>
              {t("superhost")}
            </span>
            <span>✓ {t("freeCancellation")}</span>
            <span>✓ {t("instantBooking")}</span>
          </div>
        </div>

        {/* Photo (placeholder until real photography is wired in) */}
        <div
          className="relative flex min-h-[240px] items-center justify-center lg:min-h-[420px]"
          style={{
            background: "repeating-linear-gradient(45deg,#1B3350 0 14px,#22405F 14px 28px)",
          }}
          aria-hidden
        >
          <Image
            src="/images/logo-sa-white.png"
            alt=""
            width={120}
            height={136}
            className="h-28 w-auto opacity-20 lg:h-32"
          />
        </div>
      </div>
    </section>
  );
}
