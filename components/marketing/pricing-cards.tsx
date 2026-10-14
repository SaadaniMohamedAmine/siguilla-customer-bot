"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { usePlanDetails, PLAN_ORDER, PLAN_PRICES, type PlanId } from "@/lib/billing/plans";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

function redirectTo(url: string) {
  window.location.href = url;
}

export function PricingCards() {
  const { data: session } = useSession();
  const plans = usePlanDetails();
  const router = useRouter();
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
    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {PLAN_ORDER.map((id) => {
        const plan = plans[id];
        const featured = id === "pro";
        return (
          <div
            key={id}
            className={cn(
              "flex flex-col rounded-md border p-6",
              featured ? "border-accent" : "border-border",
            )}
          >
            {featured ? <p className="label-caps text-link mb-2">Most chosen</p> : null}
            <p className="text-h3 text-text font-serif">{plan.name}</p>
            <p className="text-small text-text-muted mt-1">{plan.tagline}</p>
            <p className="text-kpi text-text mt-4 font-serif">
              ${PLAN_PRICES[id]}
              <span className="text-body text-text-muted">/month</span>
            </p>
            <ul className="text-small text-text-muted mt-4 flex flex-1 flex-col gap-2">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Button
              className="mt-6"
              variant={featured ? "primary" : "subtle"}
              loading={loading === id}
              onClick={() => choose(id)}
            >
              {id === "free" ? "Start free" : `Upgrade to ${plan.name}`}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
