# Sigilla — Phase 4 : Widget embeddable

> **Fichier de délégation 4/8.** Spec complète, checklist et code de référence. Aucun aller-retour attendu. Si un point n'est pas couvert : option la plus simple compatible avec le PRD, notée dans `DECISIONS.md`.

---

## 0. À lire avant de commencer

- Règles non négociables : **§0 du fichier Phase 1**.
- PRD : §7 F5 (widget), §9 (perf, a11y, sécurité).
- Audit design : §3 (sceau de citation, en-tête du widget), §6 (le widget LOT 2 est la **référence pixel**).
- Écrans Stitch : `sigilla_embeddable_widget_showcase_all_8_states_light_variant` (**référence principale**), `sigilla_widget_designer_dark_light` (designer + preview).
- Code existant : `lib/rag/answer.ts`, `lib/rag/sse.ts`, `lib/rag/types.ts` (Phase 3).

**Prérequis :** Phases 1 à 3 terminées.

---

## 1. Spec de la phase

**Objectif :** le widget que les clients collent sur leur site avec **une ligne** : TypeScript vanilla, zéro dépendance, Shadow DOM, **≤ 5 KB gzip** (vérifié en CI), les 8 états du LOT 2, streaming SSE avec sceaux de citation, feedback, handoff côté visiteur, mode humain, quota. Plus : les endpoints publics sécurisés (origine, CORS, rate limit persistant), le **Widget designer** avec aperçu live, le snippet d'embed, et une page « site client » de démo (Atelier Lune).

**Répartition handoff :** cette phase livre le **côté visiteur** (bouton, email, passage en mode humain, polling des messages). La **réponse de l'agent humain**, « Resolve » et le déclenchement automatique sont en Phase 5.

**Rate limit :** `lib/rate-limit.ts` persistant (Neon) est livré **ici** (premier endpoint public). La Phase 6 le réutilise.

---

## 2. Checklist

