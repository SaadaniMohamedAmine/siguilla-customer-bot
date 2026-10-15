"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { ResetPasswordSchema, passwordStrength } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/components/ui/toast";
import { ArrowLeftIcon, WarningIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;
const LEVEL = { weak: 1, fair: 2, strong: 3 } as const;

export default function ResetPasswordPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const strength = password ? passwordStrength(password) : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError(t("validation.passwordRequired"));
      return;
    }
    if (!ResetPasswordSchema.safeParse({ password }).success) {
      setError(t("validation.passwordMin"));
      return;
    }
    setLoading(true);
    const { error: authError } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (authError) {
      setError(t("errors.generic"));
      return;
    }
    toast.success(t("resetDone"));
    router.push("/sign-in");
  }

  return (
    <div className="page-in anim-keep border-border bg-surface-raised w-full max-w-[420px] rounded-md border p-10">
      {!token ? (
        <div className="hero-in anim-keep text-center" style={at(0)} role="alert">
          <span className="border-warning/40 bg-warning/10 text-warning mx-auto flex size-14 items-center justify-center rounded-full border">
            <Icon icon={WarningIcon} size={24} />
          </span>
          <h1 className="font-serif text-h2 text-text mt-5">{t("resetInvalidTitle")}</h1>
          <p className="text-body text-text-muted mt-2">{t("resetInvalid")}</p>
          <Link href="/forgot-password" className="mt-6 block">
            <Button className="w-full">{t("requestNew")}</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="hero-in anim-keep" style={at(0)}>
            <h1 className="font-serif text-h2 text-text">{t("resetTitle")}</h1>
            <p className="text-body text-text-muted mt-1">{t("resetSubtitle")}</p>
          </div>
          <form
            onSubmit={onSubmit}
            noValidate
            className="hero-in anim-keep mt-6 flex flex-col gap-4"
            style={at(120)}
          >
            <div>
              <PasswordInput
                label={t("password")}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {strength ? (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3].map((seg) => (
                      <span
                        key={seg}
                        className={cn(
                          "bg-border h-1 flex-1 rounded-full",
                          seg <= LEVEL[strength] &&
                            (strength === "strong" ? "bg-success" : strength === "fair" ? "bg-warning" : "bg-error"),
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-small text-text-muted">{t(`strength.${strength}`)}</span>
                </div>
              ) : null}
            </div>
            {error ? <p className="text-small text-error">{error}</p> : null}
            <Button type="submit" className="w-full" loading={loading}>
              {t("resetSubmit")}
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
