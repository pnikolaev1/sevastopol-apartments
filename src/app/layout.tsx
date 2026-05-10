import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://sevastopolapartments.com"),
  title: {
    template: "%s | Sevastopol Apartments Varna",
    default: "Sevastopol Apartments Varna — Direct Booking",
  },
  description:
    "3 private apartments in Varna, Bulgaria. Book direct and save 10% vs Booking.com and Airbnb. Steps from the Black Sea beach.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Sevastopol Apartments Varna",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
