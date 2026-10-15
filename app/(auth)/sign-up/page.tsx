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

type FieldErrors = { name?: string; email?: string; password?: string };

export default function SignUpPage() {
  const t = useTranslations("Auth");
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const strength = password ? passwordStrength(password) : null;
  const strengthLevel = { weak: 1, fair: 2, strong: 3 } as const;

  const validateName = React.useCallback(
    (value: string) => {
      if (!value.trim()) return t("validation.nameRequired");
      return SignUpSchema.shape.name.safeParse(value).success ? undefined : t("validation.nameRequired");
    },
    [t],
  );
  const validateEmail = React.useCallback(
    (value: string) => {
      if (!value.trim()) return t("validation.emailRequired");
      return SignUpSchema.shape.email.safeParse(value).success ? undefined : t("validation.emailInvalid");
    },
    [t],
  );
  const validatePassword = React.useCallback(
    (value: string) => {
      if (!value) return t("validation.passwordRequired");
      return SignUpSchema.shape.password.safeParse(value).success ? undefined : t("validation.passwordMin");
    },
    [t],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setFieldErrors({ name: nameError, email: emailError, password: passwordError });
    if (nameError || emailError || passwordError) return;

    setLoading(true);
    const { error: authError } = await signUp.email({ name, email, password, callbackURL: "/agents" });
    setLoading(false);
    if (authError) setFormError(authError.status === 422 ? t("errors.exists") : t("errors.generic"));
    else router.push("/agents");
  }

  return (
    <div className="page-in anim-keep w-full max-w-[420px] rounded-md border border-border bg-surface-raised p-10">
      <div className="hero-in anim-keep" style={{ "--d": "0ms" } as React.CSSProperties}>
        <h1 className="font-serif text-h2 text-text">{t("signUpTitle")}</h1>
        <p className="mt-1 text-body text-text-muted">{t("signUpSubtitle")}</p>
      </div>

      <div className="hero-in anim-keep mt-6 flex flex-col gap-3" style={{ "--d": "100ms" } as React.CSSProperties}>
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

      <form
        onSubmit={onSubmit}
        noValidate
        className="hero-in anim-keep flex flex-col gap-4"
        style={{ "--d": "200ms" } as React.CSSProperties}
      >
        <Input
          label={t("name")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) setFieldErrors((f) => ({ ...f, name: undefined }));
          }}
          onBlur={(e) => setFieldErrors((f) => ({ ...f, name: validateName(e.target.value) }))}
          error={fieldErrors.name}
        />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
            onBlur={(e) => setFieldErrors((f) => ({ ...f, password: validatePassword(e.target.value) }))}
            error={fieldErrors.password}
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
        {formError ? <p className="text-small text-error">{formError}</p> : null}
        <p className="text-small text-text-muted">
          {t.rich("legal", {
            terms: (chunks) => (
              <Link href="/terms" className="link-draw anim-keep text-link">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="link-draw anim-keep text-link">
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
        <Link href="/sign-in" className="link-draw anim-keep text-link">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
