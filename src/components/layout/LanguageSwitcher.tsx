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
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Globe className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">{current?.flag} {current?.code.toUpperCase()}</span>
            <span className="sm:hidden">{current?.flag}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {LOCALES.map(({ code, label, flag }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => switchLocale(code)}
            className={locale === code ? "font-semibold text-primary" : ""}
          >
            {flag} {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
