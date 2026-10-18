import { describe, it, expect } from "vitest";
import { hasFreeSeat } from "@/lib/billing/seats";

describe("hasFreeSeat", () => {
  it("Free: the owner alone fills the only seat", () => {
    expect(hasFreeSeat(1, "free")).toBe(false);
  });

  it("Pro: 3 seats, counting pending invitations", () => {
    expect(hasFreeSeat(2, "pro")).toBe(true);
    expect(hasFreeSeat(3, "pro")).toBe(false);
  });

  it("Team: 10 seats", () => {
    expect(hasFreeSeat(9, "team")).toBe(true);
    expect(hasFreeSeat(10, "team")).toBe(false);
  });

  it("treats an unknown plan as Free", () => {
    expect(hasFreeSeat(1, "enterprise")).toBe(false);
    expect(hasFreeSeat(0, "enterprise")).toBe(true);
  });
});
