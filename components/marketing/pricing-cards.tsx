"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { usePlanDetails, PLAN_ORDER, PLAN_PRICES, type PlanId } from "@/lib/billing/plans";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { CheckIcon } from "@/lib/icons";
import { Reveal } from "@/components/marketing/reveal";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

function redirectTo(url: string) {
  window.location.href = url;
}

export function PricingCards() {
  const { data: session } = useSession();
  const plans = usePlanDetails();
  const router = useRouter();
  const t = useTranslations("Pricing");
  const [loading, setLoading] = React.useState<PlanId | null>(null);

  async function choose(id: PlanId) {
    if (id === "free") {
      router.push(session ? "/agents" : "/sign-up");
      return;
    }
    if (!session) {
      router.push(`/sign-up?plan=${id}`);
      return;
    }
    setLoading(id);
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: id }),
      });
      redirectTo(url);
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {PLAN_ORDER.map((id, i) => {
        const plan = plans[id];
        const featured = id === "pro";
        return (
          <Reveal key={id} delay={i * 120} className="h-full">
            <div
              className={cn(
                "anim-keep group bg-bg relative flex h-full cursor-pointer flex-col overflow-hidden rounded-md border p-6 transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-lux)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
                featured ? "border-accent shadow-[var(--shadow-lift)]" : "border-border hover:border-accent",
              )}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
              }}
            >
              <span
                aria-hidden
                className={cn(
                  "anim-keep pointer-events-none absolute inset-0 transition-opacity duration-300",
                  featured ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
                style={{
                  background: featured
                    ? "radial-gradient(320px circle at var(--mx, 50% ) var(--my, 0%), color-mix(in srgb, var(--accent) 20%, transparent), transparent 70%)"
                    : "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%)",
                }}
              />
              {featured ? (
                <span className="bg-accent text-on-accent absolute top-0 right-6 -translate-y-px rounded-b-sm px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
                  {t("mostChosen")}
                </span>
              ) : null}

              <p className="text-h3 text-text relative font-serif">{plan.name}</p>
              <p className="text-small text-text-muted relative mt-1 min-h-[2.25rem]">{plan.tagline}</p>
              <p className="relative mt-4 flex items-baseline gap-1.5">
                <span className="text-kpi text-text font-serif">${PLAN_PRICES[id]}</span>
                <span className="text-body text-text-muted">{t("month")}</span>
              </p>
              <ul className="text-small text-text-muted relative mt-6 flex flex-1 flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Icon icon={CheckIcon} size={15} className="text-link mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="relative mt-8"
                variant={featured ? "primary" : "subtle"}
                loading={loading === id}
                onClick={() => choose(id)}
              >
                {id === "free" ? t("startFree") : t("upgradeTo", { plan: plan.name })}
              </Button>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
