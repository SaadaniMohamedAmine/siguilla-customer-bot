"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { CopyIcon, DeleteIcon, AddIcon, NotionIcon } from "@/lib/icons";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { getPlanLimits, PLAN_ORDER, PLAN_PRICES, type PlanId } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

const TABS = ["profile", "organization", "billing", "api-keys", "integrations"] as const;
type Tab = (typeof TABS)[number];

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) ?? "profile";
  const canManage = props.role !== "member";

  React.useEffect(() => {
    const billing = searchParams.get("billing");
    if (billing === "success") toast.success("Your plan has been updated.");
    if (billing === "canceled") toast.error("Checkout canceled.");
  }, [searchParams]);

  return (
    <div>
      <h1 className="text-h1 text-text mb-8 font-serif">Settings</h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[180px_1fr]">
        <nav className="flex flex-col gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => router.push(`/settings?tab=${t}`)}
              className={cn(
                "text-body rounded-sm px-3 py-2 text-left capitalize transition-colors",
                tab === t ? "bg-accent text-on-accent" : "text-text-muted hover:bg-surface hover:text-text",
              )}
            >
              {t.replace("-", " ")}
            </button>
          ))}
        </nav>
        <div>
          {tab === "profile" ? <ProfileTab user={props.user} isDemo={props.org.isDemo} /> : null}
          {tab === "organization" ? (
            <OrganizationTab
              org={props.org}
              role={props.role}
              members={props.members}
              invitations={props.invitations}
            />
          ) : null}
          {tab === "billing" ? (
            <BillingTab org={props.org} usage={props.usage} canManage={canManage} />
          ) : null}
          {tab === "api-keys" ? (
            <ApiKeysTab apiKeys={props.apiKeys} canManage={canManage} plan={props.org.plan} />
          ) : null}
          {tab === "integrations" ? <IntegrationsTab notion={props.notion} plan={props.org.plan} /> : null}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-border mb-6 flex flex-col gap-4 rounded-md border p-5">
      <p className="label-caps">{title}</p>
      {children}
    </div>
  );
}

