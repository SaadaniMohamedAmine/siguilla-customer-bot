# Référence API

L'API publique est disponible avec les offres Pro et Team. Créez une clé dans Paramètres → Clés API.

## Authentification

Envoyez votre clé comme jeton Bearer :

```
Authorization: Bearer sk_live_xxxxxxxxxxxx
```

Les requêtes sont limitées à 60 par minute et par clé.

## `GET /api/v1/bots`

Liste les agents de votre organisation.

```bash
curl -H "Authorization: Bearer sk_live_xxx" https://your-app.example.com/api/v1/bots
```

## `POST /api/v1/chat`

```bash
curl -X POST https://your-app.example.com/api/v1/chat \
  -H "Authorization: Bearer sk_live_xxx" -H "Content-Type: application/json" \
  -d '{"botId":"...","question":"Livrez-vous en Suisse ?","stream":false}'
```

Avec `"stream": true` (valeur par défaut), la réponse est un flux Server-Sent Events, avec une ligne `data: {...}\n\n` par événement :

```ts
type StreamEvent =
  | { type: "meta"; conversationId: string; fallback: boolean; topScore: number | null }
  | { type: "token"; value: string }
  | {
      type: "done";
      messageId: string;
      citations: Citation[];
      fallback: boolean;
      provider: "groq" | "gemini" | null;
    }
  | { type: "error"; code: string };
```

Avec `"stream": false`, vous obtenez directement le résultat final :

```json
{ "data": { "conversationId": "...", "answer": "...", "citations": [...], "fallback": false } }
```

```js
const res = await fetch("https://your-app.example.com/api/v1/chat", {
  method: "POST",
  headers: { Authorization: "Bearer sk_live_xxx", "Content-Type": "application/json" },
  body: JSON.stringify({ botId: "...", question: "Livrez-vous en Suisse ?", stream: false }),
});
const { data } = await res.json();
```

## `GET /api/v1/conversations?botId=&limit=&cursor=`

Liste paginée, de la plus récente à la plus ancienne, sans les conversations du Playground.

## `GET /api/v1/conversations/[id]`

Historique complet des messages d'une conversation.

## Erreurs

Toutes les erreurs ont la même forme :

```json
{ "error": { "code": "invalid_api_key", "message": "This API key is invalid or revoked." } }
```
