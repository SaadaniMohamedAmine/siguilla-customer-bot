"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Avatar } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";
import { TestCardPill } from "@/components/marketing/test-card-pill";
import {
  AddIcon,
  AnalyticsIcon,
  CheckIcon,
  CopyIcon,
  DeleteIcon,
  HumanIcon,
  KeyIcon,
  LinkIcon,
  LockIcon,
  MoonIcon,
  NotionIcon,
  SunIcon,
  UserIcon,
} from "@/lib/icons";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { passwordStrength } from "@/lib/validation/auth";
import { useHydrated } from "@/lib/use-hydrated";
import { getPlanLimits, usePlanDetails, PLAN_PRICES, type PlanId } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

function redirectTo(url: string) {
  window.location.href = url;
}

const TABS = [
  { id: "profile", icon: UserIcon, label: "profile" },
  { id: "organization", icon: HumanIcon, label: "organization" },
  { id: "billing", icon: AnalyticsIcon, label: "billing" },
  { id: "api-keys", icon: KeyIcon, label: "apiKeys" },
  { id: "integrations", icon: LinkIcon, label: "integrations" },
] as const;
type Tab = (typeof TABS)[number]["id"];

type Props = {
  user: { name: string; email: string; image: string | null; hasPassword: boolean };
  org: {
    id: string;
    name: string;
    plan: string;
    isDemo: boolean;
    stripeSubscriptionId: string | null;
    stripeSubscriptionStatus: string | null;
  };
  role: "owner" | "admin" | "member";
  members: { id: string; userId: string; name: string; email: string; image: string | null; role: string }[];
  invitations: { id: string; email: string; role: string | null }[];
  notion: { workspaceName: string | null; workspaceIcon: string | null; sourceCount: number } | null;
  usage: Awaited<ReturnType<typeof import("@/lib/billing/usage").getUsage>>;
  apiKeys: {
    id: string;
    name: string | null;
    start: string | null;
    prefix: string | null;
    createdAt: string;
    lastRequest: string | null;
  }[];
};

