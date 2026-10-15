"use client";
import { Icon } from "@/components/ui/icon";
import { ArrowRightIcon } from "@/lib/icons";
import { openConcierge } from "@/components/marketing/promise-section";

/** Bouton qui ouvre le widget concierge de la page. */
export function ConciergeLink({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={openConcierge}
      className="anim-keep group border-border bg-bg text-text hover:border-accent text-body inline-flex h-10 items-center gap-2 rounded-full border px-5 font-medium transition-[border-color,transform] duration-200 hover:-translate-y-0.5"
    >
      {label}
      <Icon
        icon={ArrowRightIcon}
        size={14}
        className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
      />
    </button>
  );
}
