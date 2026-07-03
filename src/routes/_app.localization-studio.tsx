import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { DataIntegrityBanner } from "@/components/data-integrity-banner";
import { ProjectContextBar } from "@/components/project-context-bar";
import { WorkflowFooter } from "@/components/workflow-footer";
import { useI18n } from "@/lib/i18n";
import {
  ArrowRight,
  Wand2,
  Copy,
  FileDown,
  Save,
  History as HistoryIcon,
  Trash2,
  RotateCw,
  ShieldCheck,
  GitCompare,
  CheckCircle2,
  Loader2,
  Sparkles,
  Square,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { useAIJob } from "@/lib/ai/use-ai-job";
import { useLocalizedOutput } from "@/lib/ai/use-localized-output";
import { listJobs, deleteJob, getJob } from "@/lib/ai/service";
import type { AIJob, AIJobPhase } from "@/lib/ai/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/localization-studio")({
  head: () => ({ meta: [{ title: "Localization Studio — BridgeCN AI" }] }),
  component: LocalizationStudioPage,
});

const CHANNELS = [
  { id: "Xiaohongshu", key: "loc.channel.xiaohongshu" },
  { id: "Douyin", key: "loc.channel.douyin" },
  { id: "Tmall PDP", key: "loc.channel.tmall" },
  { id: "JD.com", key: "loc.channel.jd" },
  { id: "WeChat", key: "loc.channel.wechat" },
  { id: "RED KOL", key: "loc.channel.redkol" },
] as const;
const TONES = [
  { id: "Luxury", key: "loc.tone.luxury" },
  { id: "Scientific", key: "loc.tone.scientific" },
  { id: "Friendly", key: "loc.tone.friendly" },
  { id: "Natural", key: "loc.tone.natural" },
  { id: "Premium", key: "loc.tone.premium" },
  { id: "Young", key: "loc.tone.young" },
] as const;
const AUDIENCES = [
  { id: "Gen Z", key: "loc.audience.genZ" },
  { id: "Office Workers", key: "loc.audience.office" },
  { id: "Mothers", key: "loc.audience.mothers" },
  { id: "Niche Segment", key: "loc.audience.sensitive" },
  { id: "High-income Consumers", key: "loc.audience.highIncome" },
] as const;

type Channel = (typeof CHANNELS)[number]["id"];
type Tone = (typeof TONES)[number]["id"];
type Audience = (typeof AUDIENCES)[number]["id"];

type LocItem = { source: string; target: string; note: string };
type LocInsights = {
  reasoning?: string;
  consumer?: string;
  seo?: string[];
  platform?: string;
  cultural?: string;
};
type LocCompliance = {
  advertising?: string;
  sensitive?: string;
  risk?: string;
  regulation?: string;
};
type LocScores = { localization?: number; seo?: number; native?: number; platformMatch?: number };

const PHASE_ORDER: AIJobPhase[] = ["thinking", "searching", "analyzing", "writing", "completed"];
const PHASE_KEY: Record<AIJobPhase, string> = {
  thinking: "phase.thinking",
  searching: "loc.phase.searching",
  analyzing: "loc.phase.analyzing",
  writing: "loc.phase.writing",
  completed: "phase.completed",
};

