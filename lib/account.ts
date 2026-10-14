import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe/client";

export class AccountError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function deleteOrganization(organizationId: string) {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  if (org.isDemo) throw new AccountError(403, "The demo organization cannot be deleted.");

  if (org.stripeSubscriptionId && org.stripeSubscriptionStatus === "active") {
    await getStripe()
      .subscriptions.cancel(org.stripeSubscriptionId)
      .catch(() => {});
  }

  const blobUrls = (
    await prisma.dataSource.findMany({
      where: { chatbot: { organizationId }, blobUrl: { not: null } },
      select: { blobUrl: true },
    })
  )
    .map((s) => s.blobUrl)
    .filter((u): u is string => !!u);
  await Promise.all(blobUrls.map((url) => del(url).catch(() => {})));

  await prisma.organization.delete({ where: { id: organizationId } });
}

/** Pour chaque org où l'utilisateur est seul owner, supprime l'org ; sinon retire juste le membership. */
export async function prepareAccountDeletion(userId: string) {
  const memberships = await prisma.member.findMany({ where: { userId }, include: { organization: true } });
  for (const m of memberships) {
    if (m.role !== "owner") {
      await prisma.member.delete({ where: { id: m.id } });
      continue;
    }
    const otherOwners = await prisma.member.count({
      where: { organizationId: m.organizationId, role: "owner", userId: { not: userId } },
    });
    if (otherOwners > 0) {
      await prisma.member.delete({ where: { id: m.id } });
    } else {
      await deleteOrganization(m.organizationId);
    }
  }
}
