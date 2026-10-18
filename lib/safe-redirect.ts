/** Only same-site paths are allowed as a post-login destination (blocks open redirects). */
export function safeRedirect(raw: string | null, fallback = "/agents"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
