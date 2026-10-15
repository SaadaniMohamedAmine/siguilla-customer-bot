"use client";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { CheckIcon } from "@/lib/icons";

/** Points de valeur affichés sous la citation, uniquement sur la page d'inscription. */
export function AuthBenefits() {
  const t = useTranslations("Auth");
  const pathname = usePathname();
  if (pathname !== "/sign-up") return null;
  return (
    <ul className="hero-in anim-keep mt-8 flex flex-col gap-2.5" style={{ "--d": "900ms" } as React.CSSProperties}>
      {(["benefit1", "benefit2", "benefit3"] as const).map((k) => (
        <li key={k} className="text-body text-text-muted flex items-center gap-2.5">
          <Icon icon={CheckIcon} size={16} className="text-link" />
          {t(k)}
        </li>
      ))}
    </ul>
  );
}
