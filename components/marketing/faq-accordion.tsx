"use client";
import { useId, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { ChevronDownIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** FAQ en accordéon : hauteur animée (grid-rows 0fr → 1fr), icône qui pivote, un seul item ouvert à la fois. */
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const base = useId();
  return (
    <div className="divide-border border-border flex flex-col divide-y border-y">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${base}-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="anim-keep text-body-lg text-text hover:text-link flex w-full items-center justify-between gap-4 py-4 text-left transition-colors duration-200"
              >
                {item.q}
                <Icon
                  icon={ChevronDownIcon}
                  size={18}
                  className={cn(
                    "anim-keep text-text-muted transition-transform duration-300 ease-[var(--ease-lux)]",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
            </h3>
            <div
              id={`${base}-${i}`}
              role="region"
              className={cn(
                "anim-keep grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-lux)]",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="text-body text-text-muted pb-4">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
