import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireOrgPage } from "@/lib/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function WidgetPreviewPage({ searchParams }: PageProps<"/widget-preview">) {
  const { org } = await requireOrgPage();
  const { pk } = await searchParams;
  const publicKey = typeof pk === "string" ? pk : undefined;
  if (!publicKey) notFound();
  const chatbot = await prisma.chatbot.findFirst({ where: { publicKey, organizationId: org.id } });
  if (!chatbot) notFound();

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "auto", background: "#FAF6F2", fontFamily: "Georgia, serif" }}>
      <div style={{ padding: "64px 32px", maxWidth: 640, margin: "0 auto", color: "#1A1214" }}>
        <p style={{ textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 12, color: "#8A7A7D" }}>
          Preview canvas
        </p>
        <h1 style={{ fontSize: 32, marginTop: 8 }}>A quiet corner of the internet.</h1>
        <p style={{ color: "#6B5A5D", lineHeight: 1.6 }}>
          This neutral page exists only to preview your widget as a visitor would see it on your own site.
        </p>
      </div>
      <script src="/widget/v1.js" data-bot={publicKey} data-preview="true" async />
    </div>
  );
}
