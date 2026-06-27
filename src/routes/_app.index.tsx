import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LineChart,
  Users,
  Languages,
  ListChecks,
  ArrowUpRight,
  ArrowRight,
  MoreHorizontal,
  TrendingUp,
  Globe,
} from "lucide-react";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BridgeCN AI" },
      {
        name: "description",
        content:
          "BridgeCN AI is the AI workspace for Korean companies expanding into the Chinese market.",
      },
    ],
  }),
  component: DashboardPage,
});

const features = [
  {
    title: "China Market Insight",
    description: "Analyze China's market opportunities across categories and channels.",
    icon: LineChart,
    href: "/china-market-insight",
    accent: "from-blue-500/15 to-blue-500/0",
  },
  {
    title: "Consumer Insight",
    description: "Understand Chinese consumers — behavior, preferences, and trends.",
    icon: Users,
    href: "/consumer-insight",
    accent: "from-indigo-500/15 to-indigo-500/0",
  },
  {
    title: "Localization Studio",
    description: "Transform Korean marketing content into localized Chinese content.",
    icon: Languages,
    href: "/localization-studio",
    accent: "from-sky-500/15 to-sky-500/0",
  },
  {
    title: "Launch Checklist",
    description: "Generate step-by-step China market entry plans.",
    icon: ListChecks,
    href: "/launch-checklist",
    accent: "from-cyan-500/15 to-cyan-500/0",
  },
] as const;

const projects = [
  {
    name: "Beauty of Joseon",
    workspace: "China Expansion",
    status: "In progress",
    progress: 68,
    updated: "2h ago",
    initials: "BJ",
  },
  {
    name: "ANUA",
    workspace: "Xiaohongshu Strategy",
    status: "Drafting",
    progress: 34,
    updated: "Yesterday",
    initials: "AN",
  },
  {
    name: "Medicube",
    workspace: "China Market Research",
    status: "Reviewing",
    progress: 82,
    updated: "3 days ago",
    initials: "MC",
  },
];

function DashboardPage() {
  return (
    <div>
      {/* Hero */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)] md:p-8">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--primary)]">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
          Workspace overview
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
          Welcome to BridgeCN AI
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted-foreground)] md:text-base">
          The AI Workspace for Korean Companies Entering China.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--primary)] px-3.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90">
            Start a new project
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-3.5 text-sm font-medium hover:bg-[var(--muted)]">
            View templates
          </button>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-5 md:grid-cols-4">
          {[
            { label: "Active projects", value: "3", delta: "+1 this week", icon: TrendingUp },
            { label: "Reports generated", value: "12", delta: "+4 this month", icon: Globe },
            { label: "Localized assets", value: "48", delta: "+11 this month", icon: Languages },
            { label: "Credits used", value: "12 / 50", delta: "24% of plan", icon: Users },
          ].map((s) => (
            <div key={s.label}>
              <dt className="text-xs text-[var(--muted-foreground)]">{s.label}</dt>
              <dd className="mt-0.5 text-lg font-semibold tracking-tight">{s.value}</dd>
              <div className="text-[11px] text-[var(--muted-foreground)]">{s.delta}</div>
            </div>
          ))}
        </dl>
      </section>

      {/* Feature cards */}
      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            Modules
          </h2>
          <span className="text-xs text-[var(--muted-foreground)]">4 workspaces</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.title}
                to={f.href as string}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${f.accent}`}
                />
                <div className="relative flex items-center justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]" />
                </div>
                <div className="relative mt-4 text-sm font-semibold tracking-tight">
                  {f.title}
                </div>
                <p className="relative mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {f.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent projects */}
      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Recent projects</h2>
          <Link
            to="/projects"
            className="text-xs font-medium text-[var(--primary)] hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-4 border-b border-[var(--border)] bg-[var(--muted)] px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            <div>Project</div>
            <div className="hidden md:block">Status</div>
            <div className="hidden md:block">Progress</div>
            <div className="text-right">Updated</div>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {projects.map((p) => (
              <li
                key={p.name}
                className="grid grid-cols-[1.6fr_1fr_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--muted)]/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">
                    {p.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="truncate text-xs text-[var(--muted-foreground)]">
                      {p.workspace}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                    {p.status}
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--primary)]"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {p.progress}%
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 text-xs text-[var(--muted-foreground)]">
                  {p.updated}
                  <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-[var(--muted)]">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}