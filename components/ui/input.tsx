import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="label-caps">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={errorId}
          className={cn(
            "h-10 rounded-sm border border-border bg-surface px-3 text-body text-text placeholder:text-text-muted focus-visible:border-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error",
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} className="text-small text-error">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
