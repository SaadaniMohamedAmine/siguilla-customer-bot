import type { Locale } from "@/i18n/locales";
import { cn } from "@/lib/utils";

/** Drapeaux dessinés en SVG inline (aucun fichier externe, rendu identique sur Windows où les emojis de drapeaux n'existent pas). */
export function Flag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      aria-hidden
      className={cn("h-3 w-[18px] shrink-0 rounded-[2px] ring-1 ring-black/20 ring-inset", className)}
    >
      {locale === "fr" ? (
        <>
          <rect width="20" height="40" fill="#0055A4" />
          <rect x="20" width="20" height="40" fill="#FFFFFF" />
          <rect x="40" width="20" height="40" fill="#EF4135" />
        </>
      ) : (
        <>
          <rect width="60" height="40" fill="#012169" />
          <path d="M0 0l60 40M60 0L0 40" stroke="#FFFFFF" strokeWidth="8" />
          <path d="M0 0l60 40M60 0L0 40" stroke="#C8102E" strokeWidth="3" />
          <path d="M30 0v40M0 20h60" stroke="#FFFFFF" strokeWidth="12" />
          <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="7" />
        </>
      )}
    </svg>
  );
}
