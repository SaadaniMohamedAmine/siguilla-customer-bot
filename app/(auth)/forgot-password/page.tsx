"use client";
import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { ForgotPasswordSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth");
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(t("errors.invalid"));
      return;
    }
    setLoading(true);
    await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="w-full max-w-[420px] rounded-md border border-border bg-surface-raised p-10">
      <h1 className="font-serif text-h2 text-text">{t("forgotTitle")}</h1>
      <p className="mt-1 text-body text-text-muted">{t("forgotSubtitle")}</p>

      {sent ? (
        <p className="mt-6 text-body text-text">
          {t("forgotSent")}
          {process.env.NODE_ENV === "development" ? (
            <span className="mt-2 block text-small text-text-muted">
              Dev: the reset link is printed in the server console.
            </span>
          ) : null}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label={t("email")}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error ? <p className="text-small text-error">{error}</p> : null}
          <Button type="submit" className="w-full" loading={loading}>
            {t("sendLink")}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-small text-text-muted">
        <Link href="/sign-in" className="text-link hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
