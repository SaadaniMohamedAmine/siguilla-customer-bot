import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMeta } from "@/lib/meta";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { ...pageMeta(t("signUp.title"), t("signUp.description"), "/sign-up") };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
