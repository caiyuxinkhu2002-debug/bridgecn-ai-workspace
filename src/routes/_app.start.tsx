import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Paperclip,
  Globe2,
  Sparkle,
  Sprout,
  Shirt,
  Coffee,
  Cpu,
  Search,
  Languages,
  Megaphone,
  Target,
  Command,
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

const goals = [
  { label: "Market Research", icon: Search },
  { label: "Localization", icon: Languages },
  { label: "Marketing Strategy", icon: Megaphone },
  { label: "Competitor Analysis", icon: Target },
];

function StartPage() {
  const [prompt, setPrompt] = useState("");
  const [industry, setIndustry] = useState("Beauty");
  const [goal, setGoal] = useState("Market Research");

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
          Tell BridgeCN AI about your business and expansion goals. AI will
          generate a complete China market entry strategy.
        </p>
      </div>

      {/* Prompt box */}
      <div className="mt-10">
        <div className="group relative rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-card)] transition-shadow focus-within:shadow-[0_0_0_4px_var(--primary-soft),var(--shadow-card)]">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="We are a Korean skincare brand planning to enter Shanghai..."
            className="block w-full resize-none rounded-2xl bg-transparent px-5 pt-5 pb-3 text-[15px] leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] px-3 py-2.5">
            <div className="flex items-center gap-1">
              <button className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
                <Paperclip className="h-3.5 w-3.5" />
                Attach
              </button>
              <button className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
                <Globe2 className="h-3.5 w-3.5" />
                Sources
              </button>
            </div>
            <div className="hidden items-center gap-1 text-[11px] text-[var(--muted-foreground)] sm:flex">
              <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 font-mono">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
              <span>to focus</span>
            </div>
          </div>
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

        <Group label="Goal">
          {goals.map((g) => {
            const Icon = g.icon;
            const active = goal === g.label;
            return (
              <Chip
                key={g.label}
                active={active}
                onClick={() => setGoal(g.label)}
              >
                <Icon className="h-3.5 w-3.5" />
                {g.label}
              </Chip>
            );
          })}
        </Group>
      </div>

      {/* Submit */}
      <div className="mt-12 flex flex-col items-center gap-3">
        <button className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-6 text-sm font-medium text-[var(--background)] shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5 sm:w-auto sm:px-8">
          Generate China Market Report
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <p className="text-xs text-[var(--muted-foreground)]">
          Typically takes about 30 seconds. You can edit everything after.
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
