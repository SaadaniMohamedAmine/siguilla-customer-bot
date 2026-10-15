"use client";
import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { ForgotPasswordSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { ArrowLeftIcon, MailIcon } from "@/lib/icons";

const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth");
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError(t("validation.emailRequired"));
      return;
    }
    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(t("validation.emailInvalid"));
      return;
    }
    setLoading(true);
    await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="page-in anim-keep border-border bg-surface-raised w-full max-w-[420px] rounded-md border p-10">
      {sent ? (
        <div className="hero-in anim-keep text-center" style={at(0)} role="status">
          <span className="border-success/40 bg-success/10 text-success mx-auto flex size-14 items-center justify-center rounded-full border">
            <Icon icon={MailIcon} size={24} />
          </span>
          <h1 className="font-serif text-h2 text-text mt-5">{t("forgotSentTitle")}</h1>
          <p className="text-body text-text-muted mt-2">{t("forgotSent")}</p>
          {process.env.NODE_ENV === "development" ? (
            <p className="text-small text-text-muted mt-3">Dev: the reset link is printed in the server console.</p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="hero-in anim-keep" style={at(0)}>
            <h1 className="font-serif text-h2 text-text">{t("forgotTitle")}</h1>
            <p className="text-body text-text-muted mt-1">{t("forgotSubtitle")}</p>
          </div>
          <form
            onSubmit={onSubmit}
            noValidate
            className="hero-in anim-keep mt-6 flex flex-col gap-4"
            style={at(120)}
          >
            <Input
              label={t("email")}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error ? <p className="text-small text-error">{error}</p> : null}
            <Button type="submit" className="w-full" loading={loading}>
              {t("sendLink")}
            </Button>
          </form>
        </>
      )}

      <p className="hero-in anim-keep mt-6 text-center" style={at(240)}>
        <Link
          href="/sign-in"
          className="group anim-keep text-small text-link inline-flex items-center gap-1.5"
        >
          <Icon
            icon={ArrowLeftIcon}
            size={14}
            className="anim-keep transition-transform duration-200 group-hover:-translate-x-1"
          />
          <span className="link-draw anim-keep">{t("backToSignIn")}</span>
        </Link>
      </p>
    </div>
  );
}
