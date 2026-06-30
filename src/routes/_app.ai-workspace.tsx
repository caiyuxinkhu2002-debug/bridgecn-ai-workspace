import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  Circle,
  LineChart,
  Users,
  Languages,
  ShieldCheck,
  Rocket,
  FileBarChart,
  Activity,
  ArrowUp,
  Database,
  TrendingUp,
  Search as SearchIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";

export const Route = createFileRoute("/_app/ai-workspace")({
  head: () => ({ meta: [{ title: "AI Workspace — BridgeCN AI" }] }),
  component: AIWorkspacePage,
});

type StepStatus = "completed" | "running" | "pending";

function AIWorkspacePage() {
  const { t } = useI18n();
  const { activeProject } = useWorkspace();

  const steps: {
    key: string;
    icon: typeof LineChart;
    status: StepStatus;
    progress: number;
    minutes: number;
  }[] = [
    { key: "market", icon: LineChart, status: "completed", progress: 100, minutes: 4 },
    { key: "consumer", icon: Users, status: "running", progress: 62, minutes: 6 },
    { key: "localization", icon: Languages, status: "pending", progress: 0, minutes: 5 },
    { key: "compliance", icon: ShieldCheck, status: "pending", progress: 0, minutes: 3 },
    { key: "launch", icon: Rocket, status: "pending", progress: 0, minutes: 7 },
    { key: "report", icon: FileBarChart, status: "pending", progress: 0, minutes: 4 },
  ];

  const activityKeys = Array.from({ length: 15 }, (_, i) => `aiws.activity.${i + 1}`);
  // Stable, deterministic timestamps so SSR / hydration matches.
  const baseMinutes = 9 * 60 + 12; // 09:12
  const times = activityKeys.map((_, i) => {
    const m = (baseMinutes + i * 2) % (24 * 60);
    const hh = Math.floor(m / 60).toString().padStart(2, "0");
    const mm = (m % 60).toString().padStart(2, "0");
    return `${hh}:${mm}`;
  });

  // Subtle pulse for the "running" indicator only — no other animation.
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => (p + 1) % 100), 1200);
    return () => clearInterval(id);
  }, []);

  const stageLabel = t(`stage.${activeProject.stage}`);

  return (
    <div className="space-y-6">
      {/* Top context bar */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[oklch(0.45_0.22_280)] text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">
                {t("aiws.header.title")}
              </h1>
              <p className="truncate text-xs text-[var(--muted-foreground)] md:text-sm">
                {t("aiws.header.sub")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-2">
            <ContextStat label={t("aiws.ctx.project")} value={activeProject.name} />
            <ContextStat label={t("aiws.ctx.stage")} value={stageLabel} />
            <ContextStat
              label={t("aiws.ctx.progress")}
              value={`${activeProject.progress}%`}
              accent
            />
          </div>
        </div>
      </div>

      {/* Three column workspace */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[25fr_45fr_30fr]">
        {/* LEFT */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
          <PanelHeader
            icon={<Activity className="h-3.5 w-3.5" />}
            title={t("aiws.left.title")}
            sub={t("aiws.left.sub")}
          />
          <ol className="flex flex-col gap-2 p-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <li
                  key={s.key}
                  className={`rounded-xl border px-3 py-3 transition-colors ${
                    s.status === "running"
                      ? "border-[var(--primary)]/40 bg-[var(--primary-soft)]"
                      : "border-[var(--border)] bg-[var(--background)]"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                        s.status === "completed"
                          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                          : s.status === "running"
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                      }`}
                    >
                      {s.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : s.status === "running" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">
                          {i + 1}. {t(`aiws.step.${s.key}`)}
                        </p>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                        {t(`aiws.step.${s.key}.desc`)}
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                        <div
                          className={`h-full rounded-full ${
                            s.status === "completed"
                              ? "bg-[var(--primary)]"
                              : s.status === "running"
                                ? "bg-[var(--primary)]"
                                : "bg-[var(--muted-foreground)]/30"
                          }`}
                          style={{
                            width: `${s.status === "running" ? Math.max(s.progress, 8) : s.progress}%`,
                            opacity: s.status === "running" ? 0.7 + (pulse % 6) / 60 : 1,
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-[var(--muted-foreground)]">
                        {t("aiws.duration").replace("{m}", String(s.minutes))}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* CENTER */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
          <PanelHeader
            icon={<SearchIcon className="h-3.5 w-3.5" />}
            title={t("aiws.center.title")}
            sub={t("aiws.center.sub")}
            right={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                Live
              </span>
            }
          />
          <ul className="max-h-[640px] divide-y divide-[var(--border)] overflow-y-auto">
            {activityKeys.map((k, i) => {
              const isLast = i === activityKeys.length - 1;
              return (
                <li key={k} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="mt-1 w-12 shrink-0 font-mono text-[10px] text-[var(--muted-foreground)]">
                    {times[i]}
                  </span>
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md ${
                      isLast
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    {isLast ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                  </span>
                  <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-[var(--foreground)]">
                    {t(k)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* RIGHT */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)] md:col-span-2 xl:col-span-1">
          <PanelHeader
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            title={t("aiws.right.title")}
            sub={t("aiws.right.sub")}
          />
          <div className="space-y-3 p-3">
            <OutputCard icon={LineChart} titleKey="aiws.out.summary" bodyKey="aiws.out.summary.body" />
            <OutputCard icon={Users} titleKey="aiws.out.persona" bodyKey="aiws.out.persona.body" />
            <OutputCard
              icon={Languages}
              titleKey="aiws.out.localization"
              bodyKey="aiws.out.localization.body"
            />
            <OutputCard icon={Rocket} titleKey="aiws.out.launch" bodyKey="aiws.out.launch.body" />
            <OutputCard
              icon={ShieldCheck}
              titleKey="aiws.out.confidence"
              bodyKey="aiws.out.confidence.body"
              meta="94%"
            />
            <OutputCard
              icon={Database}
              titleKey="aiws.out.sources"
              bodyKey="aiws.out.sources.body"
            />
          </div>
        </section>
      </div>

      {/* Ask BridgeCN AI */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
          <h2 className="text-sm font-semibold">{t("aiws.ask.title")}</h2>
        </div>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--ring)]/30"
        >
          <input
            type="text"
            placeholder={t("aiws.ask.placeholder")}
            className="h-9 flex-1 bg-transparent text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
          <button
            type="submit"
            className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
            aria-label={t("aiws.ask.send")}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}

function ContextStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-1.5 sm:bg-transparent sm:border-l sm:border-y-0 sm:border-r-0 sm:rounded-none sm:pl-4 sm:pr-0">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </div>
      <div
        className={`mt-0.5 truncate text-sm font-semibold ${
          accent ? "text-[var(--primary)]" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function PanelHeader({
  icon,
  title,
  sub,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--muted)] text-[var(--muted-foreground)]">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{title}</h2>
          {sub && (
            <p className="truncate text-[11px] text-[var(--muted-foreground)]">{sub}</p>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

function StatusBadge({ status }: { status: StepStatus }) {
  const { t } = useI18n();
  const map: Record<StepStatus, { cls: string; icon: React.ReactNode; key: string }> = {
    completed: {
      cls: "bg-[var(--primary)]/10 text-[var(--primary)]",
      icon: <CheckCircle2 className="h-3 w-3" />,
      key: "aiws.status.completed",
    },
    running: {
      cls: "bg-[var(--primary)] text-white",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      key: "aiws.status.running",
    },
    pending: {
      cls: "bg-[var(--muted)] text-[var(--muted-foreground)]",
      icon: <Circle className="h-3 w-3" />,
      key: "aiws.status.pending",
    },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${s.cls}`}
    >
      {s.icon}
      {t(s.key)}
    </span>
  );
}

function OutputCard({
  icon: Icon,
  titleKey,
  bodyKey,
  meta,
}: {
  icon: typeof LineChart;
  titleKey: string;
  bodyKey: string;
  meta?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--background)] text-[var(--primary)] shadow-[var(--shadow-soft)]">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <h3 className="truncate text-xs font-semibold">{t(titleKey)}</h3>
        </div>
        {meta && (
          <span className="shrink-0 rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
            {meta}
          </span>
        )}
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
        {t(bodyKey)}
      </p>
    </div>
  );
}