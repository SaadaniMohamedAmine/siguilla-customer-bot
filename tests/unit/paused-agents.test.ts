import { describe, it, expect, vi, beforeEach } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { chatbot: { findMany } } }));

import { splitByPlanLimit, pausedAgentIds, isAgentPaused } from "@/lib/billing/paused";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("splitByPlanLimit", () => {
  it("keeps the N oldest agents active and pauses the rest", () => {
    const agents = ["a", "b", "c", "d"];
    expect(splitByPlanLimit(agents, 1)).toEqual({ active: ["a"], paused: ["b", "c", "d"] });
    expect(splitByPlanLimit(agents, 3)).toEqual({ active: ["a", "b", "c"], paused: ["d"] });
  });

  it("pauses nothing when the plan allows at least as many agents as exist", () => {
    expect(splitByPlanLimit(["a", "b"], 5)).toEqual({ active: ["a", "b"], paused: [] });
    expect(splitByPlanLimit([], 1)).toEqual({ active: [], paused: [] });
  });

  it("never throws on a zero or negative limit: everything is paused", () => {
    expect(splitByPlanLimit(["a"], 0).paused).toEqual(["a"]);
    expect(splitByPlanLimit(["a"], -2).paused).toEqual(["a"]);
  });
});

describe("pausedAgentIds", () => {
  it("asks the database for the agents beyond the plan limit, oldest first", async () => {
    findMany.mockResolvedValue([{ id: "z1" }, { id: "z2" }]);
    const ids = await pausedAgentIds("org1", "free");
    expect(findMany).toHaveBeenCalledWith({
      where: { organizationId: "org1" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
      skip: 1,
    });
    expect([...ids]).toEqual(["z1", "z2"]);
  });

  it("skips more agents on a larger plan (Pro: 5, Team: 15)", async () => {
    findMany.mockResolvedValue([]);
    await pausedAgentIds("org1", "pro");
    expect(findMany.mock.calls[0][0].skip).toBe(5);
    await pausedAgentIds("org1", "team");
    expect(findMany.mock.calls[1][0].skip).toBe(15);
  });
});

describe("isAgentPaused", () => {
  it("is true only for an agent in the paused set", async () => {
    findMany.mockResolvedValue([{ id: "extra" }]);
    expect(await isAgentPaused("org1", "free", "extra")).toBe(true);
    expect(await isAgentPaused("org1", "free", "oldest")).toBe(false);
  });
});
