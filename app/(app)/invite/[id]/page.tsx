"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SealIcon, WarningIcon } from "@/lib/icons";

export default function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("Invite");
  const router = useRouter();
  const [status, setStatus] = React.useState<"pending" | "error">("pending");

  React.useEffect(() => {
    authClient.organization
      .acceptInvitation({ invitationId: id })
      .then(({ error }) => {
        if (error) setStatus("error");
        else router.push("/agents");
      })
      .catch(() => setStatus("error"));
  }, [id, router]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="page-in anim-keep border-border bg-surface w-full max-w-md rounded-lg border p-10 text-center">
        {status === "pending" ? (
          <div role="status">
            <span className="border-border bg-bg text-link mx-auto flex size-14 items-center justify-center rounded-full border">
              <Icon icon={SealIcon} size={24} />
            </span>
            <h1 className="text-h2 text-text mt-5 font-serif">{t("pendingTitle")}</h1>
            <p className="text-body text-text-muted mt-2">{t("pendingBody")}</p>
            <div className="mx-auto mt-6 flex h-[52px] items-end justify-center gap-1.5" aria-hidden>
              {[0, 0.1, 0.2, 0.3].map((d) => (
                <span key={d} className="wave-bar bg-accent w-2 rounded-[3px]" style={{ height: 8, animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <div role="alert">
            <span className="border-warning/40 bg-warning/10 text-warning mx-auto flex size-14 items-center justify-center rounded-full border">
              <Icon icon={WarningIcon} size={24} />
            </span>
            <h1 className="text-h2 text-text mt-5 font-serif">{t("errorTitle")}</h1>
            <p className="text-body text-text-muted mt-2">{t("errorBody")}</p>
            <Link href="/agents" className="mt-6 block">
              <Button className="w-full">{t("goToDashboard")}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
