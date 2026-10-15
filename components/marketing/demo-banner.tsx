import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ArrowLeftIcon, SealIcon } from "@/lib/icons";

/** Bandeau Sigilla en haut des sites fictifs : indique que la marque est illustrative et que le concierge est propulsé par Sigilla. */
export function DemoBanner() {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-2.5 text-[12px]"
      style={{
        background: "linear-gradient(90deg, #0E0A0B, #1B1013 55%, #0E0A0B)",
        color: "#F3ECE6",
        borderBottom: "1px solid #2E2225",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <p className="flex items-center gap-2">
        <Icon icon={SealIcon} size={15} className="text-[#E3B3BA]" />
        <span>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 14 }}>Sigilla</span>
          <span className="text-[#A8999A]"> · Illustrative brand — the concierge in the corner is powered by Sigilla.</span>
        </span>
      </p>
      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 rounded-full border border-[#2E2225] px-3 py-1 transition-colors duration-200 hover:border-[#9E2F45]"
      >
        <Icon
          icon={ArrowLeftIcon}
          size={13}
          className="text-[#E3B3BA] transition-transform duration-200 group-hover:-translate-x-0.5"
        />
        Back to Sigilla
      </Link>
    </div>
  );
}
