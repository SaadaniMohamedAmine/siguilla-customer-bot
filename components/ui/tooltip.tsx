"use client";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={150}>{children}</TooltipPrimitive.Provider>;
}

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipPortal = TooltipPrimitive.Portal;

/** Infobulle au style Sigilla par défaut (fondu rapide) ; `className` permet d'ajuster. */
export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        "tip-anim anim-keep z-50 max-w-[260px] rounded-md border border-border bg-surface-raised px-3 py-2 text-small text-text shadow-[var(--shadow-lift)]",
        className,
      )}
      {...props}
    />
  );
}
