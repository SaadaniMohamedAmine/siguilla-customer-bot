"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { authClient } from "@/lib/auth-client";

export default function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-body text-text-muted">
        {status === "pending" ? "Accepting invitation…" : "This invitation link is invalid or has expired."}
      </p>
    </div>
  );
}
