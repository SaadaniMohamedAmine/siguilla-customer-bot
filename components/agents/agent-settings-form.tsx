"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { CloseIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Chatbot = {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  similarityThreshold: number;
  allowedDomains: string[];
  status: string;
};

export function AgentSettingsForm({ chatbot }: { chatbot: Chatbot }) {
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
      if (!res.ok) throw new Error();
      toast.success("Saved.");
      router.refresh();
    } catch {
      toast.error("Something went wrong on our side.");
    } finally {
      setSaving(false);
    }
  }

  function addDomain() {
    const value = domainInput.trim().toLowerCase();
    if (!value) return;
    if (!domains.includes(value)) setDomains([...domains, value]);
    setDomainInput("");
  }

  async function deleteAgent() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/agents");
    } catch {
      toast.error("Something went wrong on our side.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="A short internal description."
      />

      <div>
        <Textarea
          label="Instructions"
          rows={8}
          maxLength={2000}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Answer as the Atelier Lune concierge. Be warm and concise. Never discuss pricing negotiations; offer a human instead."
        />
        <p className="text-small text-text-muted mt-1 text-right">{instructions.length}/2000</p>
      </div>

      <div>
        <label className="label-caps">Similarity threshold</label>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={0.5}
            max={0.95}
            step={0.01}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="bg-surface-raised accent-accent h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
          />
          <span className="text-body text-text w-12 text-right font-mono">{threshold.toFixed(2)}</span>
        </div>
        <p className="text-small text-text-muted mt-1">
          Below this score, your agent declines and offers a human.
        </p>
      </div>

      <div>
        <label className="label-caps">Allowed domains</label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {domains.map((d) => (
            <Badge key={d} className="flex items-center gap-1.5">
              {d}
              <button
                type="button"
                onClick={() => setDomains(domains.filter((x) => x !== d))}
                aria-label={`Remove ${d}`}
              >
                <Icon icon={CloseIcon} size={12} />
              </button>
            </Badge>
          ))}
          <input
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addDomain();
              }
            }}
            onBlur={addDomain}
            placeholder="example.com"
            className={cn(
              "border-border bg-surface text-small text-text placeholder:text-text-muted focus-visible:border-focus h-8 min-w-[140px] flex-1 rounded-sm border px-2 focus-visible:outline-none",
            )}
          />
        </div>
      </div>

      <div className="border-border flex items-center justify-between rounded-md border p-4">
        <div>
          <p className="text-body text-text">Live</p>
          <p className="text-small text-text-muted">Answers visitors when embedded.</p>
        </div>
        <Switch checked={live} onCheckedChange={setLive} />
      </div>

      <div>
        <Button onClick={save} loading={saving}>
          Save
        </Button>
      </div>

      <div className="border-error/30 rounded-md border p-4">
        <p className="text-h3 text-text font-serif">Danger zone</p>
        <p className="text-small text-text-muted mt-1">
          Deleting an agent removes its sources, chunks and conversations.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="mt-3">
              Delete agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Delete this agent?</DialogTitle>
            <DialogDescription>
              Type <strong>{chatbot.name}</strong> to confirm. This cannot be undone.
            </DialogDescription>
            <Input
              className="mt-4"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
            <DialogFooter>
              <Button
                variant="destructive"
                disabled={deleteConfirm !== chatbot.name}
                loading={deleting}
                onClick={deleteAgent}
              >
                Delete agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
