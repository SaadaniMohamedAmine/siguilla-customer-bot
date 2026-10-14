"use client";
import { useReveal } from "@/lib/use-reveal";
import { cn } from "@/lib/utils";

export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const [ref, revealClassName, style] = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={cn(revealClassName, className)} style={style}>
      {children}
    </div>
  );
}
