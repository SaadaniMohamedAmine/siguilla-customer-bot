"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { ResetPasswordSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/components/ui/toast";

export default function ResetPasswordPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = ResetPasswordSchema.safeParse({ password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("errors.generic"));
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
    <div className="w-full max-w-[420px] rounded-md border border-border bg-surface-raised p-10">
      <h1 className="font-serif text-h2 text-text">{t("resetTitle")}</h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <PasswordInput
          label={t("password")}
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-small text-error">{error}</p> : null}
        <Button type="submit" className="w-full" loading={loading} disabled={!token}>
          {t("resetSubmit")}
        </Button>
      </form>
    </div>
  );
}
