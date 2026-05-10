"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Waves } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/apartments", label: t("apartments") },
    { href: "/area-guide", label: t("areaGuide") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-primary text-lg shrink-0">
          <Waves className="w-6 h-6" aria-hidden />
          <span className="hidden sm:block">Sevastopol Apartments</span>
          <span className="sm:hidden">Sevastopol</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(href)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/apartments" className="hidden md:block">
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              {t("bookNow")}
            </Button>
          </Link>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="md:hidden" render={
              <Button variant="ghost" size="icon" aria-label={t("menu")}>
                <Menu className="w-5 h-5" />
              </Button>
            } />
            <SheetContent side="right" className="w-72">
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-primary">Sevastopol Apartments</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label={t("close")}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <nav className="flex flex-col gap-2">
                {links.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive(href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-border mt-2">
                  <Link href="/apartments" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      {t("bookNow")}
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
