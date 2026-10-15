import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DOCS_ORDER, getDocTitle, getDocContent, getDocHeadings, slugifyHeading } from "@/lib/docs";
import { CodeBlock } from "@/components/marketing/code-block";
import { DocBlockquote } from "@/components/marketing/doc-callout";
import { DocHeading } from "@/components/marketing/doc-heading";
import { DocsToc } from "@/components/marketing/docs-toc";
import { DocsHome } from "@/components/marketing/docs-home";
import { Icon } from "@/components/ui/icon";
import { ArrowLeftIcon, ArrowRightIcon } from "@/lib/icons";

export function generateStaticParams() {
  return [{ slug: [] }, ...DOCS_ORDER.map((slug) => ({ slug: [slug] }))];
}

export async function generateMetadata({ params }: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || slug.length === 0) return { title: "Docs" };
  const page = slug[0];
  return { title: `${getDocTitle(page)} — Docs` };
}

export default async function DocsPage({ params }: PageProps<"/docs/[[...slug]]">) {
  const { slug } = await params;
  if (!slug || slug.length === 0) return <DocsHome />;
  const page = slug[0];
  const content = getDocContent(page);
  if (!content) notFound();
  const t = await getTranslations("Docs");
  const headings = getDocHeadings(content);
  const i = (DOCS_ORDER as readonly string[]).indexOf(page);
  const prev = i > 0 ? DOCS_ORDER[i - 1] : null;
  const next = i >= 0 && i < DOCS_ORDER.length - 1 ? DOCS_ORDER[i + 1] : null;

  return (
    <div className="grid min-w-0 gap-10 xl:grid-cols-[minmax(0,1fr)_180px]">
      <div key={page} className="page-in anim-keep min-w-0">
        <article className="max-w-none">
          <Markdown
            remarkPlugins={[remarkGfm]}
            skipHtml
            components={{
              h1: (p) => <h1 className="text-h1 text-text font-serif" {...p} />,
              h2: ({ children }) => (
                <DocHeading level={2} id={slugifyHeading(String(children))}>
                  {children}
                </DocHeading>
              ),
              h3: ({ children }) => (
                <DocHeading level={3} id={slugifyHeading(String(children))}>
                  {children}
                </DocHeading>
              ),
              p: (p) => <p className="text-body text-text-muted mt-4 leading-7" {...p} />,
              a: (p) => (
                <a
                  className="text-link decoration-link/40 hover:decoration-link underline underline-offset-4 transition-colors"
                  {...p}
                />
              ),
              ul: (p) => <ul className="text-body text-text-muted mt-4 ml-5 list-disc leading-7" {...p} />,
              ol: (p) => <ol className="text-body text-text-muted mt-4 ml-5 list-decimal leading-7" {...p} />,
              li: (p) => <li className="mt-1.5 marker:text-link" {...p} />,
              strong: (p) => <strong className="text-text font-semibold" {...p} />,
              blockquote: (p) => <DocBlockquote>{p.children}</DocBlockquote>,
              code: (p) =>
                "className" in p ? (
                  <code {...p} />
                ) : (
                  <code
                    className="bg-surface-raised text-small text-text rounded-sm px-1.5 py-0.5 font-mono"
                    {...p}
                  />
                ),
              pre: (p) => <CodeBlock>{p.children}</CodeBlock>,
              table: (p) => (
                <div className="border-border mt-5 overflow-x-auto rounded-md border">
                  <table className="text-small w-full border-collapse" {...p} />
                </div>
              ),
              thead: (p) => <thead className="bg-surface" {...p} />,
              tr: (p) => <tr className="border-border hover:bg-surface/60 border-b transition-colors last:border-b-0" {...p} />,
              th: (p) => <th className="text-text px-4 py-3 text-left font-medium" {...p} />,
              td: (p) => <td className="text-text-muted px-4 py-3" {...p} />,
            }}
          >
            {content}
          </Markdown>
        </article>

        <nav aria-label={t("pagination")} className="border-border mt-16 grid gap-4 border-t pt-8 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/docs/${prev}`}
              className="anim-keep group border-border hover:border-accent rounded-md border p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5"
            >
              <span className="text-small text-text-muted inline-flex items-center gap-1.5">
                <Icon
                  icon={ArrowLeftIcon}
                  size={14}
                  className="anim-keep transition-transform duration-200 group-hover:-translate-x-1"
                />
                {t("previous")}
              </span>
              <span className="text-body-lg text-text mt-1 block font-serif">{getDocTitle(prev)}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/docs/${next}`}
              className="anim-keep group border-border hover:border-accent rounded-md border p-4 text-right transition-[border-color,transform] duration-300 hover:-translate-y-0.5 sm:col-start-2"
            >
              <span className="text-small text-text-muted inline-flex items-center gap-1.5">
                {t("next")}
                <Icon
                  icon={ArrowRightIcon}
                  size={14}
                  className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
                />
              </span>
              <span className="text-body-lg text-text mt-1 block font-serif">{getDocTitle(next)}</span>
            </Link>
          ) : null}
        </nav>
      </div>

      <DocsToc headings={headings} title={t("onThisPage")} />
    </div>
  );
}
