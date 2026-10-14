"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/components/ui/toast";
import { EmbedSnippet } from "@/components/widget/embed-snippet";
import { WidgetConfig, parseWidgetConfig } from "@/lib/widget/config";
import { CloseIcon, AddIcon, UploadIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const COLORS = ["#9E2F45", "#1A1214", "#2F7A4D", "#1F3A5F", "#5B3A6B", "#8A5A12"];

type Chatbot = {
  id: string;
  publicKey: string;
  allowedDomains: string[];
  widgetConfig: unknown;
};

export function WidgetDesigner({ chatbot, canRemoveBadge }: { chatbot: Chatbot; canRemoveBadge: boolean }) {
  const t = useTranslations("Widget");
  const router = useRouter();
  const initial = React.useMemo(() => parseWidgetConfig(chatbot.widgetConfig), [chatbot.widgetConfig]);
  const [config, setConfig] = React.useState<WidgetConfig>(initial);
  const [suggestionInput, setSuggestionInput] = React.useState("");
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(config) !== JSON.stringify(initial);

  function set<K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  React.useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    const timer = setTimeout(() => {
      frame.contentWindow?.postMessage(
        { type: "sigilla:config", config, open: true },
        window.location.origin,
      );
    }, 150);
    return () => clearTimeout(timer);
  }, [config]);

  async function onAvatarPick(file: File) {
    if (file.size > 512 * 1024) return toast.error(t("avatarTooLarge"));
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
      return toast.error(t("avatarUnsupported"));
    setUploadingAvatar(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: `/api/chatbots/${chatbot.id}/avatar`,
      });
      set("avatarUrl", blob.url);
    } catch {
      toast.error(t("avatarUnsupported"));
    } finally {
      setUploadingAvatar(false);
    }
  }

  function addSuggestion() {
    const value = suggestionInput.trim();
    if (!value || config.suggestions.length >= 3) return;
    set("suggestions", [...config.suggestions, value]);
    setSuggestionInput("");
  }

  async function publish() {
    setSaving(true);
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ widgetConfig: config, status: "live" }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("published"));
      router.refresh();
    } catch {
      toast.error("Something went wrong on our side.");
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setConfig(initial);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
      <div className="flex flex-col gap-6">
        <Section title={t("appearance")}>
          <div>
            <label className="label-caps">{t("color")}</label>
            <div className="mt-2 flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => set("color", c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2",
                    config.color === c ? "border-focus" : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                value={config.color}
                onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && set("color", e.target.value)}
                className="border-border bg-surface text-small text-text focus-visible:border-focus h-8 w-24 rounded-sm border px-2 font-mono focus-visible:outline-none"
                maxLength={7}
              />
            </div>
          </div>
          <Segmented
            label={t("theme")}
            value={config.theme}
            onChange={(v) => set("theme", v as WidgetConfig["theme"])}
            options={[
              { value: "dark", label: t("themeDark") },
              { value: "light", label: t("themeLight") },
            ]}
          />
          <Segmented
            label={t("position")}
            value={config.position}
            onChange={(v) => set("position", v as WidgetConfig["position"])}
            options={[
              { value: "right", label: t("positionRight") },
              { value: "left", label: t("positionLeft") },
            ]}
          />
          <Segmented
            label={t("headerStyle")}
            value={config.headerStyle}
            onChange={(v) => set("headerStyle", v as WidgetConfig["headerStyle"])}
            options={[
              { value: "subtle", label: t("headerSubtle") },
              { value: "bold", label: t("headerBold") },
            ]}
          />
        </Section>

        <Section title={t("identity")}>
          <div>
            <label className="label-caps">{t("avatar")}</label>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="text-body-lg flex h-11 w-11 items-center justify-center overflow-hidden rounded-md"
                style={{ backgroundColor: config.color, color: "#F3ECE6" }}
              >
                {config.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={config.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  "S"
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onAvatarPick(e.target.files[0])}
              />
              <Button
                variant="ghost"
                size="sm"
                loading={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon icon={UploadIcon} size={14} />
                {t("uploadAvatar")}
              </Button>
              {config.avatarUrl ? (
                <Button variant="link" size="sm" onClick={() => set("avatarUrl", null)}>
                  {t("removeAvatar")}
                </Button>
              ) : null}
            </div>
          </div>
          <Input
            label={t("displayName")}
            value={config.displayName}
            maxLength={40}
            onChange={(e) => set("displayName", e.target.value)}
          />
          <Input
            label={t("subtitle")}
            value={config.subtitle}
            maxLength={60}
            onChange={(e) => set("subtitle", e.target.value)}
          />
        </Section>

        <Section title={t("messages")}>
          <Textarea
            label={t("welcome")}
            rows={2}
            maxLength={240}
            value={config.welcome}
            onChange={(e) => set("welcome", e.target.value)}
          />
          <Input
            label={t("placeholder")}
            value={config.placeholder}
            maxLength={80}
            onChange={(e) => set("placeholder", e.target.value)}
          />
          <div>
            <label className="label-caps">{t("suggestions")}</label>
            <p className="text-small text-text-muted mt-1">{t("suggestionsHint")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {config.suggestions.map((s, i) => (
                <Badge key={i} className="flex items-center gap-1.5">
                  {s}
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "suggestions",
                        config.suggestions.filter((_, idx) => idx !== i),
                      )
                    }
                    aria-label={`Remove ${s}`}
                  >
                    <Icon icon={CloseIcon} size={12} />
                  </button>
                </Badge>
              ))}
              {config.suggestions.length < 3 ? (
                <div className="flex items-center gap-1">
                  <input
                    value={suggestionInput}
                    maxLength={40}
                    onChange={(e) => setSuggestionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSuggestion();
                      }
                    }}
                    placeholder={t("addSuggestion")}
                    className="border-border bg-surface text-small text-text placeholder:text-text-muted focus-visible:border-focus h-8 min-w-[140px] rounded-sm border px-2 focus-visible:outline-none"
                  />
                  <Button variant="ghost" size="icon" onClick={addSuggestion} aria-label={t("addSuggestion")}>
                    <Icon icon={AddIcon} size={14} />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
          <Input
            label={t("tooltip")}
            value={config.tooltip ?? ""}
            maxLength={80}
            placeholder={t("tooltipHint")}
            onChange={(e) => set("tooltip", e.target.value || null)}
          />
        </Section>

        <Section title={t("branding")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body text-text">{t("showBadge")}</p>
              {!canRemoveBadge ? <p className="text-small text-text-muted">{t("badgeProOnly")}</p> : null}
            </div>
            <Switch
              checked={config.showBadge}
              disabled={!canRemoveBadge}
              onCheckedChange={(v) => set("showBadge", v)}
            />
          </div>
        </Section>

        <Section title={t("domains")}>
          {chatbot.allowedDomains.length ? (
            <div className="flex flex-wrap gap-2">
              {chatbot.allowedDomains.map((d) => (
                <Badge key={d}>{d}</Badge>
              ))}
            </div>
          ) : (
            <p className="border-warning/30 bg-warning/10 text-small text-warning rounded-sm border p-3">
              {t("domainsWarning")}
            </p>
          )}
          <Link href={`/agents/${chatbot.id}/settings`} className="text-small text-link hover:underline">
            {t("domainsEdit")}
          </Link>
        </Section>

        <div className="bg-bg sticky bottom-0 flex justify-end gap-3 py-4">
          <Button variant="ghost" disabled={!dirty || saving} onClick={discard}>
            {t("discard")}
          </Button>
          <Button loading={saving} disabled={!dirty} onClick={publish}>
            {t("publish")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 text-text font-serif">{t("preview")}</h2>
          <Segmented
            value={device}
            onChange={(v) => setDevice(v as "desktop" | "mobile")}
            options={[
              { value: "desktop", label: t("desktop") },
              { value: "mobile", label: t("mobile") },
            ]}
          />
        </div>
        <div className="border-border bg-surface flex flex-1 items-center justify-center rounded-md border p-6">
          {device === "mobile" ? (
            <div
              className="border-border bg-bg rounded-[44px] border-[6px] p-1"
              style={{ width: 390, height: 700 }}
            >
              <iframe
                ref={iframeRef}
                src={`/widget-preview?pk=${chatbot.publicKey}`}
                className="h-full w-full rounded-[38px]"
                title="Widget preview"
              />
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={`/widget-preview?pk=${chatbot.publicKey}`}
              className="border-border h-[640px] w-full rounded-sm border"
              title="Widget preview"
            />
          )}
        </div>
        <div>
          <p className="label-caps mb-2">{t("embedTitle")}</p>
          <EmbedSnippet publicKey={chatbot.publicKey} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-border flex flex-col gap-4 rounded-md border p-5">
      <p className="label-caps">{title}</p>
      {children}
    </div>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      {label ? <label className="label-caps">{label}</label> : null}
      <div className={cn("border-border flex overflow-hidden rounded-sm border", label && "mt-2")}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "text-small flex-1 px-3 py-1.5 transition-colors",
              value === o.value ? "bg-accent text-on-accent" : "bg-surface text-text-muted hover:text-text",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
