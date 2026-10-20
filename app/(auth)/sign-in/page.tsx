"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "@/lib/auth-client";
import { SignInSchema } from "@/lib/validation/auth";
import { safeRedirect } from "@/lib/safe-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Icon } from "@/components/ui/icon";
import { GoogleIcon, GithubIcon, ArrowRightIcon } from "@/lib/icons";

type FieldErrors = { email?: string; password?: string };

export default function SignInPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = safeRedirect(search.get("redirect"));
  const demoEnabled = process.env.NEXT_PUBLIC_DEMO_ENABLED === "true";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const validateEmail = React.useCallback(
    (value: string) => {
      if (!value.trim()) return t("validation.emailRequired");
      return SignInSchema.shape.email.safeParse(value).success ? undefined : t("validation.emailInvalid");
    },
    [t],
  );
  const validatePassword = React.useCallback(
    (value: string) => (value ? undefined : t("validation.passwordRequired")),
    [t],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setFieldErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    setLoading(true);
    const { error: authError } = await signIn.email({ email, password, callbackURL: redirectTo });
    setLoading(false);
    if (authError) setFormError(authError.status === 429 ? t("errors.tooMany") : t("errors.invalid"));
    else router.push(redirectTo);
  }

  return (
    <div className="page-in anim-keep w-full max-w-[420px] rounded-md border border-border bg-surface-raised p-10">
      <div className="hero-in anim-keep" style={{ "--d": "0ms" } as React.CSSProperties}>
        <h1 className="font-serif text-h2 text-text">{t("signInTitle")}</h1>
        <p className="mt-1 text-body text-text-muted">{t("signInSubtitle")}</p>
      </div>

      <div className="hero-in anim-keep mt-6 flex flex-col gap-3" style={{ "--d": "100ms" } as React.CSSProperties}>
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

      <form
        onSubmit={onSubmit}
        noValidate
        className="hero-in anim-keep flex flex-col gap-4"
        style={{ "--d": "200ms" } as React.CSSProperties}
      >
        <Input
          label={t("email")}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
          }}
          onBlur={(e) => setFieldErrors((f) => ({ ...f, email: validateEmail(e.target.value) }))}
          error={fieldErrors.email}
        />
        <div>
          <PasswordInput
            label={t("password")}
            labelAction={
              <Link href="/forgot-password" className="text-small link-draw anim-keep text-link">
                {t("forgot")}
              </Link>
            }
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
            onBlur={(e) => setFieldErrors((f) => ({ ...f, password: validatePassword(e.target.value) }))}
            error={fieldErrors.password}
          />
        </div>
        {formError ? <p className="text-small text-error">{formError}</p> : null}
        <Button type="submit" className="w-full" loading={loading}>
          {t("signIn")}
        </Button>
      </form>

      <p className="mt-6 text-center text-small text-text-muted">
        {t("noAccount")}{" "}
        <Link href="/sign-up" className="link-draw anim-keep text-link">
          {t("createAccount")}
        </Link>
      </p>
      {demoEnabled ? (
        <p className="mt-3 text-center text-small">
          {/* Lien classique : /demo ouvre une session de démo, un <Link> la ferait ouvrir par le préchargement. */}
          <a href="/demo" className="group anim-keep text-link inline-flex items-center gap-1.5">
            <span className="link-draw anim-keep">{t("exploreDemo")}</span>
            <Icon icon={ArrowRightIcon} size={14} className="anim-keep transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </p>
      ) : null}
    </div>
  );
}
