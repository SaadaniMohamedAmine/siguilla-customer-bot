/**
 * Garde-fou de la démo publique pour les endpoints Better Auth (/api/auth/*).
 * Allowlist (deny-by-default) : un visiteur de la démo ne peut appeler que ces chemins.
 * Tout autre endpoint (écriture, rôles, mot de passe, clés API...) est refusé.
 */
export const DEMO_READ_ONLY_MESSAGE = "The demo is read-only.";

const DEMO_ALLOWED: RegExp[] = [
  // Session et navigation. Les sign-in/sign-up/callback restent permis : un visiteur de la démo
  // doit pouvoir créer son propre compte (le cookie démo est encore actif à ce moment-là).
  /^\/(get-session|list-sessions|sign-out|sign-in\/email|sign-in\/social|sign-up\/email|reset-password|ok|error)$/,
  /^\/callback\/[a-z0-9-]+$/,
  // Lectures de l'organisation + changement d'organisation active.
  /^\/organization\/(get-[a-z-]+|list[a-z-]*|check-slug|has-permission|set-active)$/,
  // Lectures des clés API.
  /^\/api-key\/(get|list)$/,
];

export function isDemoAllowedPath(path: string): boolean {
  return DEMO_ALLOWED.some((re) => re.test(path));
}

/**
 * Requête de préchargement (un `<Link>` de Next, ou un navigateur qui anticipe) : elle ne doit jamais ouvrir
 * une session de démo ni consommer le quota de `/demo`, sinon la démo s'ouvre toute seule chez les visiteurs.
 */
export function isPrefetchRequest(headers: Pick<Headers, "get">): boolean {
  return (
    headers.get("next-router-prefetch") !== null ||
    headers.get("rsc") !== null ||
    /prefetch|prerender/i.test(headers.get("purpose") ?? "") ||
    /prefetch|prerender/i.test(headers.get("sec-purpose") ?? "")
  );
}

/** Demandes de réinitialisation de mot de passe (sans session) : interdites pour le compte démo. */
export const PASSWORD_RESET_REQUEST_PATHS = ["/request-password-reset", "/forget-password"];

export function isDemoEmail(email: unknown, demoEmail: string | undefined): boolean {
  return typeof email === "string" && !!demoEmail && email.trim().toLowerCase() === demoEmail.trim().toLowerCase();
}
