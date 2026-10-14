import { describe, it, expect } from "vitest";
import { getPlanLimits } from "@/lib/billing/plans";

describe("getPlanLimits", () => {
  it("falls back to free for an unknown plan", () => {
    expect(getPlanLimits("unknown")).toEqual(getPlanLimits("free"));
  });

  it("matches the PRD §6 values exactly", () => {
    expect(getPlanLimits("free")).toEqual({
      agents: 1,
      sourcesPerAgent: 5,
      pagesPerSite: 25,
      messagesPerMonth: 200,
      notion: false,
      api: false,
      removeBadge: false,
      members: 1,
    });
    expect(getPlanLimits("pro")).toEqual({
      agents: 5,
      sourcesPerAgent: 25,
      pagesPerSite: 100,
      messagesPerMonth: 2000,
      notion: true,
      api: true,
      removeBadge: true,
      members: 3,
    });
    expect(getPlanLimits("team")).toEqual({
      agents: 15,
      sourcesPerAgent: 50,
      pagesPerSite: 100,
      messagesPerMonth: 10000,
      notion: true,
      api: true,
      removeBadge: true,
      members: 10,
    });
  });
});
