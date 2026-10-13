"use client";
import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/ui/status-pill";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Wordmark } from "@/components/ui/wordmark";
import { CitationSeal, SealedBy } from "@/components/ui/citation-seal";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { AgentIcon } from "@/lib/icons";

const TOKENS = [
  "bg", "surface", "surface-raised", "border", "text", "text-muted",
  "accent", "accent-hover", "link", "tint", "success", "warning", "error",
];

export default function DesignSystemPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-12 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-h1 text-text">Design system</h1>
        <Button variant="ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          Toggle {theme === "dark" ? "light" : "dark"}
        </Button>
      </div>

      <section>
        <h2 className="label-caps mb-4">Wordmark</h2>
        <div className="flex items-end gap-6">
          <Wordmark size="sm" />
          <Wordmark size="md" />
          <Wordmark size="lg" />
          <Wordmark size="xl" />
        </div>
      </section>

      <section>
        <h2 className="label-caps mb-4">Palette</h2>
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-6">
          {TOKENS.map((tk) => (
            <div key={tk} className="flex flex-col gap-2">
              <div
                className="h-16 rounded-sm border border-border"
                style={{ background: `var(--${tk})` }}
              />
              <span className="font-mono text-small text-text-muted">{tk}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="label-caps mb-4">Typography</h2>
        <p className="font-serif text-display">Display</p>
        <p className="font-serif text-h1">Heading 1</p>
        <p className="font-serif text-h2">Heading 2</p>
        <p className="font-serif text-h3">Heading 3</p>
        <p className="text-body-lg">Body large</p>
        <p className="text-body">Body</p>
        <p className="text-small text-text-muted">Small / muted</p>
        <p className="label-caps">Label caps</p>
      </section>

      <section>
        <h2 className="label-caps mb-4">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section>
        <h2 className="label-caps mb-4">Inputs</h2>
        <div className="grid max-w-sm gap-4">
          <Input label="Normal" placeholder="Type something…" />
          <Input label="Error" error="This field is required." />
          <Input label="Disabled" disabled placeholder="Disabled" />
          <PasswordInput label="Password" placeholder="••••••••" />
        </div>
      </section>

      <section>
        <h2 className="label-caps mb-4">Badges &amp; status</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="accent">Accent</Badge>
          <StatusPill tone="neutral">Draft</StatusPill>
          <StatusPill tone="success">Ready</StatusPill>
          <StatusPill tone="warning">Needs human</StatusPill>
          <StatusPill tone="error">Failed</StatusPill>
          <StatusPill tone="accent">Human</StatusPill>
        </div>
      </section>

      <section>
        <h2 className="label-caps mb-4">Avatar</h2>
        <div className="flex items-center gap-3">
          <Avatar name="Camille Laurent" />
          <Avatar name="Hugo Martin" size={40} />
        </div>
      </section>

      <section>
        <h2 className="label-caps mb-4">Card</h2>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Atelier Lune</CardTitle>
          </CardHeader>
          <CardContent>5 sources · 128 conversations</CardContent>
        </Card>
      </section>

      <section>
        <h2 className="label-caps mb-4">Tabs</h2>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Overview</TabsTrigger>
            <TabsTrigger value="b">Sources</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Overview content.</TabsContent>
          <TabsContent value="b">Sources content.</TabsContent>
        </Tabs>
      </section>

      <section>
        <h2 className="label-caps mb-4">Switch</h2>
        <Switch />
      </section>

      <section>
        <h2 className="label-caps mb-4">Dialog</h2>
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
      </section>

      <section>
        <h2 className="label-caps mb-4">Toasts</h2>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => toast.success("Saved.")}>
            Success
          </Button>
          <Button variant="ghost" onClick={() => toast.error("Something went wrong.")}>
            Error
          </Button>
          <Button variant="ghost" onClick={() => toast.warning("Approaching your limit.")}>
            Warning
          </Button>
        </div>
      </section>

      <section>
        <h2 className="label-caps mb-4">Skeleton</h2>
        <Skeleton className="h-10 w-48" />
      </section>

      <section>
        <h2 className="label-caps mb-4">Citation seal</h2>
        <p className="max-w-lg text-body text-text">
          Shipping to Switzerland takes 3–5 business days
          <CitationSeal source={{ index: 1, title: "Shipping Policy.pdf" }} />, duties included at checkout
          <CitationSeal source={{ index: 2, title: "FAQ", url: "/docs/faq" }} />.
        </p>
        <SealedBy
          sources={[
            { index: 1, title: "Shipping Policy.pdf" },
            { index: 2, title: "FAQ", url: "/docs/faq" },
          ]}
          label="Sealed by 2 sources —"
        />
      </section>

      <section>
        <h2 className="label-caps mb-4">Empty state</h2>
        <EmptyState icon={AgentIcon} title="Your first agent awaits." description="Create an agent to get started." />
      </section>
    </div>
  );
}
