/** Petit wrapper fetch partagé : parse le JSON, lève avec `json.error` sur une réponse non-ok. */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "request_failed");
  return json.data as T;
}

/** Pour un `fetch` direct : construit l'erreur à lever depuis une réponse non-ok (`throw await responseError(res)`). */
export async function responseError(res: Response): Promise<Error> {
  const json = await res.json().catch(() => ({}));
  return new Error(json.error ?? "request_failed");
}

/**
 * Le client Better Auth ne lève pas d'exception : il renvoie `{ data, error }`.
 * Sans ce garde, une erreur serveur passe inaperçue et le composant affiche un faux succès.
 */
export function unwrapAuth<T>(res: { data: T | null; error: { message?: string } | null }): T {
  if (res.error) throw new Error(res.error.message || "request_failed");
  return res.data as T;
}
