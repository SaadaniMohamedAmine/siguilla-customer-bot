/** Cookie de session posé une fois le splash terminé : pas de splash aux chargements suivants. */
export const SPLASH_COOKIE = "sg_splash";

// Sites fictifs et aperçu du widget : rendus comme de vraies pages tierces, sans splash Sigilla.
const NO_SPLASH_PATHS = ["/atelier-lune", "/ledgerline", "/widget-preview"];

export function shouldShowSplash(pathname: string): boolean {
  return !NO_SPLASH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
