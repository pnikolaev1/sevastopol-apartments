import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const REVIEWS = [
  {
    id: 1,
    name: "Anna K.",
    country: "Romania",
    rating: 5,
    text: "Perfect location, spotlessly clean, and the owner was incredibly helpful. We'll definitely return next summer!",
    platform: "Airbnb",
  },
  {
    id: 2,
    name: "Petko S.",
    country: "Bulgaria",
    rating: 5,
    text: "Чудесен апартамент на отлично място. 5 минути пеша до плажа. Препоръчвам горещо!",
    platform: "Booking.com",
  },
  {
    id: 3,
    name: "Mircea D.",
    country: "Romania",
    rating: 5,
    text: "Apartament curat, bine dotat și proprietar amabil. Locație excelentă lângă Grădina Mării.",
    platform: "Airbnb",
  },
  {
    id: 4,
    name: "Thomas W.",
    country: "Germany",
    rating: 5,
    text: "Great value for money. The apartment had everything we needed and the Black Sea views were stunning.",
    platform: "Booking.com",
  },
  {
    id: 5,
    name: "Maria P.",
    country: "Greece",
    rating: 5,
    text: "Wonderful stay in Varna! The apartment is exactly as described, very clean and well-equipped.",
    platform: "Airbnb",
  },
  {
    id: 6,
    name: "Elena V.",
    country: "Bulgaria",
    rating: 5,
    text: "Прекрасно място за почивка! Собственикът е много внимателен и отзивчив. Определено ще се върнем.",
    platform: "Booking.com",
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
    <section className="py-20 bg-white" aria-labelledby="reviews-heading">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 id="reviews-heading" className="text-3xl font-bold text-center text-foreground mb-12">
          {t("title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {review.platform}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
