import * as React from "react";

/** Horloge partagée qui tick toutes les `intervalMs` — base pour tout affichage de temps relatif. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Formatte une date ISO en temps relatif ("2 minutes ago"), recalculé toutes les 30s. */
export function formatRelative(iso: string | Date | null, locale: string, now: number): string | null {
  if (!iso) return null;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffMs = new Date(iso).getTime() - now;
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 1) return rtf.format(0, "minute");
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return rtf.format(diffH, "hour");
  return rtf.format(Math.round(diffH / 24), "day");
}
