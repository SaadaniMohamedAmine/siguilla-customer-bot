"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Icon } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";
import { SearchIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { DocSearchEntry } from "@/lib/docs";

function score(e: DocSearchEntry, terms: string[]) {
  const head = `${e.page} ${e.heading ?? ""}`.toLowerCase();
  const body = e.text.toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (head.includes(t)) s += e.heading ? 6 : 10;
    else if (body.includes(t)) s += 2;
    else return 0;
  }
  return s;
}

/** Palette de recherche locale (⌘K / Ctrl+K) sur l'index généré côté serveur à partir des pages Markdown. */
export function DocsSearch({ index, className }: { index: DocSearchEntry[]; className?: string }) {
  const t = useTranslations("Docs");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return index.filter((e) => e.heading === null).slice(0, 10);
    return index
      .map((e) => ({ e, s: score(e, terms) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((r) => r.e);
  }, [q, index]);

  function go(e: DocSearchEntry) {
    setOpen(false);
    router.push(`/docs/${e.slug}${e.id ? `#${e.id}` : ""}`);
  }

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setQ("");
          setActive(0);
        }
      }}
    >
      <DialogPrimitive.Trigger
        className={cn(
          "anim-keep border-border bg-surface text-text-muted hover:border-accent hover:text-text text-small flex w-full items-center gap-2 rounded-sm border px-3 py-2 transition-colors duration-200",
          className,
        )}
      >
        <Icon icon={SearchIcon} size={15} />
        <span className="flex-1 text-left">{t("search")}</span>
        <Kbd>⌘K</Kbd>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[2147483200] bg-black/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className="border-border bg-surface-raised fixed top-[14vh] left-1/2 z-[2147483201] w-[min(92vw,38rem)] -translate-x-1/2 overflow-hidden rounded-lg border shadow-[var(--shadow-lift)]"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              go(results[active]);
            }
          }}
        >
          <DialogPrimitive.Title className="sr-only">{t("search")}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{t("searchHint")}</DialogPrimitive.Description>
          <div className="border-border flex items-center gap-3 border-b px-4">
            <Icon icon={SearchIcon} size={18} className="text-text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              placeholder={t("searchPlaceholder")}
              aria-label={t("search")}
              className="text-body-lg text-text placeholder:text-text-muted h-14 w-full bg-transparent outline-none"
            />
            <Kbd>Esc</Kbd>
          </div>
          {results.length === 0 ? (
            <p className="text-body text-text-muted px-4 py-10 text-center">{t("noResults", { q })}</p>
          ) : (
            <ul ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
              {results.map((r, i) => (
                <li key={`${r.slug}-${r.id ?? "top"}`} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn(
                      "anim-keep flex w-full flex-col gap-0.5 rounded-sm px-3 py-2.5 text-left transition-colors duration-150",
                      i === active ? "bg-tint" : "hover:bg-surface",
                    )}
                  >
                    <span className="text-body text-text flex items-center gap-2">
                      {r.heading ? (
                        <>
                          <span className="text-text-muted">{r.page}</span>
                          <span aria-hidden className="text-text-muted">
                            /
                          </span>
                          {r.heading}
                        </>
                      ) : (
                        r.page
                      )}
                    </span>
                    <span className="text-small text-text-muted line-clamp-1">{r.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
