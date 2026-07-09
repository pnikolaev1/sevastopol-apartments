"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
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
    <header className="sticky top-0 z-50 bg-navy border-b border-white/10">
      <nav className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-7">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Sevastopol Apartments — Home">
          <Image
            src="/images/logo-sa-white.png"
            alt=""
            width={40}
            height={45}
            className="h-10 w-auto"
            priority
          />
          <span className="hidden text-[15px] font-semibold leading-tight text-white min-[400px]:block">
            Sevastopol Apartments
            <span className="mt-0.5 block text-[10.5px] font-normal tracking-[0.22em] text-gold">
              VARNA
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-0.5 md:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-[18px] py-[11px] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 ${
                isActive(href)
                  ? "bg-white/10 font-semibold text-white"
                  : "font-medium text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <Link
            href="/apartments"
            className="hidden rounded-full bg-gold px-[22px] py-3 text-sm font-bold leading-none text-navy transition-colors hover:bg-gold-pale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 md:block"
          >
            {t("bookNow")}
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t("close") : t("menu")}
            aria-expanded={open}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 md:hidden"
          >
            {open ? <X className="h-[18px] w-[18px]" aria-hidden /> : <Menu className="h-[19px] w-[19px]" aria-hidden />}
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {open && (
        <div className="absolute inset-x-0 top-[76px] z-[55] flex flex-col gap-1 border-t border-white/10 bg-navy px-5 pb-6 pt-3 shadow-[0_16px_32px_rgba(5,15,30,0.4)] md:hidden">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`rounded-xl px-3.5 py-3.5 text-[15px] ${
                isActive(href)
                  ? "bg-white/10 font-semibold text-white"
                  : "font-medium text-white/65 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="mx-0.5 my-2.5 h-px bg-white/10" aria-hidden />
          <Link
            href="/apartments"
            onClick={() => setOpen(false)}
            className="rounded-full bg-gold py-[15px] text-center text-[15px] font-bold text-navy"
          >
            {t("bookNow")}
          </Link>
        </div>
      )}
    </header>
  );
}
