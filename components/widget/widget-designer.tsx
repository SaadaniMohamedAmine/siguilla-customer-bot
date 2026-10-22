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
import { Icon } from "@/components/ui/icon";
import { toast } from "@/components/ui/toast";
import { EmbedSnippet } from "@/components/widget/embed-snippet";
import { WidgetConfig, parseWidgetConfig } from "@/lib/widget/config";
import { toRuntimeConfig } from "@/lib/widget/runtime";
import { CloseIcon, AddIcon, UploadIcon, CheckIcon, LockIcon, WarningIcon, ArrowRightIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { responseError } from "@/lib/api";
import { useApiError } from "@/lib/use-api-error";

const COLORS = ["#9E2F45", "#1A1214", "#2F7A4D", "#1F3A5F", "#5B3A6B", "#8A5A12"];

type Chatbot = {
  id: string;
  publicKey: string;
  allowedDomains: string[];
  widgetConfig: unknown;
};

export function WidgetDesigner({ chatbot, canRemoveBadge }: { chatbot: Chatbot; canRemoveBadge: boolean }) {
  const t = useTranslations("Widget");
  const errMsg = useApiError();
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
        { type: "sigilla:config", config: toRuntimeConfig(config), open: true },
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
      if (!res.ok) throw await responseError(res);
      toast.success(t("published"));
      router.refresh();
    } catch (e) {
      toast.error(errMsg(e, t("genericError")));
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setConfig(initial);
  }

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <Section title={t("appearance")}>
          <div>
            <label className="label-caps">{t("color")}</label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {COLORS.map((c) => {
                const active = config.color.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    aria-pressed={active}
                    onClick={() => set("color", c)}
                    className={cn(
                      "anim-keep ring-offset-surface flex size-8 items-center justify-center rounded-full ring-2 ring-offset-2 transition-[box-shadow,transform] duration-200 hover:scale-110",
                      active ? "ring-focus" : "ring-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {active ? <Icon icon={CheckIcon} size={14} className="text-white" /> : null}
                  </button>
                );
              })}
              <div className="border-border bg-bg flex h-8 items-center gap-2 rounded-sm border pl-2">
                <span aria-hidden className="size-4 rounded-full" style={{ backgroundColor: config.color }} />
                <input
                  value={config.color}
                  onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && set("color", e.target.value)}
                  className="text-small text-text h-full w-20 bg-transparent pr-2 font-mono outline-none"
                  aria-label={t("color")}
                  maxLength={7}
                />
              </div>
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
            <div className="mt-3 flex items-center gap-4">
              <div
                className="flex size-16 items-center justify-center overflow-hidden rounded-lg font-serif text-[28px]"
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
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" loading={uploadingAvatar} onClick={() => fileInputRef.current?.click()}>
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {config.suggestions.map((s, i) => (
                <span
                  key={i}
                  className="border-border bg-surface-raised text-small text-text inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-1.5 pl-3"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "suggestions",
                        config.suggestions.filter((_, idx) => idx !== i),
                      )
                    }
                    aria-label={t("remove", { value: s })}
                    className="text-text-muted hover:text-text rounded-full p-0.5"
                  >
                    <Icon icon={CloseIcon} size={12} />
                  </button>
                </span>
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
                    className="border-border bg-bg text-small text-text placeholder:text-text-muted focus-visible:border-focus h-8 min-w-[160px] rounded-full border px-3 outline-none"
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
          <div
            className={cn(
              "flex items-center justify-between gap-4 rounded-md border p-4",
              canRemoveBadge ? "border-border bg-bg" : "border-border bg-bg opacity-90",
            )}
          >
            <div>
              <p className="text-body text-text">{t("showBadge")}</p>
              {!canRemoveBadge ? (
                <p className="text-small text-text-muted mt-0.5 flex items-center gap-1.5">
                  <Icon icon={LockIcon} size={12} />
                  {t("badgeProOnly")}
                </p>
              ) : null}
            </div>
            <Switch
              checked={config.showBadge}
              disabled={!canRemoveBadge}
              onCheckedChange={(v) => set("showBadge", v)}
              aria-label={t("showBadge")}
            />
          </div>
        </Section>

        <Section title={t("domains")}>
          {chatbot.allowedDomains.length ? (
            <div className="flex flex-wrap gap-2">
              {chatbot.allowedDomains.map((d) => (
                <span key={d} className="border-border bg-surface-raised text-small text-text rounded-full border px-3 py-0.5">
                  {d}
                </span>
              ))}
            </div>
          ) : (
            <p className="border-warning/30 bg-warning/10 text-small text-warning flex items-start gap-2 rounded-sm border p-3">
              <Icon icon={WarningIcon} size={15} className="mt-0.5 shrink-0" />
              {t("domainsWarning")}
            </p>
          )}
          <Link href={`/agents/${chatbot.id}/settings`} className="text-small text-link underline underline-offset-4">
            {t("domainsEdit")}
          </Link>
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
            <Button variant="ghost" disabled={saving} onClick={discard} tabIndex={dirty ? 0 : -1}>
              {t("discard")}
            </Button>
            <Button loading={saving} onClick={publish} tabIndex={dirty ? 0 : -1}>
              {t("publish")}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-h3 text-text font-serif">{t("preview")}</h2>
            <p className="text-small text-text-muted">{t("previewHint")}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/widget-preview?pk=${chatbot.publicKey}`}
              target="_blank"
              rel="noreferrer"
              className="anim-keep group text-small text-link inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {t("openPreview")}
              <Icon icon={ArrowRightIcon} size={13} className="anim-keep -rotate-45 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <Segmented
              value={device}
              onChange={(v) => setDevice(v as "desktop" | "mobile")}
              options={[
                { value: "desktop", label: t("desktop") },
                { value: "mobile", label: t("mobile") },
              ]}
            />
          </div>
        </div>
        <div className="border-border bg-surface flex items-center justify-center rounded-lg border p-5">
          {device === "mobile" ? (
            <div className="border-border bg-bg rounded-[44px] border-[6px] p-1" style={{ width: 390, maxWidth: "100%", height: 700 }}>
              <iframe
                ref={iframeRef}
                src={`/widget-preview?pk=${chatbot.publicKey}`}
                className="h-full w-full rounded-[38px]"
                title={t("previewTitle")}
              />
            </div>
          ) : (
            <div className="border-border w-full overflow-hidden rounded-md border">
              <div className="border-border bg-surface-raised flex items-center gap-2 border-b px-4 py-2.5">
                <span className="bg-error/50 size-2.5 rounded-full" />
                <span className="bg-warning/50 size-2.5 rounded-full" />
                <span className="bg-success/50 size-2.5 rounded-full" />
                <span className="text-text-muted ml-3 font-mono text-[11px]">{t("previewUrl")}</span>
              </div>
              <iframe
                ref={iframeRef}
                src={`/widget-preview?pk=${chatbot.publicKey}`}
                className="block h-[620px] w-full"
                title={t("previewTitle")}
              />
            </div>
          )}
        </div>
        <div className="border-border bg-surface rounded-lg border p-5">
          <p className="label-caps mb-3">{t("embedTitle")}</p>
          <EmbedSnippet publicKey={chatbot.publicKey} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border bg-surface flex flex-col gap-5 rounded-lg border p-6">
      <h2 className="text-h3 text-text font-serif">{title}</h2>
      {children}
    </section>
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
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div>
      {label ? <label className="label-caps">{label}</label> : null}
      <div
        role="radiogroup"
        className={cn("border-border bg-bg relative grid rounded-md border p-0.5", label && "mt-2")}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden
          className="anim-keep border-accent bg-tint absolute top-0.5 bottom-0.5 left-0.5 rounded-[5px] border transition-transform duration-300 ease-[var(--ease-lux)]"
          style={{
            width: `calc((100% - 4px) / ${options.length})`,
            transform: `translateX(${index * 100}%)`,
          }}
        />
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "anim-keep text-small relative z-10 px-3 py-1.5 transition-colors duration-200",
              value === o.value ? "text-text" : "text-text-muted hover:text-text",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
