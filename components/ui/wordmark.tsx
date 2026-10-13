import { cn } from "@/lib/utils";

export function Wordmark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = { sm: "text-[20px]", md: "text-[26px]", lg: "text-[40px]", xl: "text-[72px]" } as const;
  return (
    <span className={cn("font-serif leading-none tracking-[0.01em] text-text select-none", sizes[size], className)}>
      Sigilla
    </span>
  );
}
