import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { cn } from "@/lib/utils";

type IconProps = Omit<HugeiconsIconProps, "strokeWidth" | "color"> & { className?: string; label?: string };

/** Seul point d'entrée pour les icônes. Stroke Rounded, trait 1.5px, couleur héritée. */
export function Icon({ size = 18, className, label, ...props }: IconProps) {
  return (
    <HugeiconsIcon
      size={size}
      strokeWidth={1.5}
      color="currentColor"
      className={cn("shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      {...props}
    />
  );
}
