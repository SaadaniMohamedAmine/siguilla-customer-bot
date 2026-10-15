import { getLocale } from "next-intl/server";
import { DOC_GROUPS, getDocSearchIndex, getDocTitle } from "@/lib/docs";
import { DocsSidebar } from "@/components/marketing/docs-sidebar";

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const groups = DOC_GROUPS.map((g) => ({
    key: g.key,
    items: g.slugs.map((slug) => ({ slug, title: getDocTitle(slug, locale) })),
  }));
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-[220px_minmax(0,1fr)]">
      <DocsSidebar groups={groups} index={getDocSearchIndex(locale)} />
      {children}
    </div>
  );
}
