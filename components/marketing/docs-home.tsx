import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/ui/icon";
import { AgentIcon, ArrowRightIcon, GlobeIcon, KeyIcon } from "@/lib/icons";
import { DOC_GROUPS, getDocSearchIndex, getDocTitle } from "@/lib/docs";
import { DocsSearch } from "@/components/marketing/docs-search";
import { ConciergeLink } from "@/components/marketing/concierge-link";

/** Page d'accueil de /docs : recherche, 3 cartes d'entrée, toutes les pages par thème, lien vers le concierge. */
export async function DocsHome() {
  const t = await getTranslations("Docs");
  const locale = await getLocale();
  const cards: { href: string; icon: IconSvgElement; title: string; body: string }[] = [
    { href: "/docs/getting-started", icon: AgentIcon, title: t("createTitle"), body: t("createBody") },
    { href: "/docs/embed", icon: GlobeIcon, title: t("embedTitle"), body: t("embedBody") },
    { href: "/docs/api", icon: KeyIcon, title: t("apiTitle"), body: t("apiBody") },
  ];
  return (
    <div className="page-in anim-keep min-w-0">
      <p className="label-caps text-link">{t("homeEyebrow")}</p>
      <h1 className="text-h1 text-text mt-3 max-w-2xl font-serif">{t("homeTitle")}</h1>
      <p className="text-body-lg text-text-muted mt-4 max-w-xl">{t("homeBody")}</p>

      <div className="mt-8 max-w-xl">
        <DocsSearch index={getDocSearchIndex(locale)} hotkey={false} className="py-3.5" />
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="anim-keep group border-border bg-surface hover:border-accent hover:shadow-[var(--shadow-lift)] flex flex-col rounded-md border p-5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1"
          >
            <Icon icon={c.icon} size={22} className="text-link" />
            <span className="text-h3 text-text mt-4 font-serif">{c.title}</span>
            <span className="text-body text-text-muted mt-2 flex-1">{c.body}</span>
            <span className="text-small text-link mt-5 inline-flex items-center gap-1.5">
              {t("open")}
              <Icon
                icon={ArrowRightIcon}
                size={14}
                className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
              />
            </span>
          </Link>
        ))}
      </div>

      <h2 className="text-h2 text-text mt-16 font-serif">{t("browseTitle")}</h2>
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        {DOC_GROUPS.map((g) => (
          <div key={g.key}>
            <p className="label-caps mb-3">{t(`groups.${g.key}`)}</p>
            <ul className="border-border flex flex-col border-l">
              {g.slugs.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/docs/${slug}`}
                    className="anim-keep text-body text-text-muted hover:text-text hover:border-accent -ml-px block border-l border-transparent py-1.5 pl-4 transition-colors duration-200"
                  >
                    {getDocTitle(slug, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-border bg-surface mt-16 flex flex-wrap items-center justify-between gap-4 rounded-md border p-5">
        <p className="text-body text-text-muted">{t("helpText")}</p>
        <ConciergeLink label={t("helpAction")} />
      </div>
    </div>
  );
}
