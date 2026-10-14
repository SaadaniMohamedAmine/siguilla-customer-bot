import { headers } from "next/headers";
import { requireOrgPage } from "@/lib/session";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getUsage } from "@/lib/billing/usage";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default async function SettingsPage() {
  const { user, org, role } = await requireOrgPage();

  const [members, invitations, notion, usage, apiKeysResult, account] = await Promise.all([
    prisma.member.findMany({
      where: { organizationId: org.id },
      include: { user: { select: { name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({ where: { organizationId: org.id, status: "pending" } }),
    prisma.notionConnection.findUnique({ where: { organizationId: org.id } }),
    getUsage(org.id),
    auth.api
      .listApiKeys({ query: { organizationId: org.id }, headers: await headers() })
      .catch(() => ({ apiKeys: [] })),
    prisma.account.findFirst({ where: { userId: user.id, providerId: "credential" } }),
  ]);
  const notionSourceCount = notion
    ? await prisma.dataSource.count({ where: { type: "notion", chatbot: { organizationId: org.id } } })
    : 0;

  return (
    <SettingsTabs
      user={{ name: user.name, email: user.email, image: user.image ?? null, hasPassword: !!account }}
      org={{
        id: org.id,
        name: org.name,
        plan: org.plan,
        isDemo: org.isDemo,
        stripeSubscriptionId: org.stripeSubscriptionId,
        stripeSubscriptionStatus: org.stripeSubscriptionStatus,
      }}
      role={role}
      members={members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
      }))}
      invitations={invitations.map((i) => ({ id: i.id, email: i.email, role: i.role }))}
      notion={
        notion
          ? {
              workspaceName: notion.workspaceName,
              workspaceIcon: notion.workspaceIcon,
              sourceCount: notionSourceCount,
            }
          : null
      }
      usage={usage}
      apiKeys={apiKeysResult.apiKeys.map((k) => ({
        id: k.id,
        name: k.name,
        start: k.start,
        prefix: k.prefix,
        createdAt: k.createdAt as unknown as string,
        lastRequest: k.lastRequest as unknown as string | null,
      }))}
    />
  );
}
