"use client";
import { useTranslations } from "next-intl";
import { apiErrorKey } from "@/lib/api-errors";

/** Message traduit pour une erreur d'API (Error de `api()`, ou erreur Better Auth), sinon `fallback`. */
export function useApiError() {
  const t = useTranslations("ApiErrors");
  return (error: unknown, fallback: string): string => {
    const message = error instanceof Error ? error.message : (error as { message?: unknown } | null)?.message;
    const key = apiErrorKey(message);
    return key ? t(key) : fallback;
  };
}
