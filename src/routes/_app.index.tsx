import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PlayCircle,
  MoreHorizontal,
  FolderKanban,
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

// --- Mini sparkline ---
function Sparkline({
  data,
  trend = "up",
}: {
  data: number[];
  trend?: "up" | "down";
}) {
  const w = 120;
  const h = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((d, i) => {
    const x = i * step;
    const y = h - ((d - min) / range) * h;
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const stroke = trend === "up" ? "var(--primary)" : "oklch(0.55 0.02 260)";
  const gradId = `g-${trend}-${data.join("")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-full">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const snapshots = [
  {
    label: "Xiaohongshu Trends",
    value: "+38.4%",
    sub: "K-beauty mentions · 30d",
    trend: "up" as const,
    delta: "+12.1%",
    data: [10, 14, 13, 17, 16, 22, 24, 28, 27, 32, 36, 40],
  },
  {
    label: "Douyin Growth",
    value: "742M",
    sub: "Daily active users",
    trend: "up" as const,
    delta: "+4.2%",
    data: [620, 640, 655, 670, 680, 690, 700, 710, 715, 725, 735, 742],
  },
  {
    label: "WeChat Users",
    value: "1.36B",
    sub: "Monthly active · Q1",
    trend: "up" as const,
    delta: "+0.8%",
    data: [1290, 1300, 1310, 1315, 1325, 1330, 1335, 1340, 1345, 1350, 1355, 1360],
  },
  {
    label: "Consumer Confidence",
    value: "89.2",
    sub: "CCI index · May",
    trend: "down" as const,
    delta: "-1.6%",
    data: [96, 95, 94, 94, 93, 92, 92, 91, 91, 90, 89.5, 89.2],
  },
  {
    label: "Active Projects",
    value: "12",
    sub: "Across your workspace",
    trend: "up" as const,
    delta: "+3",
    data: [5, 6, 6, 7, 7, 8, 9, 9, 10, 11, 11, 12],
  },
];

const projects = [
  {
    name: "Beauty of Joseon",
    workspace: "Hanbang skincare · China expansion",
    status: "Research",
    progress: 42,
    owner: "Sora Kim",
    updated: "2h ago",
    initials: "BJ",
  },
  {
    name: "ANUA",
    workspace: "Xiaohongshu KOL strategy",
    status: "Localization",
    progress: 68,
    owner: "Jihoon Park",
    updated: "Yesterday",
    initials: "AN",
  },
  {
    name: "Medicube",
    workspace: "Tmall Global launch",
    status: "Launch Ready",
    progress: 94,
    owner: "Minji Lee",
    updated: "3 days ago",
    initials: "MC",
  },
];

const statusStyles: Record<string, string> = {
  Research:
    "bg-[var(--muted)] text-[var(--muted-foreground)] ring-1 ring-[var(--border)]",
  Localization:
    "bg-[var(--primary-soft)] text-[var(--accent-foreground)] ring-1 ring-[var(--primary-soft)]",
  "Launch Ready":
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
};

function DashboardPage() {
  return (
    <div className="space-y-12 md:space-y-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background)] px-6 py-12 shadow-[var(--shadow-soft)] md:px-12 md:py-16">
        {/* subtle decorative grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, oklch(0.85 0.01 260) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 80% 0%, black 30%, transparent 75%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.92 0.06 258 / 0.55), transparent)",
          }}
        />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            BridgeCN AI · Workspace
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--foreground)] md:text-5xl lg:text-[56px]">
            Expand into China
            <br />
            <span className="text-[var(--muted-foreground)]">with confidence.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            BridgeCN AI helps Korean companies research the Chinese market,
            localize marketing content, and plan successful market entry using AI.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <button className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90">
              <Sparkles className="h-4 w-4" />
              New Research
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]">
              <PlayCircle className="h-4 w-4 text-[var(--muted-foreground)]" />
              Explore Demo
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted-foreground)]">
            <span>Trusted by Korean brands launching in China</span>
            <span className="font-medium tracking-tight text-[var(--foreground)]/70">Beauty of Joseon</span>
            <span className="font-medium tracking-tight text-[var(--foreground)]/70">ANUA</span>
            <span className="font-medium tracking-tight text-[var(--foreground)]/70">Medicube</span>
            <span className="font-medium tracking-tight text-[var(--foreground)]/70">Round Lab</span>
          </div>
        </div>
      </section>

      {/* CHINA MARKET SNAPSHOT */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              China Market Snapshot
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Real-time signals across the platforms that matter most.
            </p>
          </div>
          <button className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Last 30 days
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {snapshots.map((s) => {
            const TrendIcon = s.trend === "up" ? ArrowUpRight : ArrowDownRight;
            const trendColor =
              s.trend === "up"
                ? "text-emerald-600 bg-emerald-50 ring-emerald-100"
                : "text-[var(--muted-foreground)] bg-[var(--muted)] ring-[var(--border)]";
            return (
              <div
                key={s.label}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 transition-shadow hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    {s.label}
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${trendColor}`}
                  >
                    <TrendIcon className="h-3 w-3" />
                    {s.delta}
                  </span>
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  {s.value}
                </div>
                <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  {s.sub}
                </div>
                <div className="mt-4">
                  <Sparkline data={s.data} trend={s.trend} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RECENT PROJECTS */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              Recent projects
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Workspaces you've been working on.
            </p>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          <div className="hidden md:grid grid-cols-[1.8fr_1fr_1.2fr_0.9fr_auto] gap-4 border-b border-[var(--border)] px-6 py-3 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            <div>Project</div>
            <div>Status</div>
            <div>Progress</div>
            <div>Updated</div>
            <div />
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {projects.map((p) => (
              <li
                key={p.name}
                className="grid grid-cols-[1fr_auto] md:grid-cols-[1.8fr_1fr_1.2fr_0.9fr_auto] items-center gap-4 px-5 py-5 md:px-6 transition-colors hover:bg-[var(--muted)]/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--muted)] text-xs font-semibold tracking-tight text-[var(--foreground)] ring-1 ring-[var(--border)]">
                    {p.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--foreground)]">
                      {p.name}
                    </div>
                    <div className="truncate text-xs text-[var(--muted-foreground)]">
                      {p.workspace}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[p.status]}`}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--foreground)]"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                    {p.progress}%
                  </span>
                </div>
                <div className="hidden md:block text-xs text-[var(--muted-foreground)]">
                  {p.updated}
                </div>
                <button className="grid h-8 w-8 place-items-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--muted)]/40 px-6 py-3">
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <FolderKanban className="h-3.5 w-3.5" />
              Showing 3 of 12 projects
            </div>
            <Link
              to="/projects"
              className="text-xs font-medium text-[var(--foreground)] hover:underline"
            >
              Open Projects →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}