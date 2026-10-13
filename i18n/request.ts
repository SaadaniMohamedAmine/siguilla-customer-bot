// i18n/request.ts
//
// No locale-based routing — the app's route structure (auth flow, Stripe
// success/cancel URLs, the public share page, proxy.ts's auth guard) stays
// untouched. Locale is resolved from a cookie instead, set by
// lib/actions/locale.ts and read here on every request.
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, isLocale } from "./locales";

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("locale")?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale, messages };
});
