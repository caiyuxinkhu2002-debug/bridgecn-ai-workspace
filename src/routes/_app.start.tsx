import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/workspace-context";
import {
  Sparkles,
  ArrowRight,
  Sparkle,
  Sprout,
  Shirt,
  Coffee,
  Cpu,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_app/start")({
  head: () => ({
    meta: [
      { title: "Start Your China Expansion — BridgeCN AI" },
      {
        name: "description",
        content:
          "Tell BridgeCN AI about your business and expansion goals. AI will generate a complete China market entry strategy.",
      },
    ],
  }),
  component: StartPage,
});

const industries = [
  { label: "Beauty", icon: Sparkle },
  { label: "Food", icon: Coffee },
  { label: "Fashion", icon: Shirt },
  { label: "Lifestyle", icon: Sprout },
  { label: "Technology", icon: Cpu },
];

const targetMarkets = [
  "Mainland · Tier 1",
  "Mainland · Tier 1.5",
  "Mainland · Tier 2",
  "Hong Kong",
  "Taiwan",
];

function StartPage() {
  const router = useRouter();
  const { createProject, workspaceId } = useWorkspace();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Beauty");
  const [targetMarket, setTargetMarket] = useState(targetMarkets[0]);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) { toast.error("Brand name is required"); return; }
    if (!workspaceId) { toast.error("No workspace selected"); return; }
    setBusy(true);
    try {
      const created = await createProject({ name, industry, targetMarket, description });
      if (!created) { toast.error("Could not create project"); return; }
      toast.success("Project created");
      router.navigate({ to: "/projects/$projectId", params: { projectId: created.id } });
    } catch (e) {
      console.error(e);
      toast.error("Could not create project");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl py-6 md:py-12">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
          New Project
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.025em] md:text-5xl">
          Start Your China Expansion
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--muted-foreground)]">
          Tell BridgeCN AI about your brand. We&apos;ll create a project workspace
          so you can run market, consumer, and localization research.
        </p>
      </div>

      {/* Brand name */}
      <div className="mt-10">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Brand name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Beauty of Joseon"
          maxLength={120}
          className="block w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-5 py-4 text-[15px] text-[var(--foreground)] shadow-[var(--shadow-card)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-4 focus:ring-[var(--primary-soft)]"
        />
      </div>

      {/* Description */}
      <div className="mt-8">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Description</label>
        <div className="group relative rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-card)] transition-shadow focus-within:shadow-[0_0_0_4px_var(--primary-soft),var(--shadow-card)]">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="We are a Korean skincare brand planning to enter Shanghai..."
            className="block w-full resize-none rounded-2xl bg-transparent px-5 pt-5 pb-3 text-[15px] leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
        </div>
      </div>

      {/* Selection groups */}
      <div className="mt-10 space-y-8">
        <Group label="Industry">
          {industries.map((i) => {
            const Icon = i.icon;
            const active = industry === i.label;
            return (
              <Chip
                key={i.label}
                active={active}
                onClick={() => setIndustry(i.label)}
              >
                <Icon className="h-3.5 w-3.5" />
                {i.label}
              </Chip>
            );
          })}
        </Group>

        <Group label="Target market">
          {targetMarkets.map((m) => {
            const active = targetMarket === m;
            return (
              <Chip
                key={m}
                active={active}
                onClick={() => setTargetMarket(m)}
              >
                {m}
              </Chip>
            );
          })}
        </Group>
      </div>

      {/* Submit */}
      <div className="mt-12 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={busy || !name.trim()}
          className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-6 text-sm font-medium text-[var(--background)] shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create Project
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <p className="text-xs text-[var(--muted-foreground)]">
          You can edit project details and progress through stages later.
        </p>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-all ${
        active
          ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
          : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]"
      }`}
    >
      {children}
    </button>
  );
}
