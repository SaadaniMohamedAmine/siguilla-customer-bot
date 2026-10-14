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