function LocalizationStudioPage() {
  const { t } = useI18n();
  const { activeWorkspace, activeProject } = useWorkspace();
  const ai = useAIJob();

  const [channel, setChannel] = useState<Channel>("Xiaohongshu");
  const [tone, setTone] = useState<Tone>("Premium");
  const [audience, setAudience] = useState<Audience>("High-income Consumers");

  const [history, setHistory] = useState<AIJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<AIJob | null>(null);
  const [compareJob, setCompareJob] = useState<AIJob | null>(null);

  const liveData = useLocalizedOutput(
    (ai.data ?? null) as ({ [k: string]: unknown } & { _locale?: string }) | null,
  );
  const jobData = useLocalizedOutput(
    (selectedJob?.output_data ?? null) as ({ [k: string]: unknown } & { _locale?: string }) | null,
  );

  // Source content from active project
  const source = useMemo(() => {
    const p = activeProject;
    return {
      brand: p?.name ?? "",
      description: p?.description || p?.summary || "",
      productCopy:
        p?.summary || (p?.description ?? "") || `${p?.industry ?? ""} · ${p?.targetMarket ?? ""}`,
    };
  }, [activeProject]);

  const buildPrompt = useCallback(() => {
    const p = activeProject;
    const kb = p?.knowledgeBase || {};
    return [
      `Localize the following brand content for Mainland China.`,
      `Brand: ${kb.company || p?.name || "(unnamed)"}`,
      `Industry: ${kb.industry || p?.industry || "n/a"}`,
      `Category: ${kb.category || "n/a"}`,
      `Target market: ${p?.targetMarket ?? p?.region ?? "n/a"}`,
      `Brand story: ${kb.brandStory || source.description || "(none)"}`,
      `Brand tone: ${(kb.brandTone || []).join(", ") || "n/a"}`,
      `Keywords: ${(kb.keywords || []).join(", ") || "n/a"}`,
      `Target audience: ${kb.targetAudience || "n/a"}`,
      `Korean source copy: ${kb.koreanCopy || "n/a"}`,
      `Channel: ${channel}`,
      `Tone: ${tone}`,
      `Audience: ${audience}`,
    ].join("\n");
  }, [activeProject, source.description, channel, tone, audience]);

  const generate = useCallback(() => {
    ai.run({
      module: "localization",
      prompt: buildPrompt(),
      input: { channel, tone, audience, projectId: activeProject?.id },
    });
  }, [ai, buildPrompt, channel, tone, audience, activeProject?.id]);

  const refreshHistory = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    try {
      const list = await listJobs({
        workspaceId: activeWorkspace.id,
        projectId: activeProject?.id || null,
        module: "localization",
        limit: 25,
      });
      setHistory(list);
      if (!selectedJob && !ai.isRunning) {
        const c = list.find((j) => j.status === "completed");
        if (c) setSelectedJob(c);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeWorkspace?.id, activeProject?.id, selectedJob, ai.isRunning]);

  // Reset selection on project switch & re-load history
  useEffect(() => {
    setSelectedJob(null);
    setCompareJob(null);
    refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.id, activeProject?.id]);

  // React to AI status changes
  useEffect(() => {
    if (ai.status === "completed") {
      toast.success(t("loc.toast.generated"));
      refreshHistory();
      if (ai.job) setSelectedJob(ai.job);
    } else if (ai.status === "failed") {
      toast.error(ai.error || t("loc.toast.failed"));
    } else if (ai.status === "cancelled") {
      toast.message(t("loc.toast.cancelled"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai.status]);

  // Auto-regenerate when the user changes channel/tone/audience (debounced via effect)
  // First-mount guard: only fire after we have an active project AND user has interacted.
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched) return;
    if (!activeWorkspace?.id) return;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, tone, audience]);

  // Pick the data to display: live stream → most recent completed → empty.
  const displayed = useMemo(() => {
    const live = ai.isRunning || (ai.status === "completed" && !selectedJob);
    if (live) {
      const d = (liveData ?? ai.data ?? {}) as Record<string, unknown>;
      return {
        items: (d.items as LocItem[] | undefined) ?? [],
        insights: ((d.insights as LocInsights | undefined) ?? {}) as LocInsights,
        compliance: ((d.compliance as LocCompliance | undefined) ?? {}) as LocCompliance,
        scores: ((d.scores as LocScores | undefined) ?? {}) as LocScores,
        updatedAt: null as string | null,
        live: true as const,
        output: ai.output,
      };
    }
    if (selectedJob) {
      const d = (jobData ?? selectedJob.output_data ?? {}) as Record<string, unknown>;
      return {
        items: (d.items as LocItem[] | undefined) ?? [],
        insights: ((d.insights as LocInsights | undefined) ?? {}) as LocInsights,
        compliance: ((d.compliance as LocCompliance | undefined) ?? {}) as LocCompliance,
        scores: ((d.scores as LocScores | undefined) ?? {}) as LocScores,
        updatedAt: selectedJob.completed_at || selectedJob.created_at,
        live: false as const,
        output: selectedJob.output,
      };
    }
    return {
      items: [] as LocItem[],
      insights: {} as LocInsights,
      compliance: {} as LocCompliance,
      scores: {} as LocScores,
      updatedAt: null as string | null,
      live: false as const,
      output: "",
    };
  }, [ai.isRunning, ai.status, ai.data, ai.output, selectedJob, liveData, jobData]);

  // ── Export helpers ──
  const toMarkdown = useCallback(() => {
    const lines: string[] = [];
    lines.push(`# Localization · ${activeProject?.name ?? ""}`);
    lines.push("");
    lines.push(`- Channel: **${channel}**  · Tone: **${tone}**  · Audience: **${audience}**`);
    if (displayed.updatedAt)
      lines.push(`- Generated: ${new Date(displayed.updatedAt).toLocaleString()}`);
    lines.push("");
    lines.push("## Localized segments");
    displayed.items.forEach((it, i) => {
      lines.push(`### ${i + 1}. ${it.note}`);
      lines.push(`- KR: ${it.source}`);
      lines.push(`- CN: ${it.target}`);
    });
    if (displayed.insights.reasoning) {
      lines.push("");
      lines.push("## Localization Insights");
      lines.push(`- Why wording changed: ${displayed.insights.reasoning}`);
      if (displayed.insights.consumer)
        lines.push(`- Consumer preference: ${displayed.insights.consumer}`);
      if (displayed.insights.seo)
        lines.push(`- SEO keywords: ${displayed.insights.seo.join(", ")}`);
      if (displayed.insights.platform)
        lines.push(`- Platform optimization: ${displayed.insights.platform}`);
      if (displayed.insights.cultural)
        lines.push(`- Cultural adaptation: ${displayed.insights.cultural}`);
    }
    if (displayed.compliance.risk) {
      lines.push("");
      lines.push("## Compliance");
      lines.push(`- Advertising: ${displayed.compliance.advertising}`);
      lines.push(`- Sensitive words: ${displayed.compliance.sensitive}`);
      lines.push(`- Risk level: ${displayed.compliance.risk}`);
      lines.push(`- Regulation: ${displayed.compliance.regulation}`);
    }
    if (displayed.scores.localization != null) {
      lines.push("");
      lines.push("## Scores");
      lines.push(`- Localization: ${displayed.scores.localization}`);
      lines.push(`- SEO: ${displayed.scores.seo}`);
      lines.push(`- Native expression: ${displayed.scores.native}`);
      lines.push(`- Platform match: ${displayed.scores.platformMatch}`);
    }
    return lines.join("\n");
  }, [activeProject?.name, channel, tone, audience, displayed]);

  const onCopy = useCallback(async () => {
    const text = displayed.items.map((it) => it.target).join("\n\n") || displayed.output;
    await navigator.clipboard.writeText(text);
    toast.success(t("common.copied"));
  }, [displayed]);

  const onExportMd = useCallback(() => {
    const blob = new Blob([toMarkdown()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `localization-${activeProject?.name ?? "project"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [toMarkdown, activeProject?.name]);

  const onExportPdf = useCallback(() => {
    const html = `<html><head><title>Localization · ${activeProject?.name ?? ""}</title>
      <style>body{font-family:ui-sans-serif,system-ui,-apple-system;padding:32px;color:#111;}h1{font-size:20px;}h2{font-size:14px;margin-top:24px}h3{font-size:12px;margin-top:16px}p,li{font-size:12px;line-height:1.6}pre{white-space:pre-wrap;font:inherit}</style>
      </head><body><pre>${toMarkdown().replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string)}</pre>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return toast.error(t("loc.toast.popupBlocked"));
    w.document.write(html);
    w.document.close();
  }, [toMarkdown, activeProject?.name]);

  const onSaveVersion = useCallback(() => {
    if (!selectedJob) return toast.message(t("loc.toast.generateFirst"));
    toast.success(t("loc.toast.versionSaved"));
  }, [selectedJob]);

  // History actions
  const onOpenJob = async (id: string) => {
    const j = await getJob(id);
    if (j) {
      setSelectedJob(j);
      setCompareJob(null);
    }
  };
  const onDeleteJob = async (id: string) => {
    try {
      await deleteJob(id);
      toast.success(t("loc.toast.deleted"));
      if (selectedJob?.id === id) setSelectedJob(null);
      if (compareJob?.id === id) setCompareJob(null);
      refreshHistory();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const onCompare = async (id: string) => {
    if (compareJob?.id === id) return setCompareJob(null);
    const j = await getJob(id);
    if (j) setCompareJob(j);
  };
  const onRestore = async (id: string) => {
    const j = await getJob(id);
    if (j) {
      setSelectedJob(j);
      toast.success(t("loc.toast.restored"));
    }
  };

  // Pill button helper
  const Pill = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium ${active ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]" : "border-[var(--border)] hover:bg-[var(--muted)]"}`}
    >
      {children}
    </button>
  );

  const activePhaseIdx = ai.phase ? PHASE_ORDER.indexOf(ai.phase) : -1;

  return (
    <div>
      <ProjectContextBar />
      <PageHeader title={t("loc.title")} description={t("loc.sub")} />
      <DataIntegrityBanner />

      <div className="space-y-6">
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            {ai.isRunning ? (
              <span>
                {t("loc.status.statusLabel")}{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {t(`ai.status.${ai.status}`)}
                </span>
                {ai.phase ? (
                  <>
                    {" · "}
                    {t("loc.status.phaseLabel")}{" "}
                    <span className="font-medium text-[var(--foreground)]">
                      {t(PHASE_KEY[ai.phase])}
                    </span>
                  </>
                ) : null}
              </span>
            ) : selectedJob ? (
              <span>
                {t("loc.status.showingFrom", {
                  v: new Date(selectedJob.created_at).toLocaleString(),
                })}
              </span>
            ) : (
              <span>{t("loc.status.noneYet")}</span>
            )}
          </div>
          <div className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 text-xs">
            <span className="font-medium">한국어</span>
            <ArrowRight className="h-3 w-3 text-[var(--muted-foreground)]" />
            <span className="font-medium">简体中文</span>
          </div>
          <div className="flex items-center gap-2">
            {ai.isRunning ? (
              <button
                onClick={ai.cancel}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]/60"
              >
                <Square className="h-3 w-3" /> {t("common.cancel")}
              </button>
            ) : null}
            {ai.status === "failed" || ai.status === "cancelled" ? (
              <button
                onClick={generate}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]/60"
              >
                <RotateCw className="h-3 w-3" /> {t("common.retry")}
              </button>
            ) : null}
            <button
              onClick={generate}
              disabled={ai.isRunning || !activeWorkspace?.id}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-soft)] hover:opacity-90 disabled:opacity-50"
            >
              {ai.isRunning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="h-3 w-3" />
              )}
              {ai.isRunning ? t("common.generating") : t("common.regenerate")}
            </button>
          </div>
        </div>

        {/* Controls: Channel / Tone / Audience */}
        <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-soft)]">
          <ControlRow label={t("loc.control.channel")}>
            {CHANNELS.map((c) => (
              <Pill
                key={c.id}
                active={channel === c.id}
                onClick={() => {
                  setChannel(c.id);
                  setTouched(true);
                }}
              >
                {t(c.key)}
              </Pill>
            ))}
          </ControlRow>
          <ControlRow label={t("loc.control.tone")}>
            {TONES.map((c) => (
              <Pill
                key={c.id}
                active={tone === c.id}
                onClick={() => {
                  setTone(c.id);
                  setTouched(true);
                }}
              >
                {t(c.key)}
              </Pill>
            ))}
          </ControlRow>
          <ControlRow label={t("loc.control.audience")}>
            {AUDIENCES.map((c) => (
              <Pill
                key={c.id}
                active={audience === c.id}
                onClick={() => {
                  setAudience(c.id);
                  setTouched(true);
                }}
              >
                {t(c.key)}
              </Pill>
            ))}
          </ControlRow>
        </div>

        {/* Phase stepper */}
        {ai.isRunning || ai.status === "completed" ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-soft)]">
            <ol className="flex flex-wrap items-center gap-2">
              {PHASE_ORDER.map((p, idx) => {
                const done = activePhaseIdx > idx || ai.status === "completed";
                const active = ai.phase === p && ai.isRunning;
                return (
                  <li key={p} className="flex items-center gap-2">
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-md ${active ? "bg-[var(--primary)] text-white" : done ? "bg-[oklch(0.55_0.14_150)] text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}
                    >
                      {active ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                    </span>
                    <span
                      className={`text-xs ${active || done ? "font-medium text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
                    >
                      {t(PHASE_KEY[p])}
                    </span>
                    {idx < PHASE_ORDER.length - 1 ? (
                      <ArrowRight className="h-3 w-3 text-[var(--muted-foreground)]" />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}

        {/* Source / Localized pairs */}
        <div className="space-y-4">
          {displayed.items.length === 0 && !ai.isRunning ? <EmptySource source={source} /> : null}
          {displayed.items.map((p, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]"
            >
              <div className="grid divide-y divide-[var(--border)] md:grid-cols-2 md:divide-x md:divide-y-0">
                <div className="p-5">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    한국어 · {t("loc.source")}
                  </div>
                  <p className="text-base leading-relaxed">{p.source}</p>
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      简体中文 · {t("loc.translation")}
                    </div>
                    <button
                      onClick={generate}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)]"
                    >
                      <Wand2 className="h-3 w-3" />
                      {t("common.regenerate")}
                    </button>
                  </div>
                  <p className="text-base leading-relaxed">{p.target}</p>
                </div>
              </div>
              <div className="border-t border-[var(--border)] bg-[var(--muted)]/50 px-5 py-2 text-[11px] text-[var(--muted-foreground)]">
                {tone} · {channel} · {audience} — {p.note}
              </div>
            </div>
          ))}
        </div>

        {/* Scores */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("loc.score.localization"), v: displayed.scores.localization },
            { label: t("loc.score.seo"), v: displayed.scores.seo },
            { label: t("loc.score.native"), v: displayed.scores.native },
            { label: t("loc.score.platformMatch"), v: displayed.scores.platformMatch },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)]"
            >
              <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {s.v ?? "—"}
                {s.v != null ? (
                  <span className="text-sm font-normal text-[var(--muted-foreground)]"> /100</span>
                ) : null}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--muted)]/60">
                <div
                  className="h-full rounded-full bg-[var(--primary)]"
                  style={{ width: `${s.v ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Insights + Compliance */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title={t("loc.insights.title")}
            icon={<Sparkles className="h-4 w-4 text-[var(--primary)]" />}
          >
            {Object.keys(displayed.insights).length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">{t("loc.insights.empty")}</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {displayed.insights.reasoning ? (
                  <Li label={t("loc.insights.reasoning")}>{displayed.insights.reasoning}</Li>
                ) : null}
                {displayed.insights.consumer ? (
                  <Li label={t("loc.insights.consumer")}>{displayed.insights.consumer}</Li>
                ) : null}
                {displayed.insights.seo ? (
                  <Li label={t("loc.insights.seo")}>
                    {displayed.insights.seo.map((k) => (
                      <span
                        key={k}
                        className="mr-1 inline-flex items-center rounded-md bg-[var(--muted)]/60 px-1.5 py-0.5"
                      >
                        {k}
                      </span>
                    ))}
                  </Li>
                ) : null}
                {displayed.insights.platform ? (
                  <Li label={t("loc.insights.platform")}>{displayed.insights.platform}</Li>
                ) : null}
                {displayed.insights.cultural ? (
                  <Li label={t("loc.insights.cultural")}>{displayed.insights.cultural}</Li>
                ) : null}
              </ul>
            )}
          </Panel>
          <Panel
            title={t("loc.compliance.title")}
            icon={<ShieldCheck className="h-4 w-4 text-[var(--primary)]" />}
          >
            {Object.keys(displayed.compliance).length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">{t("loc.compliance.empty")}</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {displayed.compliance.advertising ? (
                  <Li label={t("loc.compliance.advertising")}>
                    {displayed.compliance.advertising}
                  </Li>
                ) : null}
                {displayed.compliance.sensitive ? (
                  <Li label={t("loc.compliance.sensitive")}>{displayed.compliance.sensitive}</Li>
                ) : null}
                {displayed.compliance.risk ? (
                  <Li label={t("loc.compliance.risk")}>
                    <span className="rounded-full bg-[oklch(0.95_0.05_150)] px-2 py-0.5 font-medium text-[oklch(0.45_0.14_150)]">
                      {displayed.compliance.risk}
                    </span>
                  </Li>
                ) : null}
                {displayed.compliance.regulation ? (
                  <Li label={t("loc.compliance.regulation")}>{displayed.compliance.regulation}</Li>
                ) : null}
              </ul>
            )}
          </Panel>
        </div>

        {/* Compare panel */}
        {compareJob ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-[var(--primary)]" />
                <h3 className="text-sm font-semibold">{t("loc.compare.title")}</h3>
              </div>
              <button
                onClick={() => setCompareJob(null)}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                {t("common.close")}
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <CompareCol
                title={t("loc.compare.current", {
                  v: selectedJob
                    ? new Date(selectedJob.created_at).toLocaleString()
                    : t("loc.compare.live"),
                })}
                items={displayed.items}
                emptyLabel={t("loc.compare.empty")}
              />
              <CompareCol
                title={t("loc.compare.previous", {
                  v: new Date(compareJob.created_at).toLocaleString(),
                })}
                items={((compareJob.output_data ?? {}) as { items?: LocItem[] }).items ?? []}
                emptyLabel={t("loc.compare.empty")}
              />
            </div>
          </div>
        ) : null}

        {/* History + Export */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)] lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HistoryIcon className="h-4 w-4 text-[var(--primary)]" />
                <h3 className="text-sm font-semibold">{t("loc.history.title")}</h3>
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
                {history.length}
              </span>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">{t("loc.history.empty")}</p>
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
                        {String((j.input as { channel?: string })?.channel ?? "—")} ·{" "}
                        {String((j.input as { tone?: string })?.tone ?? "—")} ·{" "}
                        {String((j.input as { audience?: string })?.audience ?? "—")} ·{" "}
                        {t(`ai.status.${j.status}`)}
                      </p>
                    </button>
                    <button
                      onClick={() => onCompare(j.id)}
                      title={t("common.compare")}
                      className="rounded-md border border-[var(--border)] p-1.5 hover:bg-[var(--muted)]/60"
                    >
                      <GitCompare className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onRestore(j.id)}
                      title={t("common.restore")}
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
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center gap-2">
              <FileDown className="h-4 w-4 text-[var(--primary)]" />
              <h3 className="text-sm font-semibold">{t("loc.export.title")}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ExportBtn icon={<Copy className="h-3 w-3" />} onClick={onCopy}>
                {t("loc.export.copy")}
              </ExportBtn>
              <ExportBtn icon={<FileDown className="h-3 w-3" />} onClick={onExportMd}>
                {t("loc.export.markdown")}
              </ExportBtn>
              <ExportBtn icon={<FileDown className="h-3 w-3" />} onClick={onExportPdf}>
                {t("loc.export.pdf")}
              </ExportBtn>
              <ExportBtn icon={<Save className="h-3 w-3" />} onClick={onSaveVersion}>
                {t("loc.export.saveVersion")}
              </ExportBtn>
            </div>
          </div>
        </div>
      </div>
      <WorkflowFooter current="localization" />
    </div>
  );
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-32 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Li({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li>
      <span className="mr-2 font-medium text-[var(--foreground)]">{label}:</span>
      <span className="text-[var(--foreground)]/85">{children}</span>
    </li>
  );
}

