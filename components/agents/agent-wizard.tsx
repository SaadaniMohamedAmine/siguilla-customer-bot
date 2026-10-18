"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/components/ui/toast";
import { SourcesManager } from "@/components/sources/sources-manager";
import { EmbedSnippet } from "@/components/widget/embed-snippet";
import { ArrowRightIcon, CheckIcon } from "@/lib/icons";
import { api } from "@/lib/api";
import { useApiError } from "@/lib/use-api-error";
import { cn } from "@/lib/utils";

const STEPS = ["stepIdentity", "stepSources", "stepWidget"] as const;
type T = ReturnType<typeof useTranslations<"Wizard">>;

export function AgentWizard({
  step,
  id,
  plan,
  maxPdfMb,
}: {
  step: number;
  id?: string;
  plan: string;
  maxPdfMb: number;
}) {
  const t = useTranslations("Wizard");
  const router = useRouter();
  const fill = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="flex flex-col gap-10">
      <ol aria-label={t("progress")} className="relative flex items-start justify-between">
        <span aria-hidden className="bg-border absolute top-[19px] right-[8%] left-[8%] h-px" />
        <span
          aria-hidden
          className="anim-keep bg-accent absolute top-[19px] left-[8%] h-px origin-left transition-[width] duration-700 ease-[var(--ease-lux)]"
          style={{ width: `${fill * 0.84}%` }}
        />
        {STEPS.map((key, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "active" : "todo";
          return (
            <li key={key} className="relative z-10 flex w-1/3 flex-col items-center gap-2 text-center" aria-current={state === "active" ? "step" : undefined}>
              <span
                className={cn(
                  "anim-keep bg-bg flex size-10 items-center justify-center rounded-full border font-serif text-[18px] transition-colors duration-500",
                  state === "done" && "border-accent bg-accent text-on-accent",
                  state === "active" && "border-accent text-text shadow-[0_0_0_4px_var(--tint)]",
                  state === "todo" && "border-border text-text-muted",
                )}
              >
                {state === "done" ? <Icon icon={CheckIcon} size={18} /> : n}
              </span>
              <span className={cn("text-body", state === "todo" ? "text-text-muted" : "text-text")}>{t(key)}</span>
            </li>
          );
        })}
      </ol>

      <div key={step} className="page-in anim-keep border-border bg-surface rounded-lg border p-6 sm:p-8">
        {step === 1 ? <StepIdentity id={id} router={router} t={t} /> : null}
        {step === 2 && id ? <StepSources id={id} plan={plan} maxPdfMb={maxPdfMb} router={router} t={t} /> : null}
        {step === 3 && id ? <StepWidget id={id} router={router} t={t} /> : null}
      </div>
    </div>
  );
}

function StepHeading({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-h2 text-text font-serif">{title}</h1>
      <p className="text-body text-text-muted mt-1.5 max-w-lg">{body}</p>
    </div>
  );
}

function StepIdentity({ id, router, t }: { id?: string; router: ReturnType<typeof useRouter>; t: T }) {
  const errMsg = useApiError();
  const tCommon = useTranslations("Common");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function next() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let agentId = id;
      if (!agentId) {
        const created = await api<{ id: string }>("/api/chatbots", {
          method: "POST",
          body: JSON.stringify({ name: name.trim() }),
        });
        agentId = created.id;
      }
      await api(`/api/chatbots/${agentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          description: description || null,
          instructions: instructions || null,
        }),
      });
      router.push(`/agents/new?step=2&id=${agentId}`);
    } catch (err) {
      toast.error(errMsg(err, t("genericError")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title={t("identityTitle")} body={t("identityBody")} />
      <div className="flex items-end gap-4">
        <span
          aria-hidden
          className="bg-accent text-on-accent flex size-12 shrink-0 items-center justify-center rounded-lg font-serif text-[24px]"
        >
          {name.trim().slice(0, 1).toUpperCase() || "S"}
        </span>
        <div className="flex-1">
          <Input label={t("name")} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
        </div>
      </div>
      <Input
        label={t("description")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("descriptionPlaceholder")}
      />
      <div>
        <Textarea
          label={t("instructions")}
          rows={6}
          maxLength={2000}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={t("instructionsPlaceholder", { name: name.trim() || "Sigilla" })}
        />
        <p className="text-small text-text-muted mt-1 flex justify-between gap-3">
          <span>{t("instructionsHint")}</span>
          <span className="font-mono">{instructions.length}/2000</span>
        </p>
      </div>
      <Button onClick={next} loading={saving} disabled={!name.trim()} className="group self-start">
        {tCommon("continue")}
        <Icon icon={ArrowRightIcon} size={16} className="anim-keep transition-transform duration-200 group-hover:translate-x-1" />
      </Button>
    </div>
  );
}

function StepSources({
  id,
  plan,
  maxPdfMb,
  router,
  t,
}: {
  id: string;
  plan: string;
  maxPdfMb: number;
  router: ReturnType<typeof useRouter>;
  t: T;
}) {
  const { data: sources } = useQuery({
    queryKey: ["sources", id],
    queryFn: () => api<unknown[]>(`/api/chatbots/${id}/sources`),
    refetchInterval: 3000,
  });
  const hasSources = (sources?.length ?? 0) > 0;
  const tCommon = useTranslations("Common");

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title={t("sourcesTitle")} body={t("sourcesBody")} />
      <SourcesManager chatbotId={id} plan={plan} maxPdfMb={maxPdfMb} />
      <div className="border-border flex flex-wrap items-center gap-4 border-t pt-6">
        <Button onClick={() => router.push(`/agents/new?step=3&id=${id}`)} disabled={!hasSources} className="group">
          {tCommon("continue")}
          <Icon icon={ArrowRightIcon} size={16} className="anim-keep transition-transform duration-200 group-hover:translate-x-1" />
        </Button>
        <button
          type="button"
          onClick={() => router.push(`/agents/new?step=3&id=${id}`)}
          className="text-small text-link underline underline-offset-4"
        >
          {t("skipForNow")}
        </button>
      </div>
    </div>
  );
}

function StepWidget({ id, router, t }: { id: string; router: ReturnType<typeof useRouter>; t: T }) {
  const errMsg = useApiError();
  const { data: chatbot } = useQuery({
    queryKey: ["chatbot", id],
    queryFn: () => api<{ publicKey: string }>(`/api/chatbots/${id}`),
  });
  const [publishing, setPublishing] = React.useState(false);

  async function makeLive() {
    setPublishing(true);
    try {
      await api(`/api/chatbots/${id}`, { method: "PATCH", body: JSON.stringify({ status: "live" }) });
      toast.success(t("live"));
      router.push(`/agents/${id}`);
    } catch (err) {
      toast.error(errMsg(err, t("genericError")));
    } finally {
      setPublishing(false);
    }
  }

  if (!chatbot)
    return <div className="bg-surface-raised anim-keep h-40 animate-pulse rounded-md" aria-busy="true" />;

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title={t("widgetTitle")} body={t("widgetBody")} />
      <EmbedSnippet publicKey={chatbot.publicKey} />
      <p className="text-small text-text-muted">{t("fineTune")}</p>
      <div className="border-border flex flex-wrap items-center gap-4 border-t pt-6">
        <Button onClick={makeLive} loading={publishing}>
          {t("makeItLive")}
        </Button>
        <Link href={`/agents/${id}/widget`} className="text-small text-link underline underline-offset-4">
          {t("customizeFirst")}
        </Link>
      </div>
    </div>
  );
}
