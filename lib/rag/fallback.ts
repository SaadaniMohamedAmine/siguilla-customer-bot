const MESSAGES = {
  en: "I don't have a verified answer to that. Let me connect you with the team.",
  fr: "Je n'ai pas de réponse vérifiée à cette question. Je peux vous mettre en relation avec l'équipe.",
} as const;

export function fallbackMessage(locale?: string | null): string {
  return locale?.toLowerCase().startsWith("fr") ? MESSAGES.fr : MESSAGES.en;
}

export const FALLBACK_SENTINEL = "NO_VERIFIED_ANSWER";
export const HANDOFF_AFTER_FALLBACKS = 2;

/** Texte de la réponse avant le premier marqueur interne, sans espaces de fin (`full` entier, pas un morceau). */
export function stripSentinel(text: string): string {
  const i = text.indexOf(FALLBACK_SENTINEL);
  return i < 0 ? text : text.slice(0, i).trimEnd();
}

/**
 * Filtre de flux : le marqueur interne ne doit jamais atteindre le visiteur, où qu'il apparaisse (début, milieu ou fin
 * de réponse, même coupé entre deux morceaux). On retient les derniers caractères qui pourraient commencer le marqueur,
 * plus les espaces de fin (pour ne pas laisser de lignes vides devant un marqueur qui suivrait). Dès que le marqueur
 * est complet, on s'arrête : ce qu'il y a après n'est jamais émis.
 */
export class SentinelGuard {
  private pending = "";
  stopped = false;

  /** Renvoie le texte qu'on peut émettre sans risque pour ce morceau du flux. */
  push(piece: string): string {
    if (this.stopped) return "";
    const text = this.pending + piece;
    const i = text.indexOf(FALLBACK_SENTINEL);
    if (i >= 0) {
      this.stopped = true;
      this.pending = "";
      return text.slice(0, i).trimEnd();
    }
    let keep = 0;
    for (let k = Math.min(FALLBACK_SENTINEL.length - 1, text.length); k > 0; k--) {
      if (FALLBACK_SENTINEL.startsWith(text.slice(text.length - k))) {
        keep = k;
        break;
      }
    }
    const emit = text.slice(0, text.length - keep).trimEnd();
    this.pending = text.slice(emit.length);
    return emit;
  }

  /** Fin du flux sans marqueur : ce qui était retenu n'était pas le marqueur. */
  flush(): string {
    if (this.stopped) return "";
    const tail = this.pending.trimEnd();
    this.pending = "";
    return tail;
  }
}
