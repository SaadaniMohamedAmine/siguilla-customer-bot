import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

/** Lazy : évite d'instancier au chargement du module (build) avec une clé absente. */
export class StripeNotConfiguredError extends Error {
  constructor() {
    super("STRIPE_SECRET_KEY is not set — add your Stripe test keys to .env.local before using billing.");
    this.name = "StripeNotConfiguredError";
  }
}

export function getStripe(): Stripe {
  if (!stripeSingleton) {
    if (!process.env.STRIPE_SECRET_KEY) throw new StripeNotConfiguredError();
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeSingleton;
}

/**
 * Configuration du portail client propre à Sigilla (changement d'offre Pro ↔ Team activé). Le compte Stripe est partagé
 * avec d'autres projets : on ne modifie jamais la configuration par défaut. Sans cette variable, Stripe retombe sur
 * la configuration par défaut (pas de changement d'offre).
 */
export function portalConfiguration(): { configuration?: string } {
  const id = process.env.STRIPE_PORTAL_CONFIG_ID;
  return id ? { configuration: id } : {};
}
