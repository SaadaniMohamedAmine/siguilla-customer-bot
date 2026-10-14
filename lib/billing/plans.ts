import { useTranslations } from "next-intl";

export type PlanId = "free" | "pro" | "team";
export const PLAN_ORDER: PlanId[] = ["free", "pro", "team"];
export const PLAN_PRICES: Record<PlanId, number> = { free: 0, pro: 12, team: 39 };

export const PLAN_LIMITS = {
  free: {
    agents: 1,
    sourcesPerAgent: 5,
    pagesPerSite: 25,
    messagesPerMonth: 200,
    notion: false,
    api: false,
    removeBadge: false,
    members: 1,
  },
  pro: {
    agents: 5,
    sourcesPerAgent: 25,
    pagesPerSite: 100,
    messagesPerMonth: 2000,
    notion: true,
    api: true,
    removeBadge: true,
    members: 3,
  },
  team: {
    agents: 15,
    sourcesPerAgent: 50,
    pagesPerSite: 100,
    messagesPerMonth: 10000,
    notion: true,
    api: true,
    removeBadge: true,
    members: 10,
  },
} as const;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[(PLAN_ORDER as string[]).includes(plan) ? (plan as PlanId) : "free"];
}

/** Libellés et listes de fonctionnalités traduits (messages/{locale}.json → Billing.plans). */
export function usePlanDetails() {
  const t = useTranslations("Billing.plans");
  return Object.fromEntries(
    PLAN_ORDER.map((id) => [
      id,
      { name: t(`${id}.name`), tagline: t(`${id}.tagline`), features: t.raw(`${id}.features`) as string[] },
    ]),
  ) as Record<PlanId, { name: string; tagline: string; features: string[] }>;
}
