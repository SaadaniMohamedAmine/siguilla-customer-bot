import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

/** Lazy : évite d'instancier au chargement du module (build) avec une clé absente. */
export function getStripe(): Stripe {
  if (!stripeSingleton) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set — add your Stripe test keys to .env.local before using billing.",
      );
    }
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeSingleton;
}
