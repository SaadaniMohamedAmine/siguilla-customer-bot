import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/ui/wordmark";
import { Icon } from "@/components/ui/icon";
import { CloseIcon } from "@/lib/icons";

export default async function NewAgentLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Wizard");
  return (
    <div className="bg-bg relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="anim-keep pointer-events-none absolute top-0 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          opacity: 0.12,
          animation: "glow-drift 9s ease-in-out infinite",
        }}
      />
      <div className="border-border bg-bg/80 relative z-10 flex items-center justify-between border-b px-6 py-5 backdrop-blur-md sm:px-8">
        <Link href="/agents" aria-label={`Sigilla — ${t("cancel")}`} className="transition-opacity hover:opacity-80">
          <Wordmark size="md" />
        </Link>
        <Link href="/agents" className="anim-keep group text-small text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors">
          <Icon icon={CloseIcon} size={16} className="anim-keep transition-transform duration-200 group-hover:rotate-90" />
          {t("cancel")}
        </Link>
      </div>
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">{children}</div>
    </div>
  );
}
