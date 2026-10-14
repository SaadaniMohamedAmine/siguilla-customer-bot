const MESSAGES = {
  en: "I don't have a verified answer to that. Let me connect you with the team.",
  fr: "Je n'ai pas de réponse vérifiée à cette question. Je peux vous mettre en relation avec l'équipe.",
} as const;

export function fallbackMessage(locale?: string | null): string {
  return locale?.toLowerCase().startsWith("fr") ? MESSAGES.fr : MESSAGES.en;
}

export const FALLBACK_SENTINEL = "NO_VERIFIED_ANSWER";
export const HANDOFF_AFTER_FALLBACKS = 2;
