"use client";
import * as React from "react";
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
import { CheckIcon } from "@/lib/icons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const STEPS = ["stepIdentity", "stepSources", "stepWidget"] as const;

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

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center gap-4">
        {STEPS.map((key, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "active" : "todo";
          return (
            <React.Fragment key={key}>
              {i > 0 ? <div className="bg-border h-px flex-1" /> : null}
              <div className={cn("flex items-center gap-2", state === "todo" && "text-text-muted")}>
                {state === "done" ? (
                  <Icon icon={CheckIcon} size={18} className="text-link" />
                ) : (
                  <span
                    className={cn("text-h2 font-serif", state === "active" ? "text-text" : "text-text-muted")}
                  >
                    0{n}
                  </span>
                )}
                <span className={state === "active" ? "text-text" : "text-text-muted"}>{t(key)}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {step === 1 ? <StepIdentity id={id} router={router} t={t} /> : null}
      {step === 2 && id ? (
        <StepSources id={id} plan={plan} maxPdfMb={maxPdfMb} router={router} t={t} />
      ) : null}
      {step === 3 && id ? <StepWidget id={id} router={router} t={t} /> : null}
    </div>
  );
}

function StepIdentity({
  id,
  router,
  t,
}: {
  id?: string;
  router: ReturnType<typeof useRouter>;
  t: ReturnType<typeof useTranslations<"Wizard">>;
}) {
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
      toast.error(err instanceof Error ? err.message : "Something went wrong on our side.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Input label={t("name")} value={name} onChange={(e) => setName(e.target.value)} />
      <Input label={t("description")} value={description} onChange={(e) => setDescription(e.target.value)} />
      <Textarea
        label={t("instructions")}
        rows={6}
        maxLength={2000}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder={t("instructionsHint")}
      />
      <Button onClick={next} loading={saving} disabled={!name.trim()} className="self-start">
        {tCommon("continue")}
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
  t: ReturnType<typeof useTranslations<"Wizard">>;
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
      <SourcesManager chatbotId={id} plan={plan} maxPdfMb={maxPdfMb} />
      <div className="flex items-center gap-4">
        <Button onClick={() => router.push(`/agents/new?step=3&id=${id}`)} disabled={!hasSources}>
          {tCommon("continue")}
        </Button>
        <button
          type="button"
          onClick={() => router.push(`/agents/new?step=3&id=${id}`)}
          className="text-small text-link hover:underline"
        >
          {t("skipForNow")}
        </button>
      </div>
    </div>
  );
}

function StepWidget({
  id,
  router,
  t,
}: {
  id: string;
  router: ReturnType<typeof useRouter>;
  t: ReturnType<typeof useTranslations<"Wizard">>;
}) {
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
      toast.error(err instanceof Error ? err.message : "Something went wrong on our side.");
    } finally {
      setPublishing(false);
    }
  }

  if (!chatbot) return null;

  return (
    <div className="flex flex-col gap-6">
      <EmbedSnippet publicKey={chatbot.publicKey} />
      <p className="text-small text-text-muted">
        Fine-tune colors, avatar and messages anytime from the Widget tab after publishing.
      </p>
      <Button onClick={makeLive} loading={publishing} className="self-start">
        {t("makeItLive")}
      </Button>
    </div>
  );
}
