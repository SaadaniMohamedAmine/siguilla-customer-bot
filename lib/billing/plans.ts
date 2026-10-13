export type PlanId = "free" | "pro" | "team";
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
  return PLAN_LIMITS[(plan as PlanId) in PLAN_LIMITS ? (plan as PlanId) : "free"];
}
