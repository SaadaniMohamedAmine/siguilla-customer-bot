import Link from "next/link";

export function DemoBanner({ dark }: { dark?: boolean }) {
  return (
    <div
      className={dark ? "bg-[#231A1C] text-[#E8DAC4]" : "bg-[#F4F6F8] text-[#475569]"}
      style={{ fontSize: 12 }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-2">
        <span>Illustrative brand — part of the Sigilla demo.</span>
        <Link href="/" className="underline">
          Back to Sigilla
        </Link>
      </div>
    </div>
  );
}
