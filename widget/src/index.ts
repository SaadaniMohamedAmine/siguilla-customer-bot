/* Sigilla widget v1 — zéro dépendance. Intégration :
   <script src="https://<app>/widget/v1.js" data-bot="pk_xxx" async></script> */
type Cite = { index: number; title: string; url: string | null; pageNumber: number | null };
type Msg = {
  id?: string;
  role: "visitor" | "bot" | "agent" | "system";
  content: string;
  citations?: Cite[];
  fallback?: boolean;
  createdAt?: string;
};
type Cfg = {
  color: string;
  theme: "dark" | "light";
  position: "right" | "left";
  headerStyle: "subtle" | "bold";
  displayName: string;
  subtitle: string;
  avatarUrl: string | null;
  welcome: string;
  placeholder: string;
  suggestions: string[];
  tooltip: string | null;
};

(() => {
  const w = window as unknown as { __sigilla?: 1 };
  const script = document.currentScript as HTMLScriptElement | null;
  const pk = script?.dataset.bot;
  if (!pk || w.__sigilla) return;
  w.__sigilla = 1;
  const api = new URL(script!.src).origin + "/api/public/v1/";
  const preview = script!.dataset.preview === "true";
  const fr = (navigator.language || "en").toLowerCase().startsWith("fr");
  const T = fr
    ? {
        open: "Ouvrir l'assistant",
        close: "Fermer",
        send: "Envoyer",
        sealed: (n: number) => `Scellé par ${n} source${n > 1 ? "s" : ""}`,
        helpful: "Utile ?",
        human: "Parler à un humain",
        email: "Votre email (facultatif)",
        joined: (n: string) => `${n} a rejoint la conversation`,
        resting: "Cet assistant se repose pour le moment.",
        restingSub: "Laissez votre email, l'équipe vous répondra personnellement.",
        leave: "Laisser un message",
        online: "En ligne",
        err: "Un souci de connexion. Réessayez.",
        sent: "Merci. L'équipe revient vers vous.",
        by: "Scellé par Sigilla",
      }
    : {
        open: "Open assistant",
        close: "Close",
        send: "Send",
        sealed: (n: number) => `Sealed by ${n} source${n > 1 ? "s" : ""}`,
        helpful: "Helpful?",
        human: "Talk to a human",
        email: "Your email (optional)",
        joined: (n: string) => `${n} joined`,
        resting: "This assistant is resting for now.",
        restingSub: "Please leave your email and the team will reply personally.",
        leave: "Leave a message",
        online: "Online",
        err: "Connection issue. Please try again.",
        sent: "Thank you. The team will be in touch.",
        by: "Sealed by Sigilla",
      };

  const store = (() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  })();
  const key = "sigilla:" + pk;
  const saved = (() => {
    try {
      return JSON.parse(store?.getItem(key) || "{}");
    } catch {
      return {};
    }
  })();
  const state = {
    visitorId:
      (saved.v as string) ||
      (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()),
    conversationId: (saved.c as string) || (null as string | null),
    status: "bot",
    agentName: "",
    busy: false,
    last: "",
    open: false,
    cfg: null as Cfg | null,
    badge: true,
  };
  const persist = () => {
    try {
      store?.setItem(key, JSON.stringify({ v: state.visitorId, c: state.conversationId }));
    } catch {}
  };
  persist();

  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map((x) => {
      x /= 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const esc = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
    );

  const host = document.createElement("div");
  host.style.cssText = "all:initial;position:fixed;z-index:2147483000;bottom:20px";
  const root = host.attachShadow({ mode: "open" });
  document.body.appendChild(host);

  const contrast = (l1: number, l2: number) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const css = (c: Cfg) => {
    const dark = c.theme === "dark";
    const bgLum = lum(c.color);
    const on = contrast(bgLum, lum("#1A1214")) >= contrast(bgLum, lum("#FFFFFF")) ? "#1A1214" : "#FFFFFF";
    return `:host{--a:${c.color};--o:${on};--bg:${dark ? "#171113" : "#FFFFFF"};--r:${dark ? "#201719" : "#F4EDE8"};--b:${dark ? "#2E2225" : "#E8DED8"};--t:${dark ? "#F3ECE6" : "#1A1214"};--m:${dark ? "#A8999A" : "#6B5A5D"};--l:${dark ? "#E3B3BA" : "#8A2438"}}
*{box-sizing:border-box;margin:0;font:400 14px/1.5 "Instrument Sans",ui-sans-serif,system-ui,sans-serif}
button{cursor:pointer;border:0;background:none;color:inherit}
.l{width:56px;height:56px;border-radius:50%;background:var(--a);color:var(--o);font:400 26px/56px "Instrument Serif",Georgia,serif;text-align:center;box-shadow:0 16px 40px -12px #0009;transition:transform .2s}
.l:hover{transform:scale(1.04)}.l:focus-visible,button:focus-visible,textarea:focus-visible,input:focus-visible{outline:2px solid var(--l);outline-offset:2px}
.tt{position:absolute;bottom:68px;${c.position}:0;width:220px;padding:10px 12px;border-radius:8px;background:var(--r);color:var(--t);border:1px solid var(--b);font-size:13px}
.p{position:absolute;bottom:68px;${c.position}:0;width:380px;height:600px;max-height:calc(100vh - 100px);display:flex;flex-direction:column;border-radius:20px;background:var(--bg);color:var(--t);border:1px solid var(--b);box-shadow:0 16px 40px -12px #0009;overflow:hidden}
.p{transform-origin:bottom ${c.position};animation:pin .25s cubic-bezier(.16,1,.3,1) both}.p.out{animation:pout .18s ease-in both}@keyframes pin{from{opacity:0;transform:translateY(12px) scale(.96)}}@keyframes pout{to{opacity:0;transform:translateY(12px) scale(.96)}}
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
@keyframes fin{from{opacity:0}}@keyframes fout{to{opacity:0}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}.cur::after{animation:none!important}.p{animation-name:fin!important}.p.out{animation-name:fout!important}}`;
  };

  let feed: HTMLElement, input: HTMLTextAreaElement, panel: HTMLElement, launcher: HTMLButtonElement;
  const el = (h: string) => {
    const t = document.createElement("template");
    t.innerHTML = h.trim();
    return t.content.firstElementChild as HTMLElement;
  };

  // Certains modèles répondent avec des crochets pleine-largeur 【1】 au lieu de [1] : on
  // reconnaît les deux pour ne jamais laisser un marqueur de citation s'afficher brut.
  const renderText = (text: string, cites: Cite[] = []) => {
    const ok = new Set(cites.map((c) => c.index));
    return esc(text).replace(/\[(\d{1,2})\]|【(\d{1,2})】/g, (_, a, b) => {
      const n = a ?? b;
      return ok.has(+n) || !cites.length ? `<span class="sl" aria-label="Source ${n}">${n}</span>` : "";
    });
  };
  const sources = (cites: Cite[]) =>
    !cites.length
      ? ""
      : `<div class="src">${T.sealed(cites.length)}${cites
          .map((c) => {
            const lbl = esc(c.title + (c.pageNumber ? " — p." + c.pageNumber : ""));
            return c.url && /^https?:/.test(c.url)
              ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${c.index} · ${lbl}</a>`
              : `<span>${c.index} · ${lbl}</span>`;
          })
          .join("")}</div>`;

  const addMsg = (m: Msg) => {
    if (m.role === "system") {
      feed.appendChild(el(`<div class="sys">${esc(m.content)}</div>`));
      return;
    }
    const cls = m.role === "visitor" ? "v" : m.role === "agent" ? "ag" : "bt" + (m.fallback ? " fb" : "");
    const who = m.role === "agent" ? `<span class="w">${esc(state.agentName || "Team")}</span>` : "";
    const node = el(
      `<div class="m ${cls}">${who}${renderText(m.content, m.citations)}${m.role === "bot" ? sources(m.citations || []) : ""}</div>`,
    );
    if (m.role === "bot" && m.id && !m.fallback) node.appendChild(feedback(m.id));
    feed.appendChild(node);
    feed.scrollTop = feed.scrollHeight;
    if (m.createdAt) state.last = m.createdAt;
    return node;
  };

  const feedback = (id: string) => {
    const w = el(
      `<div class="fbk">${T.helpful} <button aria-pressed="false" aria-label="👍">👍</button><button aria-pressed="false" aria-label="👎">👎</button></div>`,
    );
    w.querySelectorAll("button").forEach((b, i) =>
      b.addEventListener("click", () => {
        w.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
        post("feedback", { pk, messageId: id, visitorId: state.visitorId, value: i ? "down" : "up" });
      }),
    );
    return w;
  };

  const post = (p: string, body: unknown) =>
    fetch(api + p, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  const handoffCard = () => {
    const c = el(
      `<div class="card"><input type="email" placeholder="${T.email}" aria-label="${T.email}"><button class="pr">${T.human}</button></div>`,
    );
    c.querySelector("button")!.addEventListener("click", async () => {
      const email = (c.querySelector("input") as HTMLInputElement).value.trim() || undefined;
      await post("handoff", { pk, conversationId: state.conversationId, visitorId: state.visitorId, email });
      c.remove();
      state.status = "handoff_requested";
      poll();
    });
    feed.appendChild(c);
    feed.scrollTop = feed.scrollHeight;
  };

  const resting = () => {
    panel
      .querySelector(".f")!
      .replaceWith(
        el(
          `<div class="rest"><h3>${T.resting}</h3><p>${T.restingSub}</p><input type="email" placeholder="${T.email}"><button class="pr">${T.leave}</button></div>`,
        ),
      );
    panel.querySelector(".i")?.remove();
  };

  async function ask(q: string) {
    if (state.busy || !q.trim()) return;
    state.busy = true;
    addMsg({ role: "visitor", content: q });
    input.value = "";
    const node = el(`<div class="m bt cur" aria-live="polite"></div>`);
    feed.appendChild(node);
    let text = "";
    try {
      const res = await post("chat", {
        pk,
        question: q,
        visitorId: state.visitorId,
        conversationId: state.conversationId,
        locale: navigator.language,
        pageUrl: location.href,
      });
      if (!res.ok || !res.body) {
        node.remove();
        addMsg({ role: "bot", content: T.err, fallback: true });
        state.busy = false;
        input?.focus();
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const line = buf.slice(0, i);
          buf = buf.slice(i + 2);
          if (!line.startsWith("data: ")) continue;
          const e = JSON.parse(line.slice(6));
          if (e.type === "meta") {
            state.conversationId = e.conversationId;
            persist();
          }
          if (e.type === "token") {
            text += e.value;
            node.innerHTML = renderText(text);
            feed.scrollTop = feed.scrollHeight;
          }
          if (e.type === "done") {
            node.remove();
            if (e.messageId)
              addMsg({
                role: "bot",
                id: e.messageId,
                content: text,
                citations: e.citations,
                fallback: e.fallback,
              });
            if (e.fallback) handoffCard();
          }
          if (e.type === "error") {
            node.remove();
            if (e.code === "quota_exceeded") resting();
            else addMsg({ role: "bot", content: T.err, fallback: true });
          }
        }
      }
    } catch {
      node.remove();
      addMsg({ role: "bot", content: T.err, fallback: true });
    }
    state.busy = false;
    input?.focus();
  }

  let timer = 0;
  async function poll() {
    if (!state.conversationId) return;
    try {
      const r = await fetch(
        `${api}conversations/${state.conversationId}/messages?pk=${pk}&visitorId=${state.visitorId}&after=${encodeURIComponent(state.last)}`,
      );
      if (r.ok) {
        const d = await r.json();
        if (d.agentName && d.agentName !== state.agentName) {
          state.agentName = d.agentName;
          addMsg({ role: "system", content: T.joined(d.agentName) });
        }
        state.status = d.status;
        d.messages.filter((m: Msg) => m.role === "agent").forEach(addMsg);
        d.messages.forEach((m: Msg) => {
          if (m.createdAt) state.last = m.createdAt;
        });
      }
    } catch {}
    clearTimeout(timer);
    if (state.open && (state.status === "handoff_requested" || state.status === "human"))
      timer = window.setTimeout(poll, 3000);
  }

  function openPanel(animate = true) {
    const c = state.cfg!;
    state.open = true;
    root.querySelectorAll(".p.out").forEach((n) => n.remove());
    root.querySelector(".tt")?.remove();
    const av = c.avatarUrl ? `<img src="${esc(c.avatarUrl)}" alt="">` : "S";
    panel = el(`<div class="p" role="dialog" aria-modal="true" aria-label="${esc(c.displayName)}">
      <div class="h"><div class="av">${av}</div><div><div class="n">${esc(c.displayName)}</div><div class="s"><span class="d"></span>${esc(c.subtitle || T.online)}</div></div><button class="x" aria-label="${T.close}">×</button></div>
      <div class="f" role="log" aria-live="polite"></div>
      <div class="i"><textarea rows="1" placeholder="${esc(c.placeholder)}" aria-label="${esc(c.placeholder)}"></textarea><button class="sd" aria-label="${T.send}">↑</button></div>
      ${state.badge ? `<div class="ft">${T.by}</div>` : ""}</div>`);
    if (!animate) panel.style.animation = "none";
    root.appendChild(panel);
    feed = panel.querySelector(".f")!;
    input = panel.querySelector("textarea")!;
    addMsg({ role: "bot", content: c.welcome });
    if (c.suggestions.length && !state.conversationId) {
      const chips = el(`<div class="chips"></div>`);
      c.suggestions.forEach((s) => {
        const b = el(`<button class="chip">${esc(s)}</button>`);
        b.addEventListener("click", () => {
          chips.remove();
          ask(s);
        });
        chips.appendChild(b);
      });
      feed.appendChild(chips);
    }
    panel.querySelector(".x")!.addEventListener("click", closePanel);
    panel.querySelector(".sd")!.addEventListener("click", () => ask(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        ask(input.value);
      }
    });
    panel.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePanel();
      if (e.key === "Tab") {
        // focus trap
        const f = [...panel.querySelectorAll<HTMLElement>("button,textarea,input,a[href]")];
        const first = f[0],
          last = f[f.length - 1];
        if (e.shiftKey && root.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && root.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    if (state.conversationId) {
      state.last = "";
      restore();
    }
    input.focus();
    if (!preview) post("events", { pk, type: "widget_open" });
  }

  async function restore() {
    try {
      const r = await fetch(
        `${api}conversations/${state.conversationId}/messages?pk=${pk}&visitorId=${state.visitorId}&after=`,
      );
      if (!r.ok) {
        state.conversationId = null;
        persist();
        return;
      }
      const d = await r.json();
      state.status = d.status;
      state.agentName = d.agentName || "";
      d.messages.forEach(addMsg);
      poll();
    } catch {}
  }

  function closePanel() {
    state.open = false;
    clearTimeout(timer);
    const p = panel;
    if (p) {
      p.classList.add("out");
      p.addEventListener("animationend", () => p.remove(), { once: true });
      setTimeout(() => p.remove(), 300);
    }
    launcher.focus();
  }

  function mount(c: Cfg) {
    state.cfg = c;
    root.innerHTML = `<style>${css(c)}</style>`;
    host.style[c.position === "left" ? "left" : "right"] = "20px";
    launcher = el(`<button class="l" aria-label="${T.open}">S</button>`) as HTMLButtonElement;
    launcher.addEventListener("click", () => (state.open ? closePanel() : openPanel()));
    root.appendChild(launcher);
    if (c.tooltip && !preview)
      setTimeout(() => {
        if (!state.open) root.appendChild(el(`<div class="tt">${esc(c.tooltip!)}</div>`));
      }, 4000);
  }

  fetch(api + "bots/" + pk + "/config")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d) {
        state.badge = d.badge;
        mount(d.config);
      }
    });

  // Aperçu live du dashboard : la page parente (même origine que l'app) pousse la config non sauvegardée.
  if (preview)
    window.addEventListener("message", (e) => {
      if (e.origin !== new URL(api).origin || e.data?.type !== "sigilla:config") return;
      const wasOpen = state.open;
      mount(e.data.config);
      if (wasOpen || e.data.open) openPanel(!wasOpen);
    });
})();
