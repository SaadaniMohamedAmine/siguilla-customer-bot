"use client";
import * as React from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/ui/status-pill";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Wordmark } from "@/components/ui/wordmark";
import { CitationSeal, SealedBy } from "@/components/ui/citation-seal";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@/components/ui/icon";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipPortal } from "@/components/ui/tooltip";
import { Reveal } from "@/components/marketing/reveal";
import { AgentIcon, ArrowRightIcon, CopyIcon, DeleteIcon, InfoIcon, MoonIcon, SealIcon, SettingsIcon, SunIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const TOKENS = [
  "bg", "surface", "surface-raised", "border", "text", "text-muted",
  "accent", "accent-hover", "link", "tint", "success", "warning", "error",
];

const BRAND_ASSETS = [
  { key: "og", src: "/opengraph-image", w: 1200, h: 630 },
  { key: "icon", src: "/icon", w: 32, h: 32 },
  { key: "apple", src: "/apple-icon", w: 180, h: 180 },
] as const;

function Section({
  id,
  title,
  description,
  children,
  delay = 0,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <section id={id} className="scroll-mt-24">
        <h2 className="text-h2 text-text font-serif">{title}</h2>
        <p className="text-body text-text-muted mt-1 max-w-2xl">{description}</p>
        <div className="border-border bg-surface mt-6 rounded-lg border p-6">{children}</div>
      </section>
    </Reveal>
  );
}

export default function DesignSystemPage() {
  const t = useTranslations("DesignSystem");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const dark = mounted && theme === "dark";
  const sections = ["brand", "palette", "typography", "buttons", "forms", "status", "surfaces", "feedback", "motion", "citations"] as const;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="page-in anim-keep">
        <p className="label-caps text-link">{t("eyebrow")}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-h1 text-text font-serif">{t("title")}</h1>
          <Button variant="ghost" onClick={() => setTheme(dark ? "light" : "dark")}>
            <Icon icon={dark ? SunIcon : MoonIcon} size={16} />
            {dark ? t("switchToLight") : t("switchToDark")}
          </Button>
        </div>
        <p className="text-body-lg text-text-muted mt-4 max-w-2xl">{t("intro")}</p>
        <nav aria-label={t("onThisPage")} className="mt-8 flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s}
              href={`#${s}`}
              className="anim-keep border-border text-small text-text-muted hover:border-accent hover:text-text rounded-full border px-3 py-1 transition-colors duration-200"
            >
              {t(`sections.${s}.title`)}
            </a>
          ))}
        </nav>
      </div>

      <div className="mt-14 flex flex-col gap-16">
        <Section id="brand" title={t("sections.brand.title")} description={t("sections.brand.desc")}>
          <div className="flex flex-wrap items-end gap-8">
            <Wordmark size="sm" />
            <Wordmark size="md" />
            <Wordmark size="lg" />
            <Wordmark size="xl" />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <span className="bg-accent text-on-accent flex size-14 items-center justify-center rounded-lg font-serif text-[28px]">S</span>
            <span className="border-border bg-bg text-link flex size-14 items-center justify-center rounded-full border">
              <Icon icon={SealIcon} size={26} />
            </span>
            <CitationSeal source={{ index: 1, title: "Shipping Policy.pdf" }} />
          </div>
          <h3 className="label-caps mt-10 mb-3">{t("brandAssets")}</h3>
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
            {BRAND_ASSETS.map((a) => (
              <a
                key={a.key}
                href={a.src}
                target="_blank"
                rel="noreferrer"
                className="anim-keep group border-border bg-bg hover:border-accent flex flex-col gap-3 rounded-md border p-4 transition-colors duration-200"
              >
                <div className="flex flex-1 items-center justify-center overflow-hidden rounded-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.src} alt={t(`assets.${a.key}`)} width={a.w} height={a.h} className="h-auto max-h-44 w-auto max-w-full" />
                </div>
                <span className="text-small text-text flex items-center justify-between gap-2">
                  <span>
                    {t(`assets.${a.key}`)}
                    <span className="text-text-muted ml-2 font-mono text-[11px]">
                      {a.w}×{a.h}
                    </span>
                  </span>
                  <Icon
                    icon={ArrowRightIcon}
                    size={14}
                    className="anim-keep text-link -rotate-45 transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </span>
              </a>
            ))}
          </div>
        </Section>

        <Section id="palette" title={t("sections.palette.title")} description={t("sections.palette.desc")}>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-7">
            {TOKENS.map((tk) => (
              <div key={tk} className="flex flex-col gap-2">
                <div className="border-border h-16 rounded-md border" style={{ background: `var(--${tk})` }} />
                <span className="text-small text-text-muted font-mono">{tk}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="typography" title={t("sections.typography.title")} description={t("sections.typography.desc")}>
          <div className="flex flex-col gap-3">
            <p className="font-serif text-display">Display</p>
            <p className="font-serif text-h1">Heading 1</p>
            <p className="font-serif text-h2">Heading 2</p>
            <p className="font-serif text-h3">Heading 3</p>
            <p className="text-body-lg">Body large — the quick brown fox jumps over the lazy dog.</p>
            <p className="text-body">Body — the quick brown fox jumps over the lazy dog.</p>
            <p className="text-small text-text-muted">Small / muted — secondary information.</p>
            <p className="label-caps">Label caps</p>
            <p className="font-mono text-small">Mono — 0123456789 · pk_live_x8d2</p>
          </div>
        </Section>

        <Section id="buttons" title={t("sections.buttons.title")} description={t("sections.buttons.desc")}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">
              Large
              <Icon icon={ArrowRightIcon} size={16} />
            </Button>
          </div>
        </Section>

        <Section id="forms" title={t("sections.forms.title")} description={t("sections.forms.desc")}>
          <div className="grid max-w-md gap-4">
            <Input label="Normal" placeholder="Type something…" />
            <Input label="Error" error="This field is required." />
            <Input label="Disabled" disabled placeholder="Disabled" />
            <PasswordInput label="Password" placeholder="••••••••" />
            <div className="flex items-center gap-3">
              <Switch />
              <span className="text-body text-text-muted">Switch</span>
            </div>
          </div>
        </Section>

        <Section id="status" title={t("sections.status.title")} description={t("sections.status.desc")}>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="accent">Accent</Badge>
            <StatusPill tone="neutral">Draft</StatusPill>
            <StatusPill tone="success">Ready</StatusPill>
            <StatusPill tone="warning">Needs human</StatusPill>
            <StatusPill tone="error">Failed</StatusPill>
            <StatusPill tone="accent">Human</StatusPill>
            <Avatar name="Camille Laurent" />
            <Avatar name="Hugo Martin" size={40} />
          </div>
        </Section>

        <Section id="surfaces" title={t("sections.surfaces.title")} description={t("sections.surfaces.desc")}>
          <div className="grid gap-4 md:grid-cols-3">
            {["bg", "surface", "surface-raised"].map((s) => (
              <div key={s} className="border-border rounded-lg border p-5" style={{ background: `var(--${s})` }}>
                <p className="text-h3 text-text font-serif">{s}</p>
                <p className="text-small text-text-muted mt-1">{t("surfaceSample")}</p>
              </div>
            ))}
          </div>
          <div
            className={cn(
              "anim-keep border-border bg-bg hover:border-accent mt-4 flex items-center justify-between rounded-lg border p-5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
            )}
          >
            <div>
              <p className="text-h3 text-text font-serif">Atelier Lune</p>
              <p className="text-small text-text-muted">5 sources · 128 conversations</p>
            </div>
            <StatusPill tone="success">Live</StatusPill>
          </div>
        </Section>

        <Section id="feedback" title={t("sections.feedback.title")} description={t("sections.feedback.desc")}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={() => toast.success("Saved.")}>
              Success toast
            </Button>
            <Button variant="ghost" onClick={() => toast.error("Something went wrong.")}>
              Error toast
            </Button>
            <Button variant="ghost" onClick={() => toast.warning("Approaching your limit.")}>
              Warning toast
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Delete this source?</DialogTitle>
                <DialogDescription>This cannot be undone.</DialogDescription>
                <DialogFooter>
                  <Button variant="ghost">Cancel</Button>
                  <Button variant="destructive">Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">Dropdown menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Icon icon={SettingsIcon} size={16} />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Icon icon={CopyIcon} size={16} />
                  Copy embed code
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-error">
                  <Icon icon={DeleteIcon} size={16} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Select defaultValue="30">
              <SelectTrigger className="w-40" aria-label="Period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">
                  <Icon icon={InfoIcon} size={16} />
                  Tooltip
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>Hover or focus to reveal more context.</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          </div>
          <div className="mt-6 flex flex-col gap-4">
            <Skeleton className="anim-keep h-10 w-48" />
            <EmptyState icon={AgentIcon} title="Your first agent awaits." description="Create an agent to get started." />
          </div>
        </Section>

        <Section id="motion" title={t("sections.motion.title")} description={t("sections.motion.desc")}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border-border bg-bg rounded-md border p-4">
              <p className="label-caps">{t("motion.ease")}</p>
              <p className="text-small text-text mt-2 font-mono">cubic-bezier(0.16, 1, 0.3, 1)</p>
            </div>
            <div className="border-border bg-bg flex items-center gap-4 rounded-md border p-4">
              <span className="relative flex size-3">
                <span className="anim-keep bg-accent absolute inline-flex size-full rounded-full opacity-60" style={{ animation: "ping-soft 1.8s ease-out infinite" }} />
                <span className="bg-accent relative inline-flex size-3 rounded-full" />
              </span>
              <p className="text-small text-text-muted">{t("motion.pulse")}</p>
            </div>
            <div className="border-border bg-bg flex items-end gap-1.5 rounded-md border p-4">
              {[0, 0.1, 0.2, 0.3].map((d) => (
                <span key={d} className="wave-bar bg-accent w-3 rounded-[3px]" style={{ height: 10, animationDelay: `${d}s` }} />
              ))}
              <p className="text-small text-text-muted ml-3 self-center">{t("motion.loader")}</p>
            </div>
          </div>
        </Section>

        <Section id="citations" title={t("sections.citations.title")} description={t("sections.citations.desc")}>
          <p className="max-w-lg text-body text-text">
            Shipping to Switzerland takes 3–5 business days
            <CitationSeal source={{ index: 1, title: "Shipping Policy.pdf" }} />, duties included at checkout
            <CitationSeal source={{ index: 2, title: "How answers work", url: "/docs/answers" }} />.
          </p>
          <SealedBy
            sources={[
              { index: 1, title: "Shipping Policy.pdf" },
              { index: 2, title: "How answers work", url: "/docs/answers" },
            ]}
            label="Sealed by 2 sources —"
          />
        </Section>
      </div>
    </div>
  );
}
