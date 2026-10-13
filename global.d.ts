// global.d.ts
import type { Locale } from "@/i18n/locales";
import type en from "./messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof en;
  }
}
