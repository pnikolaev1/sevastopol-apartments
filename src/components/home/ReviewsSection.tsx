import { useTranslations } from "next-intl";
import { Star, Quote } from "lucide-react";

const REVIEWS = [
  {
    id: 1,
    name: "Anna K.",
    country: "Romania",
    rating: 5,
    text: "Perfect location, spotlessly clean, and the owner was incredibly helpful. We'll definitely return next summer!",
    platform: "Airbnb",
    avatarColor: "bg-rose-100 text-rose-600",
  },
  {
    id: 2,
    name: "Petko S.",
    country: "Bulgaria",
    rating: 5,
    text: "Чудесен апартамент на отлично място. 5 минути пеша до плажа. Препоръчвам горещо!",
    platform: "Booking.com",
    avatarColor: "bg-blue-100 text-blue-600",
  },
  {
    id: 3,
    name: "Mircea D.",
    country: "Romania",
    rating: 5,
    text: "Apartament curat, bine dotat și proprietar amabil. Locație excelentă lângă Grădina Mării.",
    platform: "Airbnb",
    avatarColor: "bg-emerald-100 text-emerald-600",
  },
  {
    id: 4,
    name: "Thomas W.",
    country: "Germany",
    rating: 5,
    text: "Great value for money. The apartment had everything we needed and the Black Sea views were stunning.",
    platform: "Booking.com",
    avatarColor: "bg-amber-100 text-amber-600",
  },
  {
    id: 5,
    name: "Maria P.",
    country: "Greece",
    rating: 5,
    text: "Wonderful stay in Varna! The apartment is exactly as described, very clean and well-equipped.",
    platform: "Airbnb",
    avatarColor: "bg-purple-100 text-purple-600",
  },
  {
    id: 6,
    name: "Elena V.",
    country: "Bulgaria",
    rating: 5,
    text: "Прекрасно място за почивка! Собственикът е много внимателен и отзивчив. Определено ще се върнем.",
    platform: "Booking.com",
    avatarColor: "bg-teal-100 text-teal-600",
  },
] as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden />
      ))}
    </div>
  );
}

export function ReviewsSection() {
  const t = useTranslations("home.reviews");

  return (
    <section className="py-24 bg-background" aria-labelledby="reviews-heading">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-14">
          <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-3">
            Guest reviews
          </p>
          <h2
            id="reviews-heading"
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            {t("title")}
          </h2>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <span className="flex">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden />
              ))}
            </span>
            <span className="font-semibold text-foreground">4.9</span>
            <span>average across all platforms</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className="bg-card rounded-2xl p-6 border border-border/50 hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <Quote className="w-8 h-8 text-primary/20 mb-4" aria-hidden />
              <p className="text-foreground/80 leading-relaxed mb-6 flex-1 text-sm">
                {review.text}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${review.avatarColor} flex items-center justify-center font-bold text-sm`}>
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-muted-foreground mt-1 block">{review.platform}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
