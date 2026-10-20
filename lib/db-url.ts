/**
 * `pg` traite déjà `sslmode=prefer|require|verify-ca` comme `verify-full` et l'annonce par un avertissement
 * à chaque démarrage à froid (« SECURITY WARNING… »). Écrire `verify-full` explicitement donne exactement le
 * même comportement sans l'avertissement.
 */
export function explicitSslMode(url: string | undefined): string | undefined {
  return url?.replace(/([?&]sslmode=)(prefer|require|verify-ca)(?=&|$)/i, "$1verify-full");
}
