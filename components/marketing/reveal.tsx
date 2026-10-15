"use client";
import { useReveal } from "@/lib/use-reveal";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [ref, revealClassName, style] = useReveal<HTMLDivElement>(delay);
  return (
    <div ref={ref} className={cn("anim-keep", revealClassName, className)} style={style}>
      {children}
    </div>
  );
}
