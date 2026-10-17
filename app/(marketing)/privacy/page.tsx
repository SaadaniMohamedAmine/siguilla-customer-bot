import type { Metadata } from "next";
import { pageMeta } from "@/lib/meta";
import { getTranslations } from "next-intl/server";
import { LegalPage, type LegalSection } from "@/components/marketing/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return pageMeta(t("privacy.title"), t("privacy.description"), "/privacy");
}

export default async function PrivacyPage() {
  const t = await getTranslations("Legal.privacy");
  const tt = await getTranslations("Legal.terms");
  const rows = t.raw("processors") as { name: string; role: string }[];
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  const sections: LegalSection[] = [
    { id: "s1", title: t("processTitle"), content: <p>{t("processBody")}</p> },
    {
      id: "s2",
      title: t("subTitle"),
      content: (
        <div className="border-border overflow-x-auto rounded-md border">
          <table className="text-small w-full border-collapse">
            <thead className="bg-surface">
              <tr className="border-border border-b">
                <th scope="col" className="text-text px-4 py-3 text-left font-medium">
                  {t("colService")}
                </th>
                <th scope="col" className="text-text px-4 py-3 text-left font-medium">
                  {t("colRole")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-border hover:bg-surface/60 border-b transition-colors last:border-b-0">
                  <th scope="row" className="text-text px-4 py-3 text-left font-normal">
                    {r.name}
                  </th>
                  <td className="text-text-muted px-4 py-3">{r.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    { id: "s3", title: t("dontTitle"), content: <p>{t("dontBody")}</p> },
    {
      id: "s4",
      title: t("widgetTitle"),
      content: (
        <p>
          {t.rich("widgetBody", {
            code: (chunks) => (
              <code className="bg-surface-raised text-small text-text rounded-sm px-1.5 py-0.5 font-mono">
                {chunks}
              </code>
            ),
          })}
        </p>
      ),
    },
    { id: "s5", title: t("deleteTitle"), content: <p>{t("deleteBody")}</p> },
  ];
  if (contact) {
    sections.push({
      id: "s6",
      title: t("contactTitle"),
      content: (
        <p>
          <a href={`mailto:${contact}`} className="text-link link-draw anim-keep">
            {contact}
          </a>
        </p>
      ),
    });
  }

  return (
    <LegalPage
      title={t("title")}
      updated={t("updated")}
      intro={t("intro")}
      summary={{ title: t("glanceTitle"), items: t.raw("glance") as string[] }}
      sections={sections}
      other={{ href: "/terms", label: tt("title") }}
    />
  );
}
