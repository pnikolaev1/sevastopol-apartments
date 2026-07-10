import { useTranslations } from "next-intl";
import { Star, ExternalLink, Quote } from "lucide-react";

/**
 * Real review data from the live listings (checked 2026-07-10):
 * Booking.com — 9.8 "Exceptional", 146 reviews. Airbnb — 5.0 across 23 reviews.
 * Quotes are verbatim guest reviews from Booking.com (kept in their original
 * language — never invent or edit testimonials). Update counts as they grow.
 */
const BOOKING_URL = "https://www.booking.com/hotel/bg/sevastopol-apartments-varna.html";
const BOOKING_SCORE = "9.8";
const BOOKING_COUNT = 146;

const AIRBNB_LISTINGS = [
  { name: "Studio Apartment 1", count: 7, url: "https://www.airbnb.com/rooms/43448044" },
  { name: "One-Bedroom Apartment 2", count: 5, url: "https://www.airbnb.com/rooms/43448119" },
  { name: "Sea View Apartment 3", count: 11, url: "https://www.airbnb.com/rooms/45986912" },
] as const;
const AIRBNB_COUNT = AIRBNB_LISTINGS.reduce((s, l) => s + l.count, 0);

const QUOTES = [
  {
    name: "Aykut",
    country: "Finland",
    date: "June 2026",
    text: "Everything was perfect. The hostess was very attentive and helpful. We would like to thank her for her kindness.",
  },
  {
    name: "Yordan",
    country: "Bulgaria",
    date: "January 2026",
    text: "Excellent communication with the host. Superb location and very clean. Not the first time we stayed and definitely won't be the last.",
  },
  {
    name: "Botezatu",
    country: "Romania",
    date: "May 2025",
    text: "Excellent accommodation. The host is very kind. The location is close to the center and the beaches. The apartment was clean and the terrace was a nice bonus for someone with a child.",
  },
] as const;

export function ReviewsSection() {
  const t = useTranslations("home.reviews");

  return (
    <section className="bg-background px-6 py-[76px]" aria-labelledby="reviews-heading">
      <div className="mx-auto max-w-[1080px] text-center">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-gold-link dark:text-gold">
          {t("eyebrow")}
        </p>
        <h2
          id="reviews-heading"
          className="mb-5 text-[clamp(24px,3vw,32px)] font-bold leading-tight text-foreground"
        >
          {t("title")}
        </h2>

        {/* Aggregate scores */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2.5">
            <span className="rounded-[9px] bg-navy px-2.5 py-1.5 text-[15px] font-extrabold leading-none text-white dark:border dark:border-white/15">
              {BOOKING_SCORE}
            </span>
            <span>
              <strong className="font-bold text-foreground">{t("bookingBadge")}</strong>
              {" · "}
              {t("bookingSummary", { count: BOOKING_COUNT })}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-gold text-gold" aria-hidden />
            {t("airbnbSummary", { count: AIRBNB_COUNT })}
          </span>
        </div>

        {/* Verbatim Booking.com quotes */}
        <div className="grid grid-cols-1 gap-[22px] text-left min-[880px]:grid-cols-3">
          {QUOTES.map(({ name, country, date, text }) => (
            <figure
              key={name}
              className="flex flex-col rounded-[18px] border border-navy/6 bg-card p-6 dark:border-border"
            >
              <Quote className="mb-3.5 h-6 w-6 text-gold/60" aria-hidden />
              <blockquote className="mb-5 flex-1 text-sm leading-relaxed text-foreground/85">
                {text}
              </blockquote>
              <figcaption className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {country} · {date}
                  </p>
                </div>
                <span className="rounded-full bg-navy px-2.5 py-1.5 text-[11px] font-bold leading-none text-white dark:border dark:border-white/15">
                  {t("scoreLabel", { score: "10" })}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Links to the platforms */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-semibold text-gold-deep underline-offset-2 hover:underline dark:text-gold"
          >
            {t("readAll")}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          {AIRBNB_LISTINGS.map(({ name, url }) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Airbnb · {name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
