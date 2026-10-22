import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMeta } from "@/lib/meta";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return {
    ...pageMeta(t("resetPassword.title"), t("resetPassword.description"), "/reset-password"),
    robots: { index: false },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
