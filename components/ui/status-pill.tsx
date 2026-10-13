import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "error" | "accent";
const dot: Record<Tone, string> = {
  neutral: "bg-text-muted",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  accent: "bg-link",
};

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-0.5 font-mono text-[11px] tracking-wide text-text",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone])} aria-hidden />
      {children}
    </span>
  );
}
