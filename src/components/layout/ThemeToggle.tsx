"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const t = useTranslations("nav");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("toggleTheme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="rounded-full text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-gold/50"
    >
      {/* Which icon shows is driven purely by the `.dark` class on <html>, so this
          is hydration-safe without a mount gate: Sun in dark, Moon in light. */}
      <Sun className="hidden h-5 w-5 dark:block" aria-hidden />
      <Moon className="block h-5 w-5 dark:hidden" aria-hidden />
    </Button>
  );
}
