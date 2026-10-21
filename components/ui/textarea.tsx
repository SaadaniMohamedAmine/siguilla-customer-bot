import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  /** Classes de l'enveloppe (le `className` ne vise que le champ) : `min-w-0 flex-1` pour occuper une ligne flex. */
  wrapperClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, wrapperClassName, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;
    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label ? (
          <label htmlFor={textareaId} className="label-caps">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error || undefined}
          aria-describedby={errorId}
          className={cn(
            "rounded-sm border border-border bg-surface px-3 py-2 text-body text-text placeholder:text-text-muted focus-visible:border-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea";
