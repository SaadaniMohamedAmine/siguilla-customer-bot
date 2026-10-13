"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signUp, signIn } from "@/lib/auth-client";
import { SignUpSchema, passwordStrength } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Icon } from "@/components/ui/icon";
import { GoogleIcon, GithubIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  const t = useTranslations("Auth");
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const strength = password ? passwordStrength(password) : null;
  const strengthLevel = { weak: 1, fair: 2, strong: 3 } as const;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = SignUpSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("errors.generic"));
      return;
    }
    setLoading(true);
    const { error: authError } = await signUp.email({ name, email, password, callbackURL: "/agents" });
    setLoading(false);
    if (authError) setError(authError.status === 422 ? t("errors.exists") : t("errors.generic"));
    else router.push("/agents");
  }

  return (
    <div className="w-full max-w-[420px] rounded-md border border-border bg-surface-raised p-10">
      <h1 className="font-serif text-h2 text-text">{t("signUpTitle")}</h1>
      <p className="mt-1 text-body text-text-muted">{t("signUpSubtitle")}</p>

      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => signIn.social({ provider: "google", callbackURL: "/agents" })}
        >
          <Icon icon={GoogleIcon} size={18} />
          {t("google")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => signIn.social({ provider: "github", callbackURL: "/agents" })}
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
        <Input label={t("name")} required value={name} onChange={(e) => setName(e.target.value)} />
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
                      "h-1 flex-1 rounded-full bg-border",
                      seg <= strengthLevel[strength] &&
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
        <p className="text-small text-text-muted">
          {t.rich("legal", {
            terms: (chunks) => (
              <Link href="/terms" className="text-link hover:underline">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="text-link hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
        <Button type="submit" className="w-full" loading={loading}>
          {t("signUp")}
        </Button>
      </form>

      <p className="mt-6 text-center text-small text-text-muted">
        {t("haveAccount")}{" "}
        <Link href="/sign-in" className="text-link hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