- [ ] Source `widget/` TypeScript vanilla, zéro dépendance
- [ ] Build esbuild → `public/widget/v1.js` (IIFE, minifié)
- [ ] `size-limit` bloquant en CI (≤ 5 KB gzip)
- [ ] Shadow DOM (isolation CSS totale)
- [ ] Endpoint public de config de l'agent
- [ ] Chat SSE + rendu des citations
- [ ] `visitorId` persistant (localStorage avec try/catch)
- [ ] 8 états fidèles au LOT 2 (fermé, accueil, streaming, citations, fallback, mode humain, quota, mobile plein écran)
- [ ] Feedback 👍 / 👎 par réponse
- [ ] Sécurité : allowlist `Origin`, CORS, rate limit clé publique + IP
- [ ] A11y : focus trap, Esc, ARIA live, clavier, `reduced-motion`
- [ ] Contraste automatique du texte selon la couleur du client
- [ ] Widget designer (couleur, avatar, position, accueil, placeholder, badge, style d'en-tête)
- [ ] Aperçu live desktop / mobile dans le dashboard
- [ ] Snippet d'embed en une ligne + bouton copier
- [ ] Page de test « site client » Atelier Lune (démo + tests e2e)

---

## 3. Implémentation

### 3.1 Configuration du widget (stockée dans `Chatbot.widgetConfig`)

`lib/widget/config.ts` (partagé dashboard + endpoint public) :

```ts
import { z } from "zod";

export const WidgetConfig = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#9E2F45"),
  theme: z.enum(["dark", "light"]).default("dark"),
  position: z.enum(["right", "left"]).default("right"),
  headerStyle: z.enum(["subtle", "bold"]).default("subtle"),
  displayName: z.string().max(40).default("Concierge"),
  subtitle: z.string().max(60).default(""),
  avatarUrl: z.string().url().nullable().default(null),
  welcome: z.string().max(240).default("Good evening. How may I help you today?"),
  placeholder: z.string().max(80).default("Ask a question…"),
  suggestions: z.array(z.string().max(40)).max(3).default([]),
  tooltip: z.string().max(80).nullable().default(null),
  showBadge: z.boolean().default(true),
});
export type WidgetConfig = z.infer<typeof WidgetConfig>;
export const parseWidgetConfig = (raw: unknown): WidgetConfig => WidgetConfig.parse(raw ?? {});
```

### 3.2 Sécurité des endpoints publics

`lib/public/cors.ts` :

```ts
import { prisma } from "@/lib/db";

export function originAllowed(origin: string | null, allowedDomains: string[]): boolean {
  if (!origin) return false;
  let host: string;
  try { host = new URL(origin).host.toLowerCase(); } catch { return false; }
  const app = new URL(process.env.NEXT_PUBLIC_APP_URL!).host;
  if (host === app) return true;                                   // landing, preview, page démo
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) return process.env.NODE_ENV !== "production" || allowedDomains.some((d) => d.startsWith("localhost"));
  if (allowedDomains.length === 0) return true;                    // non restreint (le dashboard affiche un avertissement)
  const hostname = host.split(":")[0];
  return allowedDomains.some((d) => (d.startsWith("*.") ? hostname === d.slice(2) || hostname.endsWith(d.slice(1)) : hostname === d));
}

export function corsHeaders(origin: string | null): HeadersInit {
  return origin
    ? {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
        vary: "Origin",
      }
    : {};
}

export async function loadPublicBot(publicKey: string) {
  return prisma.chatbot.findUnique({
    where: { publicKey },
    include: { organization: { select: { id: true, plan: true, isDemo: true } } },
  });
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "0.0.0.0";
}
```

`lib/rate-limit.ts` — **persistant (Neon), même signature qu'Excerpta** :

```ts
import { prisma } from "@/lib/db";

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

/** Fenêtre fixe atomique. Purge paresseuse des lignes expirées (1 fois sur 50) — aucun cron. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + (${windowMs} * interval '1 millisecond'))
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimitBucket"."resetAt" < now() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" < now() THEN now() + (${windowMs} * interval '1 millisecond') ELSE "RateLimitBucket"."resetAt" END
    RETURNING "count", "resetAt"`;
  if (Math.random() < 0.02) {
    prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "resetAt" < now() - interval '1 hour'`.catch(() => {});
  }
  const { count, resetAt } = rows[0];
  return count <= limit
    ? { ok: true, retryAfterSeconds: 0 }
    : { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000)) };
}
```

Limites publiques (constantes dans `lib/public/limits.ts`) : chat **20 messages / minute par `pk + IP`**, **200 / jour par `pk + IP`**, config **60 / minute par IP**, feedback/events **60 / minute par IP**.

### 3.3 Endpoints publics — `app/api/public/v1/…`

Chaque route : `export async function OPTIONS(req)` → 204 avec `corsHeaders(origin)` si `originAllowed`, sinon 403. Toutes les réponses incluent `corsHeaders`. Aucune session requise. **Jamais** exposer d'id d'organisation, d'email, de chunk complet.

| Route | Comportement |
|---|---|
| `GET bots/[pk]/config` | 404 si bot inconnu ou `status !== "live"` (sauf si l'origine est l'app elle-même → permet la preview des brouillons). Renvoie `{ config, badge: !limits.removeBadge \|\| config.showBadge, name }` + `cache-control: public, max-age=60, stale-while-revalidate=600` |
| `POST chat` | Body `{ pk, question, visitorId, conversationId?, locale?, pageUrl? }` (Zod : `visitorId` 8–64 car. `[\w-]`). Ordre : origine → rate limit (minute puis jour) → `assertWithinQuota(org.id)` (si dépassé, renvoie un SSE avec `{type:"error",code:"quota_exceeded"}`) → `answer({ channel: "widget", country: req.headers.get("x-vercel-ip-country") })` → `sseResponse(events, { headers: corsHeaders })`. Après un `done` non-fallback : `incrementMessageUsage(org.id)` (Phase 6). `maxDuration = 60` |
| `POST feedback` | `{ pk, messageId, visitorId, value: "up" \| "down" }` — vérifie que le message appartient à une conversation de ce bot **et** de ce visiteur ; met à jour `Message.feedback` ; crée `AnalyticsEvent{type:"feedback", metadata:{value}}` |
| `POST events` | `{ pk, type: "widget_open" }` uniquement → `AnalyticsEvent` |
| `POST handoff` | `{ pk, conversationId, visitorId, email? }` → `status: "handoff_requested"`, `visitorEmail` (Zod email optionnel), message `system` « Handoff requested », `AnalyticsEvent{type:"handoff"}` |
| `GET conversations/[id]/messages?pk=&visitorId=&after=` | Vérifie appartenance (bot + visiteur). Renvoie `{ status, agentName, messages: [{ id, role, content, citations, fallback, createdAt }] }` créés après `after` (ISO), **uniquement les rôles `visitor`, `bot` et `agent`** (les messages `system` sont des codes internes, jamais envoyés au widget). Sert à **restaurer l'historique** à l'ouverture et au **polling** en mode humain. `cache-control: no-store` |

### 3.4 Le widget — `widget/`

Arborescence :

```
widget/
  tsconfig.json        # strict, target ES2019, lib ["DOM","ES2019"], noEmit
  build.mjs
  src/index.ts         # point d'entrée unique (le code ci-dessous)
```

`widget/build.mjs` :

```js
import { build } from "esbuild";
await build({
  entryPoints: ["widget/src/index.ts"],
  outfile: "public/widget/v1.js",
  bundle: true, minify: true, format: "iife", target: ["es2019"],
  legalComments: "none", sourcemap: false, treeShaking: true,
  define: { "process.env.NODE_ENV": '"production"' },
});
console.log("[widget] built public/widget/v1.js");
```

`package.json` :

```json
{
  "scripts": {
    "build:widget": "node widget/build.mjs",
    "build": "npm run build:widget && next build",
    "size": "npm run build:widget && size-limit"
  },
  "size-limit": [{ "path": "public/widget/v1.js", "limit": "5 KB", "gzip": true }]
}
```

```bash
npm install -D esbuild size-limit @size-limit/file
```

Ajoute `public/widget/` au `.gitignore` (généré au build). Vercel exécute `npm run build` → le widget est construit à chaque déploiement.

En-têtes pour le script (dans `next.config.ts` → `headers()`) :

```ts
{ source: "/widget/:path*", headers: [
  { key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=86400" },
  { key: "Access-Control-Allow-Origin", value: "*" },
  { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
] }
```

`widget/src/index.ts` — implémentation de référence (respecte la logique ; l'agent peut ajuster le markup/CSS pour coller pixel près au LOT 2 **tant que `npm run size` passe**) :

```ts
/* Sigilla widget v1 — zéro dépendance. Intégration :
   <script src="https://<app>/widget/v1.js" data-bot="pk_xxx" async></script> */
type Cite = { index: number; title: string; url: string | null; pageNumber: number | null };
type Msg = { id?: string; role: "visitor" | "bot" | "agent" | "system"; content: string; citations?: Cite[]; fallback?: boolean; createdAt?: string };
type Cfg = { color: string; theme: "dark" | "light"; position: "right" | "left"; headerStyle: "subtle" | "bold"; displayName: string;
  subtitle: string; avatarUrl: string | null; welcome: string; placeholder: string; suggestions: string[]; tooltip: string | null };

(() => {
  const script = document.currentScript as HTMLScriptElement | null;
  const pk = script?.dataset.bot;
  if (!pk || (window as any).__sigilla) return;
  (window as any).__sigilla = 1;
  const api = new URL(script!.src).origin + "/api/public/v1/";
  const preview = script!.dataset.preview === "true";
  const fr = (navigator.language || "en").toLowerCase().startsWith("fr");
  const T = fr
    ? { open: "Ouvrir l'assistant", close: "Fermer", send: "Envoyer", sealed: (n: number) => `Scellé par ${n} source${n > 1 ? "s" : ""}`,
        helpful: "Utile ?", human: "Parler à un humain", email: "Votre email (facultatif)", joined: (n: string) => `${n} a rejoint la conversation`,
        resting: "Cet assistant se repose pour le moment.", restingSub: "Laissez votre email, l'équipe vous répondra personnellement.", leave: "Laisser un message",
        online: "En ligne", err: "Un souci de connexion. Réessayez.", sent: "Merci. L'équipe revient vers vous.", by: "Scellé par Sigilla" }
    : { open: "Open assistant", close: "Close", send: "Send", sealed: (n: number) => `Sealed by ${n} source${n > 1 ? "s" : ""}`,
        helpful: "Helpful?", human: "Talk to a human", email: "Your email (optional)", joined: (n: string) => `${n} joined`,
        resting: "This assistant is resting for now.", restingSub: "Please leave your email and the team will reply personally.", leave: "Leave a message",
        online: "Online", err: "Connection issue. Please try again.", sent: "Thank you. The team will be in touch.", by: "Sealed by Sigilla" };

  const store = (() => { try { return window.localStorage; } catch { return null; } })();
  const key = "sigilla:" + pk;
  const saved = (() => { try { return JSON.parse(store?.getItem(key) || "{}"); } catch { return {}; } })();
  const state = {
    visitorId: (saved.v as string) || (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()),
    conversationId: (saved.c as string) || null as string | null,
    status: "bot", agentName: "", busy: false, last: "", open: false, cfg: null as Cfg | null, badge: true,
  };
  const persist = () => { try { store?.setItem(key, JSON.stringify({ v: state.visitorId, c: state.conversationId })); } catch {} };
  persist();

  const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

  const host = document.createElement("div");
  host.style.cssText = "all:initial;position:fixed;z-index:2147483000;bottom:20px";
  const root = host.attachShadow({ mode: "open" });
  document.body.appendChild(host);

  const css = (c: Cfg) => {
    const dark = c.theme === "dark";
    const on = lum(c.color) > 0.4 ? "#1A1214" : "#F3ECE6";
    return `:host{--a:${c.color};--o:${on};--bg:${dark ? "#171113" : "#FFFFFF"};--r:${dark ? "#201719" : "#F4EDE8"};--b:${dark ? "#2E2225" : "#E8DED8"};--t:${dark ? "#F3ECE6" : "#1A1214"};--m:${dark ? "#A8999A" : "#6B5A5D"};--l:${dark ? "#E3B3BA" : "#8A2438"}}
*{box-sizing:border-box;margin:0;font:400 14px/1.5 "Instrument Sans",ui-sans-serif,system-ui,sans-serif}
button{cursor:pointer;border:0;background:none;color:inherit}
.l{width:56px;height:56px;border-radius:50%;background:var(--a);color:var(--o);font:400 26px/56px "Instrument Serif",Georgia,serif;text-align:center;box-shadow:0 16px 40px -12px #0009;transition:transform .2s}
.l:hover{transform:scale(1.04)}.l:focus-visible,button:focus-visible,textarea:focus-visible,input:focus-visible{outline:2px solid var(--l);outline-offset:2px}
.tt{position:absolute;bottom:68px;${c.position}:0;width:220px;padding:10px 12px;border-radius:8px;background:var(--r);color:var(--t);border:1px solid var(--b);font-size:13px}
.p{position:absolute;bottom:68px;${c.position}:0;width:380px;height:600px;max-height:calc(100vh - 100px);display:flex;flex-direction:column;border-radius:20px;background:var(--bg);color:var(--t);border:1px solid var(--b);box-shadow:0 16px 40px -12px #0009;overflow:hidden}
.h{display:flex;gap:10px;align-items:center;padding:14px 16px;border-bottom:1px solid var(--b)${c.headerStyle === "bold" ? ";background:var(--a);color:var(--o)" : ""}}
.av{width:32px;height:32px;border-radius:8px;background:var(--a);color:var(--o);font:400 18px/32px "Instrument Serif",serif;text-align:center;overflow:hidden;flex:none}.av img{width:100%;height:100%;object-fit:cover}
.n{font-weight:600;font-size:14px}.s{font-size:12px;opacity:.75}.d{display:inline-block;width:6px;height:6px;border-radius:50%;background:#6FBF8E;margin-right:6px}
.x{margin-left:auto;width:28px;height:28px;border-radius:6px;font-size:18px}
.f{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
.m{max-width:85%;padding:10px 12px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}
.v{align-self:flex-end;background:var(--r)}.bt,.ag{align-self:flex-start;background:var(--bg);border:1px solid var(--b)}
.fb{font-style:italic;color:var(--m)}.ag .w{display:block;font-size:11px;color:var(--m);margin-bottom:2px}
.sys{align-self:center;font-size:11px;color:var(--m);text-transform:uppercase;letter-spacing:.08em}
.sl{display:inline-block;min-width:16px;height:16px;padding:0 3px;margin:0 2px;border-radius:9px;background:var(--a);color:var(--o);font:500 10px/16px ui-monospace,monospace;text-align:center;vertical-align:1px}
.src{margin-top:8px;padding-top:8px;border-top:1px solid var(--b);font-size:12px;color:var(--m)}.src a,.src span{color:var(--l);text-decoration:none;display:block}
.fbk{margin-top:6px;font-size:11px;color:var(--m)}.fbk button{padding:2px 6px;border-radius:4px}.fbk button[aria-pressed=true]{color:var(--l)}
.chips{display:flex;flex-wrap:wrap;gap:6px}.chip{padding:6px 10px;border:1px solid var(--b);border-radius:999px;font-size:12px}
.card{border:1px solid var(--b);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px}
input,textarea{width:100%;background:var(--r);color:var(--t);border:1px solid var(--b);border-radius:8px;padding:9px 10px;resize:none}
.pr{background:var(--a);color:var(--o);border-radius:8px;padding:9px 12px;font-weight:500}
.i{display:flex;gap:8px;padding:12px;border-top:1px solid var(--b);align-items:flex-end}.i textarea{max-height:96px}
.sd{width:38px;height:38px;border-radius:8px;background:var(--a);color:var(--o);flex:none;font-size:18px}
.ft{text-align:center;font-size:11px;color:var(--m);padding:0 0 8px}
.rest{flex:1;display:flex;flex-direction:column;justify-content:center;gap:12px;padding:24px;text-align:center}.rest h3{font:400 24px/1.2 "Instrument Serif",serif}
.cur::after{content:"▍";animation:b 1s steps(1) infinite;color:var(--l)}@keyframes b{50%{opacity:0}}
@media (max-width:480px){.p{position:fixed;inset:0;width:100%;height:100%;max-height:none;border-radius:0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;
  };

  let feed: HTMLElement, input: HTMLTextAreaElement, panel: HTMLElement, launcher: HTMLButtonElement;
  const el = (h: string) => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstElementChild as HTMLElement; };

  const renderText = (text: string, cites: Cite[] = []) => {
    const ok = new Set(cites.map((c) => c.index));
    return esc(text).replace(/\[(\d{1,2})\]/g, (_, n) => (ok.has(+n) || !cites.length ? `<span class="sl" aria-label="Source ${n}">${n}</span>` : ""));
  };
  const sources = (cites: Cite[]) => !cites.length ? "" :
    `<div class="src">${T.sealed(cites.length)}${cites.map((c) => { const lbl = esc(c.title + (c.pageNumber ? " — p." + c.pageNumber : "")); return c.url && /^https?:/.test(c.url) ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${c.index} · ${lbl}</a>` : `<span>${c.index} · ${lbl}</span>`; }).join("")}</div>`;

  const addMsg = (m: Msg) => {
    if (m.role === "system") { feed.appendChild(el(`<div class="sys">${esc(m.content)}</div>`)); return; }
    const cls = m.role === "visitor" ? "v" : m.role === "agent" ? "ag" : "bt" + (m.fallback ? " fb" : "");
    const who = m.role === "agent" ? `<span class="w">${esc(state.agentName || "Team")}</span>` : "";
    const node = el(`<div class="m ${cls}">${who}${renderText(m.content, m.citations)}${m.role === "bot" ? sources(m.citations || []) : ""}</div>`);
    if (m.role === "bot" && m.id && !m.fallback) node.appendChild(feedback(m.id));
    feed.appendChild(node); feed.scrollTop = feed.scrollHeight; if (m.createdAt) state.last = m.createdAt;
    return node;
  };

  const feedback = (id: string) => {
    const w = el(`<div class="fbk">${T.helpful} <button aria-pressed="false" aria-label="👍">👍</button><button aria-pressed="false" aria-label="👎">👎</button></div>`);
    w.querySelectorAll("button").forEach((b, i) => b.addEventListener("click", () => {
      w.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true");
      post("feedback", { pk, messageId: id, visitorId: state.visitorId, value: i ? "down" : "up" });
    }));
    return w;
  };

  const post = (p: string, body: unknown) => fetch(api + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  const handoffCard = () => {
    const c = el(`<div class="card"><input type="email" placeholder="${T.email}" aria-label="${T.email}"><button class="pr">${T.human}</button></div>`);
    c.querySelector("button")!.addEventListener("click", async () => {
      const email = (c.querySelector("input") as HTMLInputElement).value.trim() || undefined;
      await post("handoff", { pk, conversationId: state.conversationId, visitorId: state.visitorId, email });
      c.remove(); state.status = "handoff_requested"; poll();
    });
    feed.appendChild(c); feed.scrollTop = feed.scrollHeight;
  };

  const resting = () => {
    panel.querySelector(".f")!.replaceWith(el(`<div class="rest"><h3>${T.resting}</h3><p>${T.restingSub}</p><input type="email" placeholder="${T.email}"><button class="pr">${T.leave}</button></div>`));
    panel.querySelector(".i")?.remove();
  };

  async function ask(q: string) {
    if (state.busy || !q.trim()) return;
    state.busy = true; addMsg({ role: "visitor", content: q }); input.value = "";
    const node = el(`<div class="m bt cur" aria-live="polite"></div>`); feed.appendChild(node);
    let text = "";
    try {
      const res = await post("chat", { pk, question: q, visitorId: state.visitorId, conversationId: state.conversationId, locale: navigator.language, pageUrl: location.href });
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let buf = "";
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); let i: number;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const line = buf.slice(0, i); buf = buf.slice(i + 2);
          if (!line.startsWith("data: ")) continue;
          const e = JSON.parse(line.slice(6));
          if (e.type === "meta") { state.conversationId = e.conversationId; persist(); }
          if (e.type === "token") { text += e.value; node.innerHTML = renderText(text); feed.scrollTop = feed.scrollHeight; }
          if (e.type === "done") {
            node.remove();
            if (e.messageId) addMsg({ role: "bot", id: e.messageId, content: text, citations: e.citations, fallback: e.fallback });
            if (e.fallback) handoffCard();
          }
          if (e.type === "error") { node.remove(); if (e.code === "quota_exceeded") resting(); else addMsg({ role: "bot", content: T.err, fallback: true }); }
        }
      }
    } catch { node.remove(); addMsg({ role: "bot", content: T.err, fallback: true }); }
    state.busy = false; input?.focus();
  }

  let timer = 0;
  async function poll() {
    if (!state.conversationId) return;
    try {
      const r = await fetch(`${api}conversations/${state.conversationId}/messages?pk=${pk}&visitorId=${state.visitorId}&after=${encodeURIComponent(state.last)}`);
      if (r.ok) {
        const d = await r.json();
        if (d.agentName && d.agentName !== state.agentName) { state.agentName = d.agentName; addMsg({ role: "system", content: T.joined(d.agentName) }); }
        state.status = d.status;
        d.messages.filter((m: Msg) => m.role === "agent").forEach(addMsg);
        d.messages.forEach((m: Msg) => { if (m.createdAt) state.last = m.createdAt; });
      }
    } catch {}
    clearTimeout(timer);
    if (state.open && (state.status === "handoff_requested" || state.status === "human")) timer = window.setTimeout(poll, 3000);
  }

  function openPanel() {
    const c = state.cfg!; state.open = true;
    root.querySelector(".tt")?.remove();
    const av = c.avatarUrl ? `<img src="${esc(c.avatarUrl)}" alt="">` : "S";
    panel = el(`<div class="p" role="dialog" aria-modal="true" aria-label="${esc(c.displayName)}">
      <div class="h"><div class="av">${av}</div><div><div class="n">${esc(c.displayName)}</div><div class="s"><span class="d"></span>${esc(c.subtitle || T.online)}</div></div><button class="x" aria-label="${T.close}">×</button></div>
      <div class="f" role="log" aria-live="polite"></div>
      <div class="i"><textarea rows="1" placeholder="${esc(c.placeholder)}" aria-label="${esc(c.placeholder)}"></textarea><button class="sd" aria-label="${T.send}">↑</button></div>
      ${state.badge ? `<div class="ft">${T.by}</div>` : ""}</div>`);
    root.appendChild(panel);
    feed = panel.querySelector(".f")!; input = panel.querySelector("textarea")!;
    addMsg({ role: "bot", content: c.welcome });
    if (c.suggestions.length && !state.conversationId) {
      const chips = el(`<div class="chips"></div>`);
      c.suggestions.forEach((s) => { const b = el(`<button class="chip">${esc(s)}</button>`); b.addEventListener("click", () => { chips.remove(); ask(s); }); chips.appendChild(b); });
      feed.appendChild(chips);
    }
    panel.querySelector(".x")!.addEventListener("click", closePanel);
    panel.querySelector(".sd")!.addEventListener("click", () => ask(input.value));
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
    panel.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePanel();
      if (e.key === "Tab") { // focus trap
        const f = [...panel.querySelectorAll<HTMLElement>("button,textarea,input,a[href]")]; const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && root.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && root.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    if (state.conversationId) { state.last = ""; restore(); }
    input.focus();
    if (!preview) post("events", { pk, type: "widget_open" });
  }

  async function restore() {
    try {
      const r = await fetch(`${api}conversations/${state.conversationId}/messages?pk=${pk}&visitorId=${state.visitorId}&after=`);
      if (!r.ok) { state.conversationId = null; persist(); return; }
      const d = await r.json(); state.status = d.status; state.agentName = d.agentName || "";
      d.messages.forEach(addMsg); poll();
    } catch {}
  }

  function closePanel() { state.open = false; panel?.remove(); clearTimeout(timer); launcher.focus(); }

  function mount(c: Cfg) {
    state.cfg = c; root.innerHTML = `<style>${css(c)}</style>`;
    host.style[c.position === "left" ? "left" : "right"] = "20px";
    launcher = el(`<button class="l" aria-label="${T.open}">S</button>`) as HTMLButtonElement;
    launcher.addEventListener("click", () => (state.open ? closePanel() : openPanel()));
    root.appendChild(launcher);
    if (c.tooltip && !preview) setTimeout(() => { if (!state.open) root.appendChild(el(`<div class="tt">${esc(c.tooltip!)}</div>`)); }, 4000);
  }

  fetch(api + "bots/" + pk + "/config").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) { state.badge = d.badge; mount(d.config); } });

  // Aperçu live du dashboard : la page parente (même origine que l'app) pousse la config non sauvegardée.
  if (preview) window.addEventListener("message", (e) => {
    if (e.origin !== new URL(api).origin || e.data?.type !== "sigilla:config") return;
    const wasOpen = state.open; mount(e.data.config); if (wasOpen || e.data.open) openPanel();
  });
})();
```

> **Budget taille :** si `npm run size` dépasse 5 KB gzip, réduire dans cet ordre : simplifier le CSS (fusionner des règles), raccourcir les chaînes FR/EN, retirer le tooltip. Ne jamais ajouter de dépendance.

### 3.5 Designer & aperçu live — dashboard

Page `app/(app)/agents/[id]/widget/page.tsx`. Référence : `sigilla_widget_designer_dark_light`, corrigée selon l'audit (§4.2 copy, §3 en-tête).

**Gauche (40 %) — réglages** (labels sobres, pas de jargon : « Appearance », « Identity », « Messages », « Branding », « Allowed domains ») :
- APPEARANCE : 6 pastilles de couleur (`#9E2F45` par défaut, `#1A1214`, `#2F7A4D`, `#1F3A5F`, `#5B3A6B`, `#8A5A12`) + input hex validé ; Theme Dark/Light ; Position Bottom right/left (segmented) ; Header style Subtle/Bold.
- IDENTITY : avatar (URL d'image ou « S » par défaut ; upload via Vercel Blob `access: "public"`, ≤ 512 KB, PNG/JPG/WebP), Display name, Subtitle.
- MESSAGES : Welcome message, Input placeholder, jusqu'à 3 suggestions (chips), tooltip du launcher (optionnel).
- BRANDING : switch « Show “Sealed by Sigilla” » — **désactivé en Free** avec note « Available on Pro ».
- ALLOWED DOMAINS : chips (ex. `atelierlune.com`, `*.atelierlune.com`) ; si vide, bandeau `warning` « Your widget can be embedded on any website. Add your domains to restrict it. »
- Footer sticky : « Discard » (ghost) + « Publish changes » (primary) → `PATCH /api/chatbots/[id]` avec `widgetConfig` validé par `WidgetConfig` et `status: "live"`.

**Droite (60 %) — aperçu live** :
- Toggle Desktop / Mobile ; bouton « Copy embed code ».
- `iframe` vers `/widget-preview?pk=<publicKey>` (page Next.js **dans l'app**, hors `(app)` mais protégée par session) qui affiche une maquette de site client neutre (fond clair élégant) et charge `<script src="/widget/v1.js" data-bot="pk" data-preview="true">`.
- À chaque changement de réglage (debounce 150 ms) : `iframe.contentWindow.postMessage({ type: "sigilla:config", config, open: true }, origin)`.
- Mode Mobile : iframe 390×844 dans un cadre de téléphone fin (bordure hairline, rayon 44px).

**Snippet** — composant `EmbedSnippet` (réutilisé en Phase 5) :

```html
<script src="https://<NEXT_PUBLIC_APP_URL host>/widget/v1.js" data-bot="pk_xxx" async></script>
```

Bloc `font-mono text-small bg-surface-raised border-border rounded-sm p-4`, bouton `CopyIcon` → toast « Copied ».

### 3.6 Page « site client » de démo — `/atelier-lune`

`app/atelier-lune/page.tsx` (publique, hors auth, `robots: noindex`) : boutique fictive **Atelier Lune** (bougies & parfums d'intérieur), style clair et luxueux (fond `#FAF6F2`, titres serif, 1 visuel produit sobre en CSS/SVG — **pas d'image externe**), header « ATELIER LUNE », une fiche produit « Bougie Cuir & Encens Noir — CHF 145 », bandeau « Illustrative brand — Sigilla demo ». Charge le widget avec la clé `NEXT_PUBLIC_LANDING_BOT_KEY` de l'agent Atelier Lune du seed (Phase 7 ; en attendant, utilise la clé d'un agent de test). Sert aux **tests e2e** et à la démo recruteur.

---

## 4. Critères d'acceptation

- [ ] `npm run size` → **≤ 5 KB gzip** (afficher la valeur dans `DECISIONS.md`).
- [ ] Collé dans une page HTML statique servie sur un autre port (`npx serve`), le widget s'affiche, n'hérite d'**aucun** style de la page (tester avec une page qui met `* { font-family: Comic Sans; color: red }`) et n'en modifie aucun.
- [ ] Les 8 états du LOT 2 sont reproduits (captures dans la PR/commit) : fermé + tooltip, accueil + suggestions, streaming avec curseur, réponse avec sceaux + « Sealed by N sources » + liens, fallback + carte handoff, mode humain (divider « X joined » + message agent), quota (« This assistant is resting for now. »), mobile plein écran < 480px.
- [ ] Rechargement de page → la conversation est restaurée (localStorage + endpoint messages). Navigation privée (localStorage bloqué) → le widget fonctionne quand même.
- [ ] Origine non autorisée (domaine hors liste) → `OPTIONS`/`POST` refusés (403), le widget ne se monte pas.
- [ ] 21 messages en 1 minute depuis la même IP → 21e refusé (événement `rate_limited`).
- [ ] Clavier seul : Tab atteint le launcher, Entrée ouvre, focus piégé dans le panneau, Échap ferme et rend le focus au launcher ; lecteur d'écran annonce les réponses (aria-live).
- [ ] Couleur client claire (ex. `#E0B05C`) → texte du launcher/boutons en encre `#1A1214` (contraste auto).
- [ ] Designer : chaque réglage se reflète dans l'aperçu en < 200 ms sans recharger ; « Publish » persiste et le widget réel reflète la config (cache 60 s max).
- [ ] Feedback 👍/👎 enregistré sur le bon message ; un visiteur ne peut pas noter le message d'un autre visiteur.
- [ ] Aucune donnée sensible dans les réponses publiques (pas d'org id, pas d'email, pas de chunk complet).
- [ ] Lint, typecheck, build OK ; textes EN/FR (dashboard) ; aucune Material Symbol.

## 5. Fin de phase
1. Coche les 16 tâches « Phase 5 (P4) » dans `PROGRESS.md` ; recalcule le tableau.
2. `DECISIONS.md` : taille gzip finale, éventuels écarts.
3. Commit `chore: complete phase 4 (embeddable widget)`.
