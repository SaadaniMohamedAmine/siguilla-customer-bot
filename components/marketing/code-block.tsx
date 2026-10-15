"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { CheckIcon, CopyIcon } from "@/lib/icons";

const TOKEN =
  /(<!--[\s\S]*?-->|\/\/[^\n]*|#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[a-zA-Z][\w-]*|\b(?:const|let|var|return|await|async|function|import|from|export|if|else|new|curl|true|false|null)\b)|(\b\d+(?:\.\d+)?\b)/g;

/** Coloration légère (commentaires, chaînes, balises/mots-clés, nombres) avec les tokens du thème. */
function highlight(code: string, lang: string): React.ReactNode[] {
  if (lang === "text" || lang === "") return [code];
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of code.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    // « # » n'est un commentaire qu'en shell ; ailleurs on le laisse tel quel.
    if (m[1]?.startsWith("#") && lang !== "bash" && lang !== "sh") continue;
    if (i > last) out.push(code.slice(last, i));
    const cls = m[1] ? "text-text-muted italic" : m[2] ? "text-success" : m[3] ? "text-link" : "text-warning";
    out.push(
      <span key={k++} className={cls}>
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Common");
  const [copied, setCopied] = React.useState(false);

  const child = React.Children.toArray(children)[0] as React.ReactElement<{ className?: string; children?: React.ReactNode }> | undefined;
  const lang = /language-(\w+)/.exec(child?.props?.className ?? "")?.[1] ?? "";
  const code = String(child?.props?.children ?? "").replace(/\n$/, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* presse-papiers indisponible */
    }
  }

  return (
    <div className="border-border bg-surface mt-5 overflow-hidden rounded-md border">
      <div className="border-border bg-surface-raised flex items-center justify-between border-b px-4 py-1.5">
        <span className="text-text-muted font-mono text-[11px] tracking-[0.08em] uppercase">{lang || "code"}</span>
        <button
          type="button"
          onClick={copy}
          className="anim-keep text-text-muted hover:text-text inline-flex items-center gap-1.5 text-[11px] transition-colors duration-200"
        >
          <Icon icon={copied ? CheckIcon : CopyIcon} size={13} className={copied ? "text-success" : undefined} />
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
      <pre className="text-small overflow-x-auto p-4 leading-6">
        <code className="font-mono">{highlight(code, lang)}</code>
      </pre>
    </div>
  );
}
