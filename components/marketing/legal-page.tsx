import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/icon";
import { ArrowRightIcon, SealIcon } from "@/lib/icons";
import { DocHeading } from "@/components/marketing/doc-heading";
import { DocsToc } from "@/components/marketing/docs-toc";

export type LegalSection = { id: string; title: string; content: React.ReactNode };

/** Gabarit commun Privacy / Terms : en-tête, résumé optionnel, sections numérotées avec ancres, sommaire vivant. */
export async function LegalPage({
  title,
  updated,
  intro,
  summary,
  sections,
  other,
}: {
  title: string;
  updated: string;
  intro: string;
  summary?: { title: string; items: string[] };
  sections: LegalSection[];
  other: { href: string; label: string };
}) {
  const t = await getTranslations("Legal");
  const td = await getTranslations("Docs");
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 xl:grid-cols-[minmax(0,1fr)_180px]">
      <div className="page-in anim-keep mx-auto w-full max-w-2xl min-w-0 xl:mx-0">
        <p className="label-caps text-link">{t("eyebrow")}</p>
        <h1 className="text-h1 text-text mt-3 font-serif">{title}</h1>
        <p className="text-small text-text-muted mt-3">
          {t("lastUpdated")}: {updated}
        </p>
        <p className="text-body-lg text-text-muted mt-6 leading-7">{intro}</p>

        {summary ? (
          <aside className="border-border bg-surface mt-8 rounded-md border p-5">
            <p className="text-text flex items-center gap-2 font-serif text-[18px]">
              <Icon icon={SealIcon} size={18} className="text-link" />
              {summary.title}
            </p>
            <ul className="text-body text-text-muted mt-3 flex flex-col gap-2">
              {summary.items.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span aria-hidden className="bg-accent mt-2.5 size-1 shrink-0 rotate-45" />
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        ) : null}

        <div className="text-body text-text-muted mt-4 flex flex-col leading-7">
          {sections.map((s, i) => (
            <section key={s.id}>
              <DocHeading
                level={3}
                id={s.id}
                prefix={<span className="text-link mr-3 font-serif text-[0.8em] italic">{String(i + 1).padStart(2, "0")}</span>}
              >
                {s.title}
              </DocHeading>
              <div className="mt-3">{s.content}</div>
            </section>
          ))}
        </div>

        <Link
          href={other.href}
          className="anim-keep group border-border hover:border-accent mt-16 flex items-center justify-between rounded-md border p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5"
        >
          <span>
            <span className="text-small text-text-muted block">{t("alsoRead")}</span>
            <span className="text-body-lg text-text mt-1 block font-serif">{other.label}</span>
          </span>
          <Icon
            icon={ArrowRightIcon}
            size={18}
            className="anim-keep text-text-muted transition-transform duration-200 group-hover:translate-x-1"
          />
        </Link>
      </div>

      <DocsToc headings={sections.map((s) => ({ id: s.id, text: s.title }))} title={td("onThisPage")} />
    </div>
  );
}
