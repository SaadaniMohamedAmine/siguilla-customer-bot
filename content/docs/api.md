# API reference

The public API is available on Pro and Team. Create a key in Settings → API keys.

## Authentication

Send your key as a Bearer token:

```
Authorization: Bearer sk_live_xxxxxxxxxxxx
```

Requests are limited to 60 per minute per key.

## `GET /api/v1/bots`

Lists your organization's agents.

```bash
curl -H "Authorization: Bearer sk_live_xxx" https://your-app.example.com/api/v1/bots
```

## `POST /api/v1/chat`

```bash
curl -X POST https://your-app.example.com/api/v1/chat \
  -H "Authorization: Bearer sk_live_xxx" -H "Content-Type: application/json" \
  -d '{"botId":"...","question":"Do you ship to Switzerland?","stream":false}'
```

With `"stream": true` (the default), the response is Server-Sent Events, one `data: {...}\n\n` line per event:

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

With `"stream": false`, you get the final result directly:

```json
{ "data": { "conversationId": "...", "answer": "...", "citations": [...], "fallback": false } }
```

```js
const res = await fetch("https://your-app.example.com/api/v1/chat", {
  method: "POST",
  headers: { Authorization: "Bearer sk_live_xxx", "Content-Type": "application/json" },
  body: JSON.stringify({ botId: "...", question: "Do you ship to Switzerland?", stream: false }),
});
const { data } = await res.json();
```

## `GET /api/v1/conversations?botId=&limit=&cursor=`

Paginated list, newest first, excluding playground conversations.

## `GET /api/v1/conversations/[id]`

Full message history for one conversation.

## Errors

Every error has the same shape:

```json
{ "error": { "code": "invalid_api_key", "message": "This API key is invalid or revoked." } }
```
