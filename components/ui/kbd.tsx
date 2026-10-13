import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn("rounded-sm border border-border px-1.5 font-mono text-[11px] text-text-muted", className)}
      {...props}
    />
  );
}
