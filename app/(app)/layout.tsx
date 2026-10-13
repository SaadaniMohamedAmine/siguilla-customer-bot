import { requireOrgPage } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, org } = await requireOrgPage();
  return (
    <AppShell org={{ id: org.id, name: org.name }} user={{ name: user.name, email: user.email, image: user.image }} plan={org.plan}>
      {children}
    </AppShell>
  );
}
