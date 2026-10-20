import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";

/**
 * Mot de passe partagé des comptes de test (`test1@`, `test2@`…), jamais écrit dans le dépôt.
 * Lu dans l'environnement, sinon dans `.env.local` : on ne lit QUE cette clé, pour ne pas charger le reste du
 * fichier (par exemple `STRIPE_SECRET_KEY`, qui activerait le test de facturation).
 */
export function testUsersPassword(): string | undefined {
  if (process.env.TEST_USERS_PASSWORD) return process.env.TEST_USERS_PASSWORD;
  if (!existsSync(".env.local")) return undefined;
  return parse(readFileSync(".env.local")).TEST_USERS_PASSWORD || undefined;
}

export const MISSING_PASSWORD_REASON = "TEST_USERS_PASSWORD is not set (see .env.example)";
