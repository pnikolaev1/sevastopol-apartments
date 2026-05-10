import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["bg", "en", "ro", "de"],
  defaultLocale: "bg",
  localePrefix: "as-needed",
});
