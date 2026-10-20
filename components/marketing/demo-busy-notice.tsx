"use client";
import * as React from "react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import { parseBusyWait } from "@/lib/demo-guard";

/**
 * Quand /demo renvoie vers `/?demo=busy&wait=N` (limite d'accès atteinte pour cette IP), explique la situation
 * au lieu de recharger la landing sans rien dire. Toast persistant (fermable) avec un chemin alternatif.
 */
export function DemoBusyNotice() {
  const t = useTranslations("DemoBusy");

  React.useEffect(() => {
    const minutes = parseBusyWait(window.location.search);
    if (minutes === null) return;
    window.history.replaceState(null, "", window.location.pathname);
    toast.warning(
      <div className="flex flex-col gap-2">
        <span>{t("message", { minutes })}</span>
        <a href="/sign-up" className="text-link w-fit underline underline-offset-4">
          {t("cta")}
        </a>
      </div>,
      { toastId: "demo-busy", autoClose: false },
    );
  }, [t]);

  return null;
}
