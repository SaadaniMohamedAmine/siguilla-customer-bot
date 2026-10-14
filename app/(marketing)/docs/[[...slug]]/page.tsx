import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";
import {
  DOCS_ORDER,
  getDocNav,
  getDocTitle,
  getDocContent,
  getDocHeadings,
  slugifyHeading,
} from "@/lib/docs";
import { CodeBlock } from "@/components/marketing/code-block";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return [{ slug: [] }, ...DOCS_ORDER.map((slug) => ({ slug: [slug] }))];
}

export async function generateMetadata({ params }: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const { slug } = await params;
  const page = slug?.[0] ?? DOCS_ORDER[0];
  return { title: `${getDocTitle(page)} — Docs` };
}

export default async function DocsPage({ params }: PageProps<"/docs/[[...slug]]">) {
  const { slug } = await params;
  const page = slug?.[0] ?? DOCS_ORDER[0];
  const content = getDocContent(page);
  if (!content) notFound();
  const headings = getDocHeadings(content);
  const nav = getDocNav();

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-[200px_1fr_180px]">
      <nav className="flex flex-col gap-1">
        {nav.map((item) => (
          <Link
            key={item.slug}
            href={`/docs/${item.slug}`}
            className={cn(
              "text-small rounded-sm px-2 py-1.5",
              item.slug === page ? "bg-surface-raised text-text" : "text-text-muted hover:text-text",
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>

      <article className="prose-sigilla max-w-none">
        <Markdown
          remarkPlugins={[remarkGfm]}
          skipHtml
          components={{
            h1: (p) => <h1 className="text-h1 text-text font-serif" {...p} />,
            h2: (p) => (
              <h2
                id={slugifyHeading(String(p.children))}
                className="text-h2 text-text mt-10 font-serif"
                {...p}
              />
            ),
            p: (p) => <p className="text-body text-text-muted mt-4" {...p} />,
            a: (p) => <a className="text-link hover:underline" {...p} />,
            ul: (p) => <ul className="text-body text-text-muted mt-4 ml-5 list-disc" {...p} />,
            li: (p) => <li className="mt-1" {...p} />,
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
            table: (p) => <table className="text-small mt-4 w-full border-collapse" {...p} />,
            th: (p) => <th className="border-border text-text border-b p-2 text-left" {...p} />,
            td: (p) => <td className="border-border text-text-muted border-b p-2" {...p} />,
          }}
        >
          {content}
        </Markdown>
      </article>

      {headings.length > 0 ? (
        <aside className="hidden lg:block">
          <p className="label-caps mb-3">On this page</p>
          <ul className="text-small text-text-muted flex flex-col gap-2">
            {headings.map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`} className="hover:text-text">
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}
