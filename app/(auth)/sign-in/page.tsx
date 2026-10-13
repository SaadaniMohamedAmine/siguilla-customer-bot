"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "@/lib/auth-client";
import { SignInSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Icon } from "@/components/ui/icon";
import { GoogleIcon, GithubIcon } from "@/lib/icons";

export default function SignInPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirect") || "/agents";
  const demoEnabled = process.env.NEXT_PUBLIC_DEMO_ENABLED === "true";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = SignInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(t("errors.invalid"));
      return;
    }
    setLoading(true);
    const { error: authError } = await signIn.email({ email, password, callbackURL: redirectTo });
    setLoading(false);
    if (authError) setError(t("errors.invalid"));
    else router.push(redirectTo);
  }

  return (
    <div className="w-full max-w-[420px] rounded-md border border-border bg-surface-raised p-10">
      <h1 className="font-serif text-h2 text-text">{t("signInTitle")}</h1>
      <p className="mt-1 text-body text-text-muted">{t("signInSubtitle")}</p>

      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => signIn.social({ provider: "google", callbackURL: redirectTo })}
        >
          <Icon icon={GoogleIcon} size={18} />
          {t("google")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => signIn.social({ provider: "github", callbackURL: redirectTo })}
        >
          <Icon icon={GithubIcon} size={18} />
          {t("github")}
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3 text-small text-text-muted">
        <span className="h-px flex-1 bg-border" />
        {t("or")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label={t("email")}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <PasswordInput
            label={t("password")}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Link href="/forgot-password" className="mt-2 inline-block text-small text-link hover:underline">
            {t("forgot")}
          </Link>
        </div>
        {error ? <p className="text-small text-error">{error}</p> : null}
        <Button type="submit" className="w-full" loading={loading}>
          {t("signIn")}
        </Button>
      </form>

      <p className="mt-6 text-center text-small text-text-muted">
        {t("noAccount")}{" "}
        <Link href="/sign-up" className="text-link hover:underline">
          {t("createAccount")}
        </Link>
      </p>
      {demoEnabled ? (
        <p className="mt-2 text-center text-small">
          <Link href="/demo" className="text-link hover:underline">
            {t("exploreDemo")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
