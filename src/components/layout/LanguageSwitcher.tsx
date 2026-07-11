"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LOCALES = [
  { code: "bg", label: "Български", flag: "🇧🇬" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const current = LOCALES.find((l) => l.code === locale);

  function switchLocale(code: string) {
    router.replace(pathname, { locale: code });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-full border border-white/28 px-3.5 text-[13px] font-semibold text-white hover:bg-white/10 hover:text-white focus-visible:ring-gold/50"
          >
            <Globe className="h-4 w-4" aria-hidden />
            <span>{current?.code.toUpperCase()} · €</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {LOCALES.map(({ code, label, flag }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => switchLocale(code)}
            className={locale === code ? "font-semibold text-gold-deep dark:text-gold" : ""}
          >
            {flag} {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