function ProfileTab({ user, isDemo }: { user: Props["user"]; isDemo: boolean }) {
  const { theme, setTheme } = useTheme();
  const [name, setName] = React.useState(user.name);
  const [saving, setSaving] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [deleteConfirm, setDeleteConfirm] = React.useState("");

  async function saveName() {
    setSaving(true);
    try {
      await authClient.updateUser({ name });
      toast.success("Saved.");
    } catch {
      toast.error("Something went wrong on our side.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    try {
      await authClient.changePassword({ newPassword, currentPassword });
      toast.success("Password updated.");
      setNewPassword("");
      setCurrentPassword("");
    } catch {
      toast.error("Could not update password.");
    }
  }

  async function deleteAccount() {
    try {
      await authClient.deleteUser({});
      window.location.href = "/";
    } catch {
      toast.error("Could not delete account.");
    }
  }

  return (
    <>
      <Section title="Profile">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.image} size={48} />
        </div>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={isDemo} />
        <Input label="Email" value={user.email} disabled />
        <Button onClick={saveName} loading={saving} disabled={isDemo} className="self-start">
          Save
        </Button>
      </Section>

      {user.hasPassword ? (
        <Section title="Password">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button
            onClick={changePassword}
            disabled={!newPassword || !currentPassword || isDemo}
            className="self-start"
          >
            Update password
          </Button>
        </Section>
      ) : null}

      <Section title="Preferences">
        <div className="flex items-center justify-between">
          <p className="text-body text-text">Dark theme</p>
          <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
        </div>
      </Section>

      <div className="border-error/30 rounded-md border p-5">
        <p className="text-h3 text-text font-serif">Danger zone</p>
        <p className="text-small text-text-muted mt-1">Deleting your account is permanent.</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="mt-3" disabled={isDemo}>
              Delete account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>Type DELETE to confirm. This cannot be undone.</DialogDescription>
            <Input
              className="mt-4"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
            <DialogFooter>
              <Button variant="destructive" disabled={deleteConfirm !== "DELETE"} onClick={deleteAccount}>
                Delete account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
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
  const router = useRouter();
  const [name, setName] = React.useState(org.name);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("member");
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const limits = getPlanLimits(org.plan);
  const atLimit = members.length + invitations.length >= limits.members;

  async function saveName() {
    try {
      await authClient.organization.update({ data: { name }, organizationId: org.id });
      toast.success("Saved.");
      router.refresh();
    } catch {
      toast.error("Something went wrong on our side.");
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
      toast.error("Could not send invitation.");
    }
  }

  async function removeMember(memberId: string) {
    try {
      await authClient.organization.removeMember({ memberIdOrEmail: memberId, organizationId: org.id });
      router.refresh();
    } catch {
      toast.error("Something went wrong on our side.");
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
      toast.error("Something went wrong on our side.");
    }
  }

  async function cancelInvite(id: string) {
    try {
      await authClient.organization.cancelInvitation({ invitationId: id });
      router.refresh();
    } catch {
      toast.error("Something went wrong on our side.");
    }
  }

  async function deleteOrg() {
    try {
      await api(`/api/organization`, { method: "DELETE" });
      window.location.href = "/";
    } catch {
      toast.error("Could not delete organization.");
    }
  }

  return (
    <>
      <Section title="Organization">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={role === "member"}
        />
        <Button onClick={saveName} disabled={role === "member"} className="self-start">
          Save
        </Button>
      </Section>

      <Section title="Members">
        <ul className="flex flex-col gap-3">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Avatar name={m.name} src={m.image} size={32} />
                <div>
                  <p className="text-body text-text">{m.name}</p>
                  <p className="text-small text-text-muted">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {role === "owner" && m.role !== "owner" ? (
                  <Select value={m.role} onValueChange={(v) => updateRole(m.id, v)}>
                    <SelectTrigger className="text-small h-8 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-small text-text-muted capitalize">{m.role}</span>
                )}
                {role !== "member" && m.role !== "owner" ? (
                  <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)} aria-label="Remove">
                    <Icon icon={DeleteIcon} size={14} />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {invitations.length > 0 ? (
          <div className="border-border border-t pt-3">
            <p className="text-small text-text-muted mb-2">Pending invitations</p>
            {invitations.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-1">
                <span className="text-small text-text">{i.email}</span>
                <Button variant="ghost" size="sm" onClick={() => cancelInvite(i.id)}>
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {role !== "member" ? (
          inviteOpen ? (
            <div className="border-border flex flex-col gap-3 border-t pt-4">
              {inviteLink ? (
                <div className="flex items-center gap-2">
                  <code className="border-border bg-surface-raised text-small flex-1 truncate rounded-sm border px-2 py-1.5 font-mono">
                    {inviteLink}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      toast.success("Copied");
                    }}
                  >
                    <Icon icon={CopyIcon} size={14} />
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="text-small h-9 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={invite} disabled={!inviteEmail || atLimit} className="self-start">
                    Send invitation
                  </Button>
                  {atLimit ? (
                    <p className="text-small text-warning">
                      Your plan allows {limits.members} member(s). Upgrade to add more.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <Button
              variant="subtle"
              onClick={() => setInviteOpen(true)}
              disabled={atLimit}
              className="self-start"
            >
              <Icon icon={AddIcon} size={14} />
              Invite member
            </Button>
          )
        ) : null}
      </Section>

      {role === "owner" ? (
        <div className="border-error/30 rounded-md border p-5">
          <p className="text-h3 text-text font-serif">Danger zone</p>
          <p className="text-small text-text-muted mt-1">
            Deleting this organization removes everything in it.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="mt-3">
                Delete organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Delete this organization?</DialogTitle>
              <DialogDescription>
                Type <strong>{org.name}</strong> to confirm. This cannot be undone.
              </DialogDescription>
              <Input
                className="mt-4"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
              <DialogFooter>
                <Button variant="destructive" disabled={deleteConfirm !== org.name} onClick={deleteOrg}>
                  Delete organization
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
  const [loading, setLoading] = React.useState<string | null>(null);

  async function checkout(plan: "pro" | "team") {
    setLoading(plan);
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      window.location.href = url;
    } catch {
      toast.error("Something went wrong on our side.");
      setLoading(null);
    }
  }

  async function portal() {
    setLoading("portal");
    try {
      const { url } = await api<{ url: string }>("/api/billing/portal", { method: "POST" });
      window.location.href = url;
    } catch {
      toast.error("Something went wrong on our side.");
      setLoading(null);
    }
  }

  const gauges: { label: string; used: number; limit: number }[] = [
    { label: "Messages", used: usage.messages.used, limit: usage.messages.limit },
    { label: "Agents", used: usage.agents.used, limit: usage.agents.limit },
    { label: "Sources", used: usage.sources.used, limit: usage.sources.limit },
    { label: "Members", used: usage.members.used, limit: usage.members.limit },
  ];

  return (
    <>
      <div className="border-border bg-surface-raised text-small text-text-muted mb-3 rounded-sm border px-3 py-2 font-mono">
        Demo mode — use test card 4242 4242 4242 4242
      </div>
      <Section title="Current plan">
        <div className="flex items-center justify-between">
          <p className="text-h2 text-text font-serif capitalize">
            {org.plan}
            {org.plan !== "free" ? " — renews monthly" : null}
          </p>
          {org.stripeSubscriptionId ? (
            <Button variant="ghost" loading={loading === "portal"} onClick={portal} disabled={!canManage}>
              Manage billing
            </Button>
          ) : null}
        </div>
        <div className="mt-2 flex flex-col gap-3">
          {gauges.map((g) => (
            <div key={g.label}>
              <div className="text-small text-text-muted mb-1 flex justify-between">
                <span>{g.label}</span>
                <span className="font-mono">
                  {g.used} / {g.limit}
                </span>
              </div>
              <div className="bg-surface-raised h-1 w-full rounded-full">
                <div
                  className="bg-accent h-1 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((g.used / g.limit) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLAN_ORDER.filter((p) => p !== "free" && p !== org.plan).map((p) => (
          <div key={p} className="border-border rounded-md border p-4">
            <p className="text-h3 text-text font-serif capitalize">{p}</p>
            <p className="text-kpi text-text font-serif">${PLAN_PRICES[p as PlanId]}/mo</p>
            <Button
              className="mt-3 w-full"
              loading={loading === p}
              disabled={!canManage}
              onClick={() => checkout(p as "pro" | "team")}
            >
              Upgrade to {p}
            </Button>
          </div>
        ))}
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
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [created, setCreated] = React.useState<{ key: string } | null>(null);

  if (!getPlanLimits(plan).api) {
    return (
      <Section title="API keys">
        <p className="text-body text-text-muted">API access is available on Pro and Team.</p>
      </Section>
    );
  }

  async function create() {
    try {
      const res = await api<{ key: string }>("/api/keys", { method: "POST", body: JSON.stringify({ name }) });
      setCreated(res);
      router.refresh();
    } catch {
      toast.error("Something went wrong on our side.");
    }
  }

  async function revoke(id: string) {
    try {
      await api(`/api/keys?id=${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      toast.error("Something went wrong on our side.");
    }
  }

  return (
    <Section title="API keys">
      <ul className="flex flex-col gap-2">
        {apiKeys.map((k) => (
          <li key={k.id} className="flex items-center justify-between">
            <div>
              <p className="text-body text-text">{k.name}</p>
              <p className="text-small text-text-muted font-mono">{k.prefix}…</p>
            </div>
            {canManage ? (
              <Button variant="link" className="text-error" onClick={() => revoke(k.id)}>
                Revoke
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {canManage ? (
        <Dialog
          open={createOpen}
          onOpenChange={(v) => {
            setCreateOpen(v);
            if (!v) setCreated(null);
          }}
        >
          <DialogTrigger asChild>
            <Button variant="subtle" className="self-start">
              <Icon icon={AddIcon} size={14} />
              Create key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {created ? (
              <>
                <DialogTitle>Your new API key</DialogTitle>
                <DialogDescription>Copy it now — you won&apos;t see it again.</DialogDescription>
                <div className="mt-3 flex items-center gap-2">
                  <code className="border-border bg-surface-raised text-small flex-1 truncate rounded-sm border px-2 py-1.5 font-mono">
                    {created.key}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(created.key);
                      toast.success("Copied");
                    }}
                  >
                    <Icon icon={CopyIcon} size={14} />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DialogTitle>Create key</DialogTitle>
                <Input
                  className="mt-4"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <DialogFooter>
                  <Button onClick={create} disabled={!name.trim()}>
                    Create
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
  const notionAllowed = getPlanLimits(plan).notion;

  async function disconnect() {
    try {
      await api("/api/notion", { method: "DELETE" });
      window.location.reload();
    } catch {
      toast.error("Something went wrong on our side.");
    }
  }

  return (
    <>
      <Section title="Notion">
        {!notionAllowed ? (
          <p className="text-body text-text-muted">The Notion connector is available on Pro and Team.</p>
        ) : notion ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon icon={NotionIcon} size={20} />
              <div>
                <p className="text-body text-text">{notion.workspaceName ?? "Connected workspace"}</p>
                <p className="text-small text-text-muted">{notion.sourceCount} pages synced</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-error">
                  Disconnect
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Disconnect Notion?</DialogTitle>
                <DialogDescription>
                  Existing synced pages stay as sources, but no new pages can be added.
                </DialogDescription>
                <DialogFooter>
                  <Button variant="destructive" onClick={disconnect}>
                    Disconnect
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <a href="/api/notion/connect">
            <Button variant="subtle">Connect workspace</Button>
          </a>
        )}
      </Section>
      <div className="border-border text-small text-text-muted rounded-md border border-dashed p-5">
        More integrations coming soon.
      </div>
    </>
  );
}
