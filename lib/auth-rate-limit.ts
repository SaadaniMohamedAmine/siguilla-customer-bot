import { PASSWORD_RESET_REQUEST_PATHS } from "@/lib/demo-guard";

export type RateRule = { key: string; limit: number; windowMs: number };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * Limites des endpoints d'authentification exposés (chemins Better Auth), appliquées avec le limiteur
 * en base du projet (RateLimitBucket) : pas de nouvelle table, pas de service externe.
 * Appelé uniquement pour de vraies requêtes HTTP (jamais pour les appels serveur internes comme /demo).
 */
export function authRateRules(path: string, ip: string, email?: unknown): RateRule[] {
  if (PASSWORD_RESET_REQUEST_PATHS.includes(path)) {
    const rules: RateRule[] = [{ key: `auth:reset:ip:${ip}`, limit: 5, windowMs: HOUR }];
    if (typeof email === "string" && email.trim()) {
      rules.push({ key: `auth:reset:email:${email.trim().toLowerCase().slice(0, 254)}`, limit: 5, windowMs: HOUR });
    }
    return rules;
  }
  if (path === "/sign-in/email") return [{ key: `auth:signin:${ip}`, limit: 10, windowMs: MINUTE }];
  return [];
}
