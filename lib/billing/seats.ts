import { getPlanLimits } from "./plans";

export const MEMBERS_LIMIT_CODE = "members_limit";

/** `used` = membres actuels + invitations en attente (un siège réservé par invitation). */
export function hasFreeSeat(used: number, plan: string): boolean {
  return used < getPlanLimits(plan).members;
}
