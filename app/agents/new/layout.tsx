import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";

export default function NewAgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg min-h-screen">
      <div className="border-border flex items-center justify-between border-b px-8 py-5">
        <Link href="/agents">
          <Wordmark size="md" />
        </Link>
        <Link href="/agents" className="text-small text-text-muted hover:text-text">
          Cancel
        </Link>
      </div>
      <div className="mx-auto max-w-2xl px-6 py-12">{children}</div>
    </div>
  );
}
