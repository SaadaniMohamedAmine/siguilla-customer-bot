import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { getTranslations } from "next-intl/server";
import { requireOrgPage } from "@/lib/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const INK = "#1A1214";
const MUTED = "#6B5A5D";
const LINE = "#E4D6CE";

/** Faux site neutre : le widget est le seul élément « vivant » de la page, comme chez un visiteur. */
export default async function WidgetPreviewPage({ searchParams }: PageProps<"/widget-preview">) {
  const { org } = await requireOrgPage();
  const { pk } = await searchParams;
  const publicKey = typeof pk === "string" ? pk : undefined;
  if (!publicKey) notFound();
  const chatbot = await prisma.chatbot.findFirst({ where: { publicKey, organizationId: org.id } });
  if (!chatbot) notFound();
  const t = await getTranslations("WidgetPreview");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "auto",
        background: "#FAF6F2",
        fontFamily: "Georgia, serif",
        color: INK,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 32px",
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <span style={{ fontSize: 14, letterSpacing: "0.3em", fontWeight: 600 }}>{t("brand")}</span>
        <nav style={{ display: "flex", gap: 24, fontSize: 14, color: MUTED }}>
          <span>{t("nav1")}</span>
          <span>{t("nav2")}</span>
          <span>{t("nav3")}</span>
        </nav>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "72px 32px 48px" }}>
        <p style={{ textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, color: "#8A7A7D" }}>
          {t("eyebrow")}
        </p>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, marginTop: 12 }}>{t("title")}</h1>
        <p style={{ color: MUTED, lineHeight: 1.7, marginTop: 16, maxWidth: 560 }}>{t("body")}</p>
        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          <span style={{ background: INK, color: "#FAF6F2", padding: "12px 22px", fontSize: 14 }}>{t("cta")}</span>
          <span style={{ border: `1px solid ${LINE}`, padding: "12px 22px", fontSize: 14 }}>{t("cta2")}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 56 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ border: `1px solid ${LINE}`, background: "#fff", padding: 20 }}>
              <div style={{ height: 80, background: "#F4EDE8", marginBottom: 16 }} />
              <div style={{ height: 10, width: "70%", background: LINE, marginBottom: 8 }} />
              <div style={{ height: 10, width: "45%", background: LINE }} />
            </div>
          ))}
        </div>
        <p style={{ marginTop: 40, fontSize: 12, color: "#8A7A7D", textAlign: "center" }}>{t("note")}</p>
      </main>

      <Script src="/widget/v1.js" data-bot={publicKey} data-preview="true" strategy="afterInteractive" />
    </div>
  );
}
