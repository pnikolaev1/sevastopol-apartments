"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Waves } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/apartments", label: t("apartments") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-background/85 supports-[backdrop-filter]:bg-background/70 backdrop-blur-md border-b border-border/60 shadow-sm">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-primary shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:bg-primary/90 transition-colors">
            <Waves className="w-4 h-4 text-white" aria-hidden />
          </div>
          <span className="hidden sm:block text-foreground font-semibold text-base">
            Sevastopol <span className="text-primary">Apartments</span>
          </span>
          <span className="sm:hidden text-foreground font-semibold text-base">Sevastopol</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? "text-primary bg-primary/8 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <Link href="/apartments" className="hidden md:block">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 rounded-lg px-5 font-semibold shadow-sm shadow-primary/25"
            >
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
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                    <Waves className="w-3.5 h-3.5 text-white" aria-hidden />
                  </div>
                  <span className="font-semibold text-foreground">Sevastopol</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label={t("close")}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <nav className="flex flex-col gap-1">
                {links.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(href)
                        ? "text-primary bg-primary/8 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-border mt-2">
                  <Link href="/apartments" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-primary hover:bg-primary/90 rounded-lg font-semibold">
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
