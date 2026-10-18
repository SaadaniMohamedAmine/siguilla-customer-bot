/**
 * Erreurs renvoyées par l'API (codes ou messages) que l'interface sait traduire (messages/*.json → ApiErrors).
 * Tout le reste retombe sur le message générique du composant.
 */
export const API_ERROR_CODES = [
  "agents_limit",
  "sources_limit",
  "members_limit",
  "notion_requires_pro",
  "api_requires_pro",
  "global_storage_full",
  "quota_exceeded",
  "rate_limited",
  "invalid_url",
  "not_found",
  "no_subscription",
] as const;

// Messages en clair émis par le serveur (HttpError, hooks Better Auth) → clé de traduction.
const BY_MESSAGE = {
  "The demo is read-only.": "demo_read_only",
  Unauthorized: "unauthorized",
  "Only owners and admins can manage billing.": "billing_forbidden",
  "Only owners and admins can manage API keys.": "keys_forbidden",
  "Only the owner can delete the organization.": "owner_only",
} as const;

export type ApiErrorKey = (typeof API_ERROR_CODES)[number] | (typeof BY_MESSAGE)[keyof typeof BY_MESSAGE];

export function apiErrorKey(message: unknown): ApiErrorKey | null {
  if (typeof message !== "string") return null;
  if (Object.prototype.hasOwnProperty.call(BY_MESSAGE, message)) return BY_MESSAGE[message as keyof typeof BY_MESSAGE];
  return (API_ERROR_CODES as readonly string[]).includes(message) ? (message as ApiErrorKey) : null;
}
