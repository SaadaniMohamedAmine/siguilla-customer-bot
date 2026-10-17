"use client";
import * as React from "react";
import { Icon } from "./icon";
import { EyeIcon, EyeOffIcon } from "@/lib/icons";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { InputProps } from "./input";

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps & { labelAction?: React.ReactNode }>(
  ({ className, label, labelAction, error, id, ...props }, ref) => {
    const t = useTranslations("Common");
    const [visible, setVisible] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={inputId} className="label-caps">
              {label}
            </label>
            {labelAction}
          </div>
        ) : null}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            aria-invalid={!!error || undefined}
            aria-describedby={errorId}
            className={cn(
              "h-10 w-full rounded-sm border border-border bg-surface px-3 pr-10 text-body text-text placeholder:text-text-muted transition-[border-color,box-shadow] duration-200 focus-visible:border-focus focus-visible:shadow-[0_0_0_3px_var(--tint)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-error",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            aria-pressed={visible}
            aria-label={visible ? t("hidePassword") : t("showPassword")}
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-text-muted hover:text-text"
          >
            <Icon icon={visible ? EyeOffIcon : EyeIcon} size={18} />
          </button>
        </div>
        {error ? (
          <p id={errorId} className="text-small text-error">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