function ExportBtn({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-2 text-xs font-medium hover:bg-[var(--muted)]/60"
    >
      {icon}
      {children}
    </button>
  );
}

function CompareCol({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: LocItem[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--muted-foreground)]">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {items.map((it, i) => (
            <li key={i}>
              <p className="text-[var(--muted-foreground)]">{it.note}</p>
              <p>{it.target}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptySource({
  source,
}: {
  source: { brand: string; description: string; productCopy: string };
}) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        {t("loc.empty.heading")}
      </p>
      <div className="space-y-2 text-sm">
        {source.brand ? (
          <p>
            <span className="font-medium">{t("loc.empty.brand")}</span> {source.brand}
          </p>
        ) : null}
        {source.description ? (
          <p>
            <span className="font-medium">{t("loc.empty.description")}</span> {source.description}
          </p>
        ) : null}
        {source.productCopy && source.productCopy !== source.description ? (
          <p>
            <span className="font-medium">{t("loc.empty.marketingCopy")}</span> {source.productCopy}
          </p>
        ) : null}
        {!source.brand && !source.description ? (
          <p className="text-[var(--muted-foreground)]">{t("loc.empty.none")}</p>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-[var(--muted-foreground)]">{t("loc.empty.hint")}</p>
    </div>
  );
}
