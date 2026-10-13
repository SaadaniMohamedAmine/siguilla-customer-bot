"use client";
import * as React from "react";
import { Icon } from "./icon";
import { EyeIcon, EyeOffIcon } from "@/lib/icons";
import { Input, type InputProps } from "./input";
import { cn } from "@/lib/utils";

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? "text" : "password"} className={cn("pr-10", className)} {...props} />
      <button
        type="button"
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
      >
        <Icon icon={visible ? EyeOffIcon : EyeIcon} size={18} />
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";
