import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Play,
  Heart,
  Music2,
  MessageCircle,
  Gauge,
  FolderKanban,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
} from "recharts";

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

const spark = (seed: number, n = 14) =>
  Array.from({ length: n }, (_, i) => ({
    i,
    v: Math.round(
      40 +
        Math.sin(i / 1.8 + seed) * 12 +
        Math.cos(i / 3 + seed * 1.3) * 8 +
        (i / n) * 18,
    ),
  }));

const stats = [
  {
    title: "Xiaohongshu Trends",
    value: "+24.8%",
    sub: "K-beauty mentions · 30d",
    delta: "+4.2%",
    trend: "up" as const,
    icon: Heart,
    chart: "area" as const,
    data: spark(1),
  },
  {
    title: "Douyin Growth",
    value: "812M",
    sub: "Daily active users",
    delta: "+1.9%",
    trend: "up" as const,
    icon: Music2,
    chart: "line" as const,
    data: spark(2.4),
  },
  {
    title: "WeChat Users",
    value: "1.34B",
    sub: "Monthly active accounts",
    delta: "+0.6%",
    trend: "up" as const,
    icon: MessageCircle,
    chart: "area" as const,
    data: spark(3.1),
  },
  {
    title: "Consumer Confidence",
    value: "87.3",
    sub: "CN Index · Q2 2026",
    delta: "−1.4%",
    trend: "down" as const,
    icon: Gauge,
    chart: "bar" as const,
    data: spark(4.7),
  },
  {
    title: "Active Projects",
    value: "3",
    sub: "Across your workspace",
    delta: "+1 wk",
    trend: "up" as const,
    icon: FolderKanban,
    chart: "bar" as const,
    data: spark(5.5),
  },
] as const;

const projects = [
  {
    name: "Beauty of Joseon",
    workspace: "Hanbang skincare · Tier 1 cities",
    status: "Research",
    progress: 42,
    updated: "2h ago",
    initials: "BJ",
  },
  {
    name: "ANUA",
    workspace: "Xiaohongshu KOL campaign",
    status: "Localization",
    progress: 68,
    updated: "Yesterday",
    initials: "AN",
  },
  {
    name: "Medicube",
    workspace: "Tmall flagship rollout",
    status: "Launch Ready",
    progress: 94,
    updated: "3 days ago",
    initials: "MC",
  },
];

const statusStyles: Record<string, string> = {
  Research:
    "bg-[var(--muted)] text-[var(--muted-foreground)] ring-1 ring-inset ring-[var(--border)]",
  Localization:
    "bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-inset ring-[var(--primary)]/15",
  "Launch Ready":
    "bg-[oklch(0.96_0.04_150)] text-[oklch(0.42_0.12_150)] ring-1 ring-inset ring-[oklch(0.42_0.12_150)]/15",
};

function MiniChart({ type, data }: { type: "area" | "line" | "bar"; data: { i: number; v: number }[] }) {
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === "area" ? (
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`g-${data[0].v}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="var(--primary)"
              strokeWidth={1.75}
              fill={`url(#g-${data[0].v})`}
            />
          </AreaChart>
        ) : type === "line" ? (
          <ReLineChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <Line
              type="monotone"
              dataKey="v"
              stroke="var(--foreground)"
              strokeWidth={1.5}
              dot={false}
            />
          </ReLineChart>
        ) : (
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <Bar dataKey="v" fill="var(--primary)" radius={[2, 2, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 py-2 md:py-6">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.92 0.08 256 / 0.55), transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)]/70 px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            AI workspace for China market entry
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.025em] text-[var(--foreground)] md:text-5xl lg:text-6xl">
            Expand into China <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-[var(--foreground)] to-[var(--primary)] bg-clip-text text-transparent">
              with confidence.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            BridgeCN AI helps Korean companies research the Chinese market,
            localize marketing content, and plan successful market entry using AI.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button className="group inline-flex h-11 items-center gap-2 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5">
              New Research
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]">
              <Play className="h-3.5 w-3.5" />
              Explore Demo
            </button>
          </div>
        </div>
      </section>

      {/* China Market Snapshot */}
      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              China Market Snapshot
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Real-time signals across the platforms that matter.
            </p>
          </div>
          <div className="hidden items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] p-0.5 text-xs md:flex">
            {["7d", "30d", "90d"].map((k, i) => (
              <button
                key={k}
                className={`rounded-full px-3 py-1 font-medium ${
                  i === 1
                    ? "bg-[var(--muted)] text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((s) => {
            const Icon = s.icon;
            const Trend = s.trend === "up" ? TrendingUp : TrendingDown;
            return (
              <div
                key={s.title}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 transition-shadow hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--muted)] text-[var(--foreground)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                      s.trend === "up"
                        ? "text-[oklch(0.55_0.14_150)]"
                        : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    <Trend className="h-3 w-3" />
                    {s.delta}
                  </span>
                </div>
                <div className="mt-5">
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {s.title}
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight">
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                    {s.sub}
                  </div>
                </div>
                <div className="mt-4 -mx-1">
                  <MiniChart type={s.chart} data={s.data} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Projects */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              Recent Projects
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Continue where you left off.
            </p>
          </div>
          <Link
            to="/projects"
            className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            View all →
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          <div className="hidden grid-cols-[2fr_1fr_1.2fr_auto] gap-6 border-b border-[var(--border)] px-6 py-3 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] md:grid">
            <div>Project</div>
            <div>Status</div>
            <div>Progress</div>
            <div className="text-right">Updated</div>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {projects.map((p) => (
              <li
                key={p.name}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-5 transition-colors hover:bg-[var(--muted)]/50 md:grid-cols-[2fr_1fr_1.2fr_auto] md:gap-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--muted)] to-[var(--primary-soft)] text-xs font-semibold text-[var(--foreground)]">
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
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[p.status]}`}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="hidden items-center gap-3 md:flex">
                  <div className="h-1 w-full max-w-[160px] overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--foreground)]"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                    {p.progress}%
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 text-xs text-[var(--muted-foreground)]">
                  <span className="hidden sm:inline">{p.updated}</span>
                  <button className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--muted)]">
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