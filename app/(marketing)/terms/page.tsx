import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Terms" };

export default async function TermsPage() {
  const t = await getTranslations("Legal.terms");
  const tp = await getTranslations("Legal.privacy");
  return (
    <LegalPage
      title={t("title")}
      updated={t("updated")}
      intro={t("intro")}
      other={{ href: "/privacy", label: tp("title") }}
      sections={[
        { id: "s1", title: t("acceptableTitle"), content: <p>{t("acceptableBody")}</p> },
        {
          id: "s2",
          title: t("limitsTitle"),
          content: (
            <p>
              {t.rich("limitsBody", {
                pricing: (chunks) => (
                  <Link href="/pricing" className="text-link link-draw anim-keep">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          ),
        },
        { id: "s3", title: t("changesTitle"), content: <p>{t("changesBody")}</p> },
      ]}
    />
  );
}
