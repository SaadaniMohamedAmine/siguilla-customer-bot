import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMeta } from "@/lib/meta";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return pageMeta(t("designSystem.title"), t("designSystem.description"), "/design-system");
}

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return children;
}
