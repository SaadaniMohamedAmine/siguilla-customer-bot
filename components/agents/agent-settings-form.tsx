"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@/components/ui/icon";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { CloseIcon, WarningIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { responseError } from "@/lib/api";
import { DOMAIN_PATTERN } from "@/lib/validation/chatbot";
import { useApiError } from "@/lib/use-api-error";

type Chatbot = {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  similarityThreshold: number;
  allowedDomains: string[];
  status: string;
};

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="border-border bg-surface rounded-lg border p-6">
      <h2 className="text-h3 text-text font-serif">{title}</h2>
      <p className="text-small text-text-muted mt-1">{description}</p>
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}

export function AgentSettingsForm({ chatbot }: { chatbot: Chatbot }) {
  const t = useTranslations("AgentSettings");
  const errMsg = useApiError();
  const router = useRouter();
  const [name, setName] = React.useState(chatbot.name);
  const [description, setDescription] = React.useState(chatbot.description ?? "");
  const [instructions, setInstructions] = React.useState(chatbot.instructions ?? "");
  const [threshold, setThreshold] = React.useState(chatbot.similarityThreshold);
  const [domains, setDomains] = React.useState<string[]>(chatbot.allowedDomains);
  const [domainInput, setDomainInput] = React.useState("");
  const [live, setLive] = React.useState(chatbot.status === "live");
  const [saving, setSaving] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  const dirty =
    name !== chatbot.name ||
    description !== (chatbot.description ?? "") ||
    instructions !== (chatbot.instructions ?? "") ||
    threshold !== chatbot.similarityThreshold ||
    live !== (chatbot.status === "live") ||
    domains.length !== chatbot.allowedDomains.length ||
    domains.some((d, i) => d !== chatbot.allowedDomains[i]);

  function discard() {
    setName(chatbot.name);
    setDescription(chatbot.description ?? "");
    setInstructions(chatbot.instructions ?? "");
    setThreshold(chatbot.similarityThreshold);
    setDomains(chatbot.allowedDomains);
    setLive(chatbot.status === "live");
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          instructions: instructions || null,
          similarityThreshold: threshold,
          allowedDomains: domains,
          status: live ? "live" : "draft",
        }),
      });
      if (!res.ok) throw await responseError(res);
      toast.success(t("saved"));
      router.refresh();
    } catch (e) {
      toast.error(errMsg(e, t("genericError")));
    } finally {
      setSaving(false);
    }
  }

  function addDomain() {
    const value = domainInput.trim().toLowerCase();
    if (!value) return;
    if (!DOMAIN_PATTERN.test(value)) {
      toast.error(t("invalidDomain"));
      return;
    }
    if (!domains.includes(value)) setDomains([...domains, value]);
    setDomainInput("");
  }

  async function deleteAgent() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}`, { method: "DELETE" });
      if (!res.ok) throw await responseError(res);
      router.push("/agents");
    } catch (e) {
      toast.error(errMsg(e, t("genericError")));
      setDeleting(false);
    }
  }

  const pctThreshold = ((threshold - 0.5) / 0.45) * 100;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Section title={t("generalTitle")} description={t("generalDesc")}>
        <Input label={t("name")} value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label={t("description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
        />
      </Section>

      <Section title={t("behaviorTitle")} description={t("behaviorDesc")}>
        <div>
          <Textarea
            label={t("instructions")}
            rows={8}
            maxLength={2000}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={t("instructionsPlaceholder")}
          />
          <p className="text-small text-text-muted mt-1 text-right font-mono">{instructions.length}/2000</p>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="agent-threshold" className="label-caps">
              {t("threshold")}
            </label>
            <span className="border-border bg-bg text-text rounded-full border px-2.5 py-0.5 font-mono text-[13px]">
              {threshold.toFixed(2)}
            </span>
          </div>
          <input
            id="agent-threshold"
            type="range"
            min={0.5}
            max={0.95}
            step={0.01}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="accent-accent mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, var(--accent) ${pctThreshold}%, var(--surface-raised) ${pctThreshold}%)`,
            }}
          />
          <div className="text-small text-text-muted mt-1 flex justify-between">
            <span>{t("permissive")}</span>
            <span>{t("strict")}</span>
          </div>
          <p className="text-small text-text-muted mt-2">{t("thresholdHelp")}</p>
        </div>
      </Section>

      <Section title={t("accessTitle")} description={t("accessDesc")}>
        <div>
          <label htmlFor="agent-domain" className="label-caps">
            {t("allowedDomains")}
          </label>
          <div className="border-border bg-bg focus-within:border-focus mt-2 flex flex-wrap items-center gap-2 rounded-sm border p-2 transition-colors">
            {domains.map((d) => (
              <span
                key={d}
                className="border-border bg-surface-raised text-small text-text inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-1.5 pl-3"
              >
                {d}
                <button
                  type="button"
                  onClick={() => setDomains(domains.filter((x) => x !== d))}
                  aria-label={t("removeDomain", { domain: d })}
                  className="text-text-muted hover:text-text rounded-full p-0.5"
                >
                  <Icon icon={CloseIcon} size={12} />
                </button>
              </span>
            ))}
            <input
              id="agent-domain"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addDomain();
                }
              }}
              onBlur={addDomain}
              placeholder={t("domainPlaceholder")}
              className="text-small text-text placeholder:text-text-muted h-7 min-w-[140px] flex-1 bg-transparent px-1 outline-none"
            />
          </div>
          <p className="text-small text-text-muted mt-2">{t("domainHint")}</p>
          {domains.length === 0 ? (
            <p className="text-small text-warning bg-warning/10 border-warning/30 mt-3 flex items-start gap-2 rounded-sm border p-3">
              <Icon icon={WarningIcon} size={15} className="mt-0.5 shrink-0" />
              {t("domainWarning")}
            </p>
          ) : null}
        </div>
      </Section>

      <Section title={t("publishTitle")} description={t("publishDesc")}>
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-md border p-4 transition-colors duration-300",
            live ? "border-success/40 bg-success/5" : "border-border bg-bg",
          )}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex size-2.5">
              {live ? (
                <span
                  className="anim-keep bg-success absolute inline-flex size-full rounded-full opacity-60"
                  style={{ animation: "ping-soft 1.8s ease-out infinite" }}
                />
              ) : null}
              <span className={cn("relative inline-flex size-2.5 rounded-full", live ? "bg-success" : "bg-text-muted")} />
            </span>
            <div>
              <p className="text-body text-text">{live ? t("liveOn") : t("liveOff")}</p>
              <p className="text-small text-text-muted">{live ? t("liveOnHint") : t("liveOffHint")}</p>
            </div>
          </div>
          <Switch checked={live} onCheckedChange={setLive} aria-label={t("liveLabel")} />
        </div>
      </Section>

      <div
        className={cn(
          "border-border bg-surface-raised sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 shadow-[var(--shadow-lift)] transition-[opacity,transform] duration-300 ease-[var(--ease-lux)]",
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
        aria-hidden={!dirty}
      >
        <p className="text-body text-text flex items-center gap-2">
          <span className="bg-warning size-2 rounded-full" />
          {t("unsaved")}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={discard} disabled={saving} tabIndex={dirty ? 0 : -1}>
            {t("discard")}
          </Button>
          <Button onClick={save} loading={saving} tabIndex={dirty ? 0 : -1}>
            {t("save")}
          </Button>
        </div>
      </div>

      <section className="border-error/30 bg-error/5 rounded-lg border p-6">
        <h2 className="text-h3 text-text font-serif">{t("dangerTitle")}</h2>
        <p className="text-small text-text-muted mt-1">{t("dangerDesc")}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="mt-4">
              {t("deleteAgent")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t.rich("deleteBody", { name: chatbot.name, b: (chunks) => <strong>{chunks}</strong> })}
            </DialogDescription>
            <Input className="mt-4" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
            <DialogFooter>
              <Button variant="destructive" disabled={deleteConfirm !== chatbot.name} loading={deleting} onClick={deleteAgent}>
                {t("deleteAgent")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
