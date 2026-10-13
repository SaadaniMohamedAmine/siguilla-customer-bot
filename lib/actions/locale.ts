// lib/actions/locale.ts
"use server";

import { cookies } from "next/headers";
import { isLocale, type Locale } from "@/i18n/locales";

export async function changeLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
