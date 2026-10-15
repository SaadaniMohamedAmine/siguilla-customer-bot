"use client";
import { Icon } from "@/components/ui/icon";
import { ArrowUpIcon } from "@/lib/icons";

const btn =
  "anim-keep group text-small text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors duration-200";

export function BackToTop({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={btn}>
      {label}
      <Icon
        icon={ArrowUpIcon}
        size={14}
        className="anim-keep transition-transform duration-200 group-hover:-translate-y-0.5"
      />
    </button>
  );
}
