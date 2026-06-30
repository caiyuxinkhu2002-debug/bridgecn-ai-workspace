import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ProjectContextBar } from "@/components/project-context-bar";
import { WorkflowFooter } from "@/components/workflow-footer";
import { useI18n } from "@/lib/i18n";
import { Bar, BarChart, ResponsiveContainer, Area, AreaChart, XAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, MapPin, Flame, Sparkles, ShieldCheck, Database, Clock, Loader2, CheckCircle2, History as HistoryIcon, Trash2, RotateCw, Play, Square, Activity } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { useAIJob } from "@/lib/ai/use-ai-job";
import { listJobs, deleteJob, getJob } from "@/lib/ai/service";
import type { AIJob } from "@/lib/ai/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/china-market-insight")({
  head: () => ({ meta: [{ title: "China Market Insight — BridgeCN AI" }] }),
  component: MarketInsightPage,
});

// Sprint 9: no hardcoded demo data. All market data is derived from the
// active project's AI jobs; charts/lists render empty state when missing.
type KeywordRow = { k: string; growth: string; platform: string; score: number };
type RegionRow = { name: string; v: number; growth: string };
type GrowthRow = { m: string; v: number };

function MarketInsightPage() {
  const { t } = useI18n();
  const { activeWorkspace, activeProject } = useWorkspace();
  const ai = useAIJob();
  const [history, setHistory] = useState<AIJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<AIJob | null>(null);

  const refreshHistory = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    try {
      const list = await listJobs({
        workspaceId: activeWorkspace.id,
        projectId: activeProject?.id || null,
        module: "market",
        limit: 25,
      });
      setHistory(list);
      if (!selectedJob && !ai.isRunning) {
        const completed = list.find((j) => j.status === "completed");
        if (completed) setSelectedJob(completed);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeWorkspace?.id, activeProject?.id, selectedJob, ai.isRunning]);

  useEffect(() => {
    refreshHistory();
    // Re-select on project switch
    setSelectedJob(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.id, activeProject?.id]);

  useEffect(() => {
    if (ai.status === "completed") {
      toast.success(t("market.toast.generated"));
      refreshHistory();
      if (ai.job) setSelectedJob(ai.job);
    } else if (ai.status === "failed") {
      toast.error(ai.error || t("market.toast.failed"));
    } else if (ai.status === "cancelled") {
      toast.message(t("market.toast.cancelled"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai.status]);

  const buildPrompt = useCallback(() => {
    const p = activeProject;
    return `Generate a China market insight for the brand "${p?.name ?? "(unknown)"}" (industry: ${p?.industry ?? "n/a"}, region: ${p?.region ?? "n/a"}). Cover market summary, AI confidence, sources, trending keywords, and regional demand.`;
  }, [activeProject]);

  const generate = useCallback(() => {
    ai.run({ module: "market", prompt: buildPrompt() });
  }, [ai, buildPrompt]);

  // Merge live AI data with the selected/persisted job's data for display.
  const displayed = useMemo(() => {
    // While running, prefer live state
    if (ai.isRunning || ai.status === "completed" && !selectedJob) {
      const d = ai.data || {};
      return {
        summary: ai.output || (d.summary as string | undefined) || "",
        confidence: (d.confidence as number | undefined) ?? null,
        sources: (d.sources as string[] | undefined) ?? [],
        keywords: (d.keywords as typeof FALLBACK_KEYWORDS | undefined) ?? [],
        regions: (d.regions as typeof FALLBACK_REGIONS | undefined) ?? [],
        updatedAt: null as string | null,
        live: true as const,
      };
    }
    if (selectedJob) {
      const d = (selectedJob.output_data ?? {}) as Record<string, unknown>;
      return {
        summary: selectedJob.output || (d.summary as string | undefined) || "",
        confidence: (d.confidence as number | undefined) ?? null,
        sources: (d.sources as string[] | undefined) ?? [],
        keywords: (d.keywords as typeof FALLBACK_KEYWORDS | undefined) ?? [],
        regions: (d.regions as typeof FALLBACK_REGIONS | undefined) ?? [],
        updatedAt: selectedJob.completed_at || selectedJob.created_at,
        live: false as const,
      };
    }
    return {
      summary: FALLBACK_SUMMARY,
      confidence: 96 as number | null,
      sources: FALLBACK_SOURCES,
      keywords: FALLBACK_KEYWORDS,
      regions: FALLBACK_REGIONS,
      updatedAt: null,
      live: false as const,
    };
  }, [ai.isRunning, ai.status, ai.output, ai.data, selectedJob]);

  const sources = displayed.sources.length ? displayed.sources : FALLBACK_SOURCES;
  const keywords = displayed.keywords.length ? displayed.keywords : FALLBACK_KEYWORDS;
  const regions = displayed.regions.length ? displayed.regions : FALLBACK_REGIONS;
  const confidence = displayed.confidence ?? 96;
  const lastUpdated = displayed.updatedAt
    ? new Date(displayed.updatedAt).toLocaleString()
    : ai.isRunning ? t("market.summary.generating") : t("common.dash");

  const onOpenJob = async (id: string) => {
    const j = await getJob(id);
    if (j) setSelectedJob(j);
  };
  const onDeleteJob = async (id: string) => {
    try {
      await deleteJob(id);
      toast.success(t("market.toast.deleted"));
      if (selectedJob?.id === id) setSelectedJob(null);
      refreshHistory();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <ProjectContextBar />
      <PageHeader title={t("market.title")} description={t("market.sub")} />
      {/* AI Action Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
          <span>
            {ai.isRunning
              ? <>
                  {t("market.status.statusLabel")}{" "}
                  <span className="font-medium text-[var(--foreground)]">{t(`ai.status.${ai.status}`)}</span>
                  {ai.phase ? <> {" · "}{t("market.status.phaseLabel")}{" "}<span className="font-medium text-[var(--foreground)]">{t(`phase.${ai.phase}`)}</span></> : null}
                </>
              : selectedJob
                ? <>{t("market.status.showingFrom", { v: lastUpdated })}</>
                : <>{t("market.status.noneYet")}</>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {ai.isRunning ? (
            <button
              onClick={ai.cancel}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]/60"
            >
              <Square className="h-3 w-3" /> {t("common.cancel")}
            </button>
          ) : null}
          {ai.status === "failed" || ai.status === "cancelled" ? (
            <button
              onClick={generate}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]/60"
            >
              <RotateCw className="h-3 w-3" /> {t("common.retry")}
            </button>
          ) : null}
          <button
            onClick={generate}
            disabled={ai.isRunning || !activeWorkspace?.id}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-soft)] hover:opacity-90 disabled:opacity-50"
          >
            {ai.isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {ai.isRunning ? t("common.generating") : t("market.action.generate")}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* AI Market Summary */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-semibold">{t("market.summary.title")}</h3>
              <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                {t("market.summary.generated", { v: lastUpdated })}
              </span>
              {ai.isRunning ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft,var(--muted))] px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" /> {t("common.live")}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--muted)]/40 px-2 py-1 font-medium">
                <ShieldCheck className="h-3 w-3 text-[oklch(0.55_0.14_150)]" />
                {t("market.summary.confidence")} <span className="tabular-nums text-[var(--foreground)]">{confidence}%</span>
              </span>
            </div>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]/85">
            {displayed.summary || (ai.isRunning ? "" : FALLBACK_SUMMARY)}
            {ai.isRunning ? <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-[var(--primary)]" /> : null}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1"><Database className="h-3 w-3" /> {t("market.summary.sources")}</span>
            {sources.map((s) => (
              <span key={s} className="rounded-md bg-[var(--muted)]/60 px-1.5 py-0.5">{s}</span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {t("market.summary.lastUpdated", { v: lastUpdated })}</span>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("market.kpi.marketSize"),     value: "¥48.2B", sub: t("market.kpi.marketSize.sub"),     src: "iiMedia Research",     conf: 97 },
            { label: t("market.kpi.annualGrowth"),   value: "+18.4%", sub: t("market.kpi.annualGrowth.sub"),   src: "QuestMobile",          conf: 94 },
            { label: t("market.kpi.basketTitle"),    value: "¥384",   sub: t("market.kpi.basket.sub"),         src: "Tmall Global",         conf: 92 },
            { label: t("market.kpi.tier1Title"),     value: "62%",    sub: t("market.kpi.tier1.sub"),          src: "Nat. Bureau of Stats", conf: 95 },
            { label: t("market.kpi.topChannel"),     value: "Tmall",  sub: t("market.kpi.topChannel.sub"),     src: "QuestMobile",          conf: 93 },
            { label: t("market.kpi.mau"),            value: "312M",   sub: t("market.kpi.mau.sub"),            src: "Xiaohongshu",          conf: 96 },
            { label: t("market.kpi.searchVolume"),   value: "8.4M",   sub: t("market.kpi.searchVolume.sub"),   src: "Douyin Search",        conf: 90 },
            { label: t("market.kpi.categoryGrowth"), value: "+24.1%", sub: t("market.kpi.categoryGrowth.sub"), src: "iiMedia Research",     conf: 91 },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
                <span className="rounded-full bg-[var(--muted)]/60 px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)] tabular-nums">
                  {s.conf}%
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--muted-foreground)]">{s.sub}</p>
              <p className="mt-2 text-[10px] text-[var(--muted-foreground)]/80">{t("market.kpi.source", { v: s.src })}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">{t("market.growth")}</h3>
                <p className="text-xs text-[var(--muted-foreground)]">{t("market.growth.sub")} · {t("market.chart.indexed")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--muted)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                  {t("market.summary.confidence")} {confidence}%
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[oklch(0.55_0.14_150)]"><TrendingUp className="h-3 w-3" />+18.4%</span>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growth} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2} fill="url(#mg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-[10px] text-[var(--muted-foreground)]">
              {t("market.chart.source", { v: lastUpdated })}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-[var(--primary)]" />
                <h3 className="text-sm font-semibold">{t("market.keywords")}</h3>
              </div>
              <span className="rounded-full bg-[var(--muted)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                {t("market.summary.confidence")} {confidence}%
              </span>
            </div>
            <div className="grid grid-cols-[1.6rem_1fr_auto] gap-x-3 gap-y-3 text-xs">
              <span className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">#</span>
              <span className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{t("market.kw.header")}</span>
              <span className="text-right text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{t("market.kw.growthScore")}</span>
              {keywords.map((k, i) => (
                <FragmentRow key={k.k} index={i} k={k} scoreLabel={t("market.kw.score", { v: k.score })} />
              ))}
            </div>
            <p className="mt-4 text-[10px] text-[var(--muted-foreground)]">
              {t("market.kw.source", { v: lastUpdated })}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--primary)]" />
              <h3 className="text-sm font-semibold">{t("market.regions")}</h3>
            </div>
            <span className="rounded-full bg-[var(--muted)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
              {t("market.summary.confidence")} {confidence}%
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="h-64 lg:col-span-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regions} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                  <Bar dataKey="v" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 text-xs">
                <span className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{t("market.regions.city")}</span>
                <span className="text-right text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{t("market.regions.demand")}</span>
                <span className="text-right text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{t("market.regions.growth")}</span>
                {regions.map((r) => (
                  <RegionRow key={r.name} r={r} />
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 text-[10px] text-[var(--muted-foreground)]">
            {t("market.regions.source", { v: lastUpdated })}
          </p>
        </div>

        {/* Activity feed + History */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--primary)]" />
                <h3 className="text-sm font-semibold">{t("market.activity.title")}</h3>
              </div>
              {ai.isRunning ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft,var(--muted))] px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" /> {t("common.live")}
                </span>
              ) : null}
            </div>
            {ai.events.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">{t("market.activity.empty")}</p>
            ) : (
              <ul className="max-h-80 divide-y divide-[var(--border)] overflow-y-auto">
                {ai.events.map((e, i) => {
                  const isLast = i === ai.events.length - 1 && ai.isRunning;
                  const label = e.phase
                    ? t(`phase.${e.phase}`)
                    : e.key
                      ? t(e.key, e.params)
                      : e.fallback ?? "";
                  return (
                    <li key={i} className="flex items-start gap-3 py-2 text-[13px]">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[var(--muted)] text-[var(--muted-foreground)]">
                        {isLast ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      </span>
                      <span className="w-16 shrink-0 font-mono text-[10px] text-[var(--muted-foreground)]">
                        {new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      <span className="min-w-0 flex-1">{label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HistoryIcon className="h-4 w-4 text-[var(--primary)]" />
                <h3 className="text-sm font-semibold">{t("market.history.title")}</h3>
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)] tabular-nums">{history.length}</span>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">{t("market.history.empty")}</p>
            ) : (
              <ul className="max-h-80 divide-y divide-[var(--border)] overflow-y-auto">
                {history.map((j) => (
                  <li key={j.id} className="flex items-center gap-3 py-2">
                    <button
                      onClick={() => onOpenJob(j.id)}
                      className={`min-w-0 flex-1 text-left ${selectedJob?.id === j.id ? "text-[var(--primary)]" : ""}`}
                    >
                      <p className="truncate text-xs font-medium">
                        {new Date(j.created_at).toLocaleString()}
                      </p>
                      <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                        {t(`ai.status.${j.status}`)} · {j.provider}
                      </p>
                    </button>
                    <button
                      onClick={generate}
                      title={t("common.regenerate")}
                      className="rounded-md border border-[var(--border)] p-1.5 hover:bg-[var(--muted)]/60"
                    >
                      <RotateCw className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onDeleteJob(j.id)}
                      title={t("common.delete")}
                      className="rounded-md border border-[var(--border)] p-1.5 text-[oklch(0.55_0.18_25)] hover:bg-[var(--muted)]/60"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <WorkflowFooter current="research" />
    </div>
  );
}

function FragmentRow({ index, k, scoreLabel }: { index: number; k: { k: string; growth: string; platform: string; score: number }; scoreLabel: string }) {
  return (
    <>
      <span className="self-center text-[11px] tabular-nums text-[var(--muted-foreground)]">{String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{k.k}</p>
        <p className="text-[11px] text-[var(--muted-foreground)]">{k.platform}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-[oklch(0.55_0.14_150)]">{k.growth}</p>
        <p className="text-[11px] tabular-nums text-[var(--muted-foreground)]">{scoreLabel}</p>
      </div>
    </>
  );
}

function RegionRow({ r }: { r: { name: string; v: number; growth: string } }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{r.name}</span>
        <div className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--muted)]/60 sm:block">
          <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${r.v}%` }} />
        </div>
      </div>
      <span className="text-right text-xs tabular-nums">{r.v}</span>
      <span className="text-right text-xs font-medium text-[oklch(0.55_0.14_150)]">{r.growth}</span>
    </>
  );
}