export function SettingsTabs(props: Props) {
  const t = useTranslations("Settings");
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const tab: Tab = TABS.some((x) => x.id === requested) ? (requested as Tab) : "profile";
  const canManage = props.role !== "member";

  React.useEffect(() => {
    const billing = searchParams.get("billing");
    if (billing === "success") toast.success(t("planUpdated"));
    if (billing === "canceled") toast.error(t("checkoutCanceled"));
  }, [searchParams, t]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 text-text font-serif">{t("title")}</h1>
        <p className="text-body text-text-muted mt-2 max-w-xl">{t("subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10">
        <nav
          aria-label={t("title")}
          className="no-scrollbar -mx-2 flex gap-1 overflow-x-auto overflow-y-hidden px-2 pb-1 md:sticky md:top-10 md:mx-0 md:flex-col md:self-start md:overflow-visible md:px-0 md:pb-0"
        >
          {TABS.map((x) => {
            const active = tab === x.id;
            return (
              <button
                key={x.id}
                onClick={() => router.push(`/settings?tab=${x.id}`)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "anim-keep text-body relative flex shrink-0 items-center gap-2.5 rounded-sm px-3 py-2 text-left whitespace-nowrap transition-colors duration-200",
                  active ? "bg-tint text-text" : "text-text-muted hover:bg-surface hover:text-text",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "anim-keep bg-accent absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full transition-transform duration-300 ease-[var(--ease-lux)]",
                    active ? "scale-y-100" : "scale-y-0",
                  )}
                />
                <Icon icon={x.icon} size={17} className={active ? "text-link" : undefined} />
                {t(`tabs.${x.label}`)}
              </button>
            );
          })}
        </nav>
        <div key={tab} className="page-in anim-keep max-w-3xl min-w-0">
          {tab === "profile" ? <ProfileTab user={props.user} isDemo={props.org.isDemo} /> : null}
          {tab === "organization" ? (
            <OrganizationTab
              org={props.org}
              role={props.role}
              members={props.members}
              invitations={props.invitations}
            />
          ) : null}
          {tab === "billing" ? <BillingTab org={props.org} usage={props.usage} canManage={canManage} /> : null}
          {tab === "api-keys" ? (
            <ApiKeysTab apiKeys={props.apiKeys} canManage={canManage} plan={props.org.plan} />
          ) : null}
          {tab === "integrations" ? <IntegrationsTab notion={props.notion} plan={props.org.plan} /> : null}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface mb-6 rounded-lg border p-6">
      <h2 className="text-h3 text-text font-serif">{title}</h2>
      {description ? <p className="text-small text-text-muted mt-1">{description}</p> : null}
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function DangerZone({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-error/30 bg-error/5 rounded-lg border p-6">
      <h2 className="text-h3 text-text font-serif">{title}</h2>
      <p className="text-small text-text-muted mt-1">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Invitation à passer à l'offre supérieure, affichée à la place d'une fonctionnalité verrouillée. */
function LockedState({ title, body }: { title: string; body: string }) {
  const t = useTranslations("Settings");
  return (
    <div className="border-border bg-bg flex flex-col items-center rounded-md border border-dashed px-6 py-10 text-center">
      <span className="border-border bg-surface text-link flex size-12 items-center justify-center rounded-full border">
        <Icon icon={LockIcon} size={20} />
      </span>
      <p className="text-h3 text-text mt-4 font-serif">{title}</p>
      <p className="text-body text-text-muted mt-2 max-w-sm">{body}</p>
      <Link href="/settings?tab=billing" className="mt-5">
        <Button>{t("seePlans")}</Button>
      </Link>
    </div>
  );
}

function ProfileTab({ user, isDemo }: { user: Props["user"]; isDemo: boolean }) {
  const t = useTranslations("Settings");
  const ta = useTranslations("Auth");
  const { theme, setTheme } = useTheme();
  const mounted = useHydrated();
  const [name, setName] = React.useState(user.name);
  const [saving, setSaving] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const strength = newPassword ? passwordStrength(newPassword) : null;
  const LEVEL = { weak: 1, fair: 2, strong: 3 } as const;
  const dirty = name.trim() !== user.name && name.trim().length > 0;

  async function saveName() {
    setSaving(true);
    try {
      await authClient.updateUser({ name });
      toast.success(t("saved"));
    } catch {
      toast.error(t("genericError"));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    try {
      await authClient.changePassword({ newPassword, currentPassword });
      toast.success(t("passwordUpdated"));
      setNewPassword("");
      setCurrentPassword("");
    } catch {
      toast.error(t("passwordError"));
    }
  }

  async function deleteAccount() {
    try {
      await authClient.deleteUser({});
      redirectTo("/");
    } catch {
      toast.error(t("deleteAccountError"));
    }
  }

  const themes = [
    { id: "dark", icon: MoonIcon, label: t("themeDark") },
    { id: "light", icon: SunIcon, label: t("themeLight") },
  ] as const;

  return (
    <>
      <Section title={t("profileTitle")} description={t("profileDesc")}>
        <div className="flex items-center gap-4">
          <Avatar name={user.name} src={user.image} size={64} />
          <div className="min-w-0">
            <p className="text-body-lg text-text truncate">{user.name}</p>
            <p className="text-small text-text-muted truncate">{user.email}</p>
          </div>
        </div>
        <Input label={t("name")} value={name} onChange={(e) => setName(e.target.value)} disabled={isDemo} />
        <Input label={t("email")} value={user.email} disabled />
        <Button onClick={saveName} loading={saving} disabled={isDemo || !dirty} className="self-start">
          {t("saveChanges")}
        </Button>
      </Section>

      {user.hasPassword ? (
        <Section title={t("passwordTitle")} description={t("passwordDesc")}>
          <PasswordInput
            label={t("currentPassword")}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <div>
            <PasswordInput
              label={t("newPassword")}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {strength ? (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3].map((seg) => (
                    <span
                      key={seg}
                      className={cn(
                        "bg-border h-1 flex-1 rounded-full",
                        seg <= LEVEL[strength] &&
                          (strength === "strong" ? "bg-success" : strength === "fair" ? "bg-warning" : "bg-error"),
                      )}
                    />
                  ))}
                </div>
                <span className="text-small text-text-muted">{ta(`strength.${strength}`)}</span>
              </div>
            ) : null}
          </div>
          <Button
            onClick={changePassword}
            disabled={!newPassword || !currentPassword || isDemo}
            className="self-start"
          >
            {t("updatePassword")}
          </Button>
        </Section>
      ) : null}

      <Section title={t("prefsTitle")} description={t("prefsDesc")}>
        <div role="radiogroup" aria-label={t("themeLabel")} className="grid max-w-sm grid-cols-2 gap-3">
          {themes.map((x) => {
            const active = mounted && theme === x.id;
            return (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(x.id)}
                className={cn(
                  "anim-keep text-body flex items-center justify-between rounded-md border px-4 py-3 transition-colors duration-200",
                  active ? "border-accent bg-tint text-text" : "border-border text-text-muted hover:border-text-muted",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon icon={x.icon} size={18} />
                  {x.label}
                </span>
                {active ? <Icon icon={CheckIcon} size={16} className="text-link" /> : null}
              </button>
            );
          })}
        </div>
      </Section>

      <DangerZone title={t("dangerTitle")} description={t("deleteAccountDesc")}>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" disabled={isDemo}>
              {t("deleteAccount")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{t("deleteAccountTitle")}</DialogTitle>
            <DialogDescription>{t("deleteAccountBody")}</DialogDescription>
            <Input className="mt-4" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
            <DialogFooter>
              <Button variant="destructive" disabled={deleteConfirm !== "DELETE"} onClick={deleteAccount}>
                {t("deleteAccount")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DangerZone>
    </>
  );
}

function RoleBadge({ role }: { role: string }) {
  const t = useTranslations("Settings");
  const label = role === "owner" ? t("roleOwner") : role === "admin" ? t("roleAdmin") : t("roleMember");
  return (
    <span
      className={cn(
        "text-small rounded-full border px-2.5 py-0.5",
        role === "owner" ? "border-accent/50 bg-tint text-link" : "border-border text-text-muted",
      )}
    >
      {label}
    </span>
  );
}

function OrganizationTab({
  org,
  role,
  members,
  invitations,
}: {
  org: Props["org"];
  role: Props["role"];
  members: Props["members"];
  invitations: Props["invitations"];
}) {
  const t = useTranslations("Settings");
  const router = useRouter();
  const [name, setName] = React.useState(org.name);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("member");
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const limits = getPlanLimits(org.plan);
  const used = members.length + invitations.length;
  const atLimit = used >= limits.members;
  const dirty = name.trim() !== org.name && name.trim().length > 0;

  async function saveName() {
    try {
      await authClient.organization.update({ data: { name }, organizationId: org.id });
      toast.success(t("saved"));
      router.refresh();
    } catch {
      toast.error(t("genericError"));
    }
  }

  async function invite() {
    try {
      const res = await authClient.organization.inviteMember({
        email: inviteEmail,
        role: inviteRole as "member" | "admin",
        organizationId: org.id,
      });
      const id = (res.data as { id: string } | null)?.id;
      if (id) setInviteLink(`${window.location.origin}/invite/${id}`);
      router.refresh();
    } catch {
      toast.error(t("inviteError"));
    }
  }

  async function removeMember(memberId: string) {
    try {
      await authClient.organization.removeMember({ memberIdOrEmail: memberId, organizationId: org.id });
      router.refresh();
    } catch {
      toast.error(t("genericError"));
    }
  }

  async function updateRole(memberId: string, newRole: string) {
    try {
      await authClient.organization.updateMemberRole({
        memberId,
        role: newRole as "member" | "admin" | "owner",
        organizationId: org.id,
      });
      router.refresh();
    } catch {
      toast.error(t("genericError"));
    }
  }

  async function cancelInvite(id: string) {
    try {
      await authClient.organization.cancelInvitation({ invitationId: id });
      router.refresh();
    } catch {
      toast.error(t("genericError"));
    }
  }

  async function deleteOrg() {
    try {
      await api(`/api/organization`, { method: "DELETE" });
      redirectTo("/");
    } catch {
      toast.error(t("deleteOrgError"));
    }
  }

  return (
    <>
      <Section title={t("orgTitle")} description={t("orgDesc")}>
        <Input label={t("name")} value={name} onChange={(e) => setName(e.target.value)} disabled={role === "member"} />
        <Button onClick={saveName} disabled={role === "member" || !dirty} className="self-start">
          {t("saveChanges")}
        </Button>
      </Section>

      <Section title={t("membersTitle")} description={t("membersDesc")}>
        <p className="text-small text-text-muted font-mono">{t("seats", { used, limit: limits.members })}</p>
        <ul className="divide-border border-border divide-y rounded-md border">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={m.name} src={m.image} size={36} />
                <div className="min-w-0">
                  <p className="text-body text-text truncate">{m.name}</p>
                  <p className="text-small text-text-muted truncate">{m.email}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {role === "owner" && m.role !== "owner" ? (
                  <Select value={m.role} onValueChange={(v) => updateRole(m.id, v)}>
                    <SelectTrigger className="text-small h-8 w-28" aria-label={t("roleFor", { name: m.name })}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">{t("roleMember")}</SelectItem>
                      <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <RoleBadge role={m.role} />
                )}
                {role !== "member" && m.role !== "owner" ? (
                  <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)} aria-label={t("remove")}>
                    <Icon icon={DeleteIcon} size={14} />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {invitations.length > 0 ? (
          <div>
            <p className="text-small text-text-muted mb-2">{t("pending")}</p>
            <ul className="divide-border border-border divide-y rounded-md border">
              {invitations.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="text-small text-text truncate">{i.email}</span>
                  <Button variant="ghost" size="sm" onClick={() => cancelInvite(i.id)}>
                    {t("cancel")}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {role !== "member" ? (
          inviteOpen ? (
            <div className="border-border flex flex-col gap-3 rounded-md border p-4">
              {inviteLink ? (
                <div className="flex items-center gap-2">
                  <code className="border-border bg-surface-raised text-small flex-1 truncate rounded-sm border px-2 py-1.5 font-mono">
                    {inviteLink}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("copy")}
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      toast.success(t("copied"));
                    }}
                  >
                    <Icon icon={CopyIcon} size={14} />
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder={t("invitePlaceholder")}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="text-small h-9 w-32" aria-label={t("roleForNew")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">{t("roleMember")}</SelectItem>
                      <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={invite} disabled={!inviteEmail || atLimit} className="self-start">
                    {t("sendInvite")}
                  </Button>
                  {atLimit ? (
                    <p className="text-small text-warning">{t("planAllows", { count: limits.members })}</p>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <Button onClick={() => setInviteOpen(true)} disabled={atLimit} className="self-start">
              <Icon icon={AddIcon} size={14} />
              {t("invite")}
            </Button>
          )
        ) : null}
        {atLimit && !inviteOpen && role !== "member" ? (
          <p className="text-small text-warning">{t("planAllows", { count: limits.members })}</p>
        ) : null}
      </Section>

      {role === "owner" ? (
        <DangerZone title={t("dangerTitle")} description={t("deleteOrgDesc")}>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">{t("deleteOrg")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>{t("deleteOrgTitle")}</DialogTitle>
              <DialogDescription>
                {t.rich("deleteOrgBody", { name: org.name, b: (chunks) => <strong>{chunks}</strong> })}
              </DialogDescription>
              <Input className="mt-4" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
              <DialogFooter>
                <Button variant="destructive" disabled={deleteConfirm !== org.name} onClick={deleteOrg}>
                  {t("deleteOrg")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DangerZone>
      ) : null}
    </>
  );
}

function BillingTab({
  org,
  usage,
  canManage,
}: {
  org: Props["org"];
  usage: Props["usage"];
  canManage: boolean;
}) {
  const t = useTranslations("Settings");
  const tp = useTranslations("Pricing");
  const plans = usePlanDetails();
  const [loading, setLoading] = React.useState<string | null>(null);

  async function checkout(plan: "pro" | "team") {
    setLoading(plan);
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      redirectTo(url);
    } catch {
      toast.error(t("genericError"));
      setLoading(null);
    }
  }

  async function portal() {
    setLoading("portal");
    try {
      const { url } = await api<{ url: string }>("/api/billing/portal", { method: "POST" });
      redirectTo(url);
    } catch {
      toast.error(t("genericError"));
      setLoading(null);
    }
  }

  const gauges: { label: string; used: number; limit: number }[] = [
    { label: t("gaugeMessages"), used: usage.messages.used, limit: usage.messages.limit },
    { label: t("gaugeAgents"), used: usage.agents.used, limit: usage.agents.limit },
    { label: t("gaugeSources"), used: usage.sources.used, limit: usage.sources.limit },
    { label: t("gaugeMembers"), used: usage.members.used, limit: usage.members.limit },
  ];
  const currentName = plans[org.plan as PlanId]?.name ?? org.plan;

  return (
    <>
      <div className="mb-6">
        <TestCardPill label={tp("testMode")} />
      </div>

      <Section title={t("currentPlan")} description={t("usageDesc")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-h2 text-text font-serif">{currentName}</p>
            <span className="border-accent/50 bg-tint text-link text-small rounded-full border px-2.5 py-0.5">
              {org.plan !== "free" ? t("renewsMonthly") : t("freePlan")}
            </span>
          </div>
          {org.stripeSubscriptionId ? (
            <Button variant="ghost" loading={loading === "portal"} onClick={portal} disabled={!canManage}>
              {t("manageBilling")}
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          {gauges.map((g) => {
            const ratio = g.limit > 0 ? g.used / g.limit : 0;
            const over = ratio > 1;
            const full = ratio >= 1;
            const warn = ratio >= 0.8;
            return (
              <div key={g.label}>
                <div className="text-small mb-1.5 flex justify-between">
                  <span className="text-text-muted">{g.label}</span>
                  <span className={cn("font-mono", over ? "text-error" : warn ? "text-warning" : "text-text-muted")}>
                    {g.used} / {g.limit}
                  </span>
                </div>
                <div className="bg-surface-raised h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={cn("h-full rounded-full", full ? "bg-error" : warn ? "bg-warning" : "bg-accent")}
                    style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                  />
                </div>
                {over ? (
                  <p className="text-small text-error mt-1">{t("overLimit")}</p>
                ) : warn ? (
                  <p className="text-small text-warning mt-1">{t("nearLimit")}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </Section>

      <h2 className="text-h3 text-text mb-4 font-serif">{t("upgradeTitle")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(["pro", "team"] as const).map((p) => {
          const isCurrent = org.plan === p;
          const featured = p === "pro";
          return (
            <div
              key={p}
              className={cn(
                "bg-surface flex flex-col rounded-lg border p-5",
                featured && !isCurrent ? "border-accent" : "border-border",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-h3 text-text font-serif">{plans[p].name}</p>
                {isCurrent ? (
                  <span className="border-accent/50 bg-tint text-link text-small rounded-full border px-2.5 py-0.5">
                    {t("currentBadge")}
                  </span>
                ) : featured ? (
                  <span className="bg-accent text-on-accent rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
                    {t("recommended")}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="text-kpi text-text font-serif">${PLAN_PRICES[p]}</span>
                <span className="text-body text-text-muted">{tp("month")}</span>
              </p>
              <ul className="text-small text-text-muted mt-4 flex flex-1 flex-col gap-2">
                {plans[p].features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Icon icon={CheckIcon} size={14} className="text-link mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? null : (
                <Button className="mt-5 w-full" loading={loading === p} disabled={!canManage} onClick={() => checkout(p)}>
                  {tp("upgradeTo", { plan: plans[p].name })}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ApiKeysTab({
  apiKeys,
  canManage,
  plan,
}: {
  apiKeys: Props["apiKeys"];
  canManage: boolean;
  plan: string;
}) {
  const t = useTranslations("Settings");
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [created, setCreated] = React.useState<{ key: string } | null>(null);

  if (!getPlanLimits(plan).api) {
    return (
      <Section title={t("apiTitle")} description={t("apiDesc")}>
        <LockedState title={t("apiLockedTitle")} body={t("apiLockedBody")} />
      </Section>
    );
  }

  async function create() {
    try {
      const res = await api<{ key: string }>("/api/keys", { method: "POST", body: JSON.stringify({ name }) });
      setCreated(res);
      router.refresh();
    } catch {
      toast.error(t("genericError"));
    }
  }

  async function revoke(id: string) {
    try {
      await api(`/api/keys?id=${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      toast.error(t("genericError"));
    }
  }

  return (
    <Section title={t("apiTitle")} description={t("apiDesc")}>
      {apiKeys.length === 0 ? (
        <p className="text-small text-text-muted">{t("noKeys")}</p>
      ) : (
        <ul className="divide-border border-border divide-y rounded-md border">
          {apiKeys.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-3">
                <span className="border-border bg-surface-raised text-link flex size-9 items-center justify-center rounded-md border">
                  <Icon icon={KeyIcon} size={16} />
                </span>
                <div>
                  <p className="text-body text-text">{k.name}</p>
                  <p className="text-small text-text-muted font-mono">{k.prefix}…</p>
                </div>
              </div>
              {canManage ? (
                <Button variant="link" className="text-error" onClick={() => revoke(k.id)}>
                  {t("revoke")}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {canManage ? (
        <Dialog
          open={createOpen}
          onOpenChange={(v) => {
            setCreateOpen(v);
            if (!v) setCreated(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="self-start">
              <Icon icon={AddIcon} size={14} />
              {t("createKey")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            {created ? (
              <>
                <DialogTitle>{t("newKeyTitle")}</DialogTitle>
                <DialogDescription>{t("copyNow")}</DialogDescription>
                <div className="mt-3 flex items-center gap-2">
                  <code className="border-border bg-surface-raised text-small flex-1 truncate rounded-sm border px-2 py-1.5 font-mono">
                    {created.key}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("copy")}
                    onClick={() => {
                      navigator.clipboard.writeText(created.key);
                      toast.success(t("copied"));
                    }}
                  >
                    <Icon icon={CopyIcon} size={14} />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DialogTitle>{t("createKey")}</DialogTitle>
                <Input className="mt-4" placeholder={t("name")} value={name} onChange={(e) => setName(e.target.value)} />
                <DialogFooter>
                  <Button onClick={create} disabled={!name.trim()}>
                    {t("create")}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      ) : null}
    </Section>
  );
}

function IntegrationsTab({ notion, plan }: { notion: Props["notion"]; plan: string }) {
  const t = useTranslations("Settings");
  const notionAllowed = getPlanLimits(plan).notion;

  async function disconnect() {
    try {
      await api("/api/notion", { method: "DELETE" });
      window.location.reload();
    } catch {
      toast.error(t("genericError"));
    }
  }

  return (
    <>
      <Section title={t("notionTitle")} description={t("notionDesc")}>
        {!notionAllowed ? (
          <LockedState title={t("notionLockedTitle")} body={t("notionLockedBody")} />
        ) : notion ? (
          <div className="border-border flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
            <div className="flex items-center gap-3">
              <span className="border-border bg-surface-raised flex size-10 items-center justify-center rounded-md border">
                <Icon icon={NotionIcon} size={20} />
              </span>
              <div>
                <p className="text-body text-text flex items-center gap-2">
                  {notion.workspaceName ?? t("connectedWorkspace")}
                  <span className="border-success/40 bg-success/10 text-success rounded-full border px-2 py-0.5 text-[11px]">
                    {t("connected")}
                  </span>
                </p>
                <p className="text-small text-text-muted">{t("pagesSynced", { count: notion.sourceCount })}</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-error">
                  {t("disconnect")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>{t("disconnectTitle")}</DialogTitle>
                <DialogDescription>{t("disconnectBody")}</DialogDescription>
                <DialogFooter>
                  <Button variant="destructive" onClick={disconnect}>
                    {t("disconnect")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <a href="/api/notion/connect" className="self-start">
            <Button>
              <Icon icon={NotionIcon} size={16} />
              {t("connectWorkspace")}
            </Button>
          </a>
        )}
      </Section>
      <div className="border-border text-small text-text-muted rounded-lg border border-dashed p-5 text-center">
        {t("moreSoon")}
      </div>
    </>
  );
}
