import { requireOrgPage } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { getUsage } from "@/lib/billing/usage";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, org } = await requireOrgPage();
  const usage = await getUsage(org.id);
  return (
    <AppShell
      org={{ id: org.id, name: org.name }}
      user={{ name: user.name, email: user.email, image: user.image }}
      plan={org.plan}
      messageUsage={usage.messages}
    >
      {children}
    </AppShell>
  );
}
