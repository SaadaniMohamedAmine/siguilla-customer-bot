import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: IconSvgElement;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-16 text-center", className)}>
      <Icon icon={icon} size={28} className="text-text-muted" />
      <h3 className="font-serif text-h3 text-text">{title}</h3>
      {description ? <p className="max-w-sm text-body text-text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
