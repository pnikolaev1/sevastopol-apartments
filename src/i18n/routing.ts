import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["bg", "en", "ro"],
  defaultLocale: "bg",
  localePrefix: "as-needed",
});
