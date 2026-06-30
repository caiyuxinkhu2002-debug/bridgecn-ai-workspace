import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Download,
  Share2,
  FileText,
  Calendar,
  MapPin,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { ProjectContextBar } from "@/components/project-context-bar";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { listJobs } from "@/lib/ai/service";
import type { AIJob } from "@/lib/ai/types";
import { getReport, type ReportRow } from "@/lib/reports.functions";
import { generateReportNow } from "@/lib/reports.functions";
import { buildProjectContext } from "@/lib/ai/project-context";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/report")({
  head: () => ({
    meta: [
      { title: "Report — BridgeCN AI" },
      {
        name: "description",
        content:
          "AI-generated China market entry reports for your active project, built from the Project Knowledge Base.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    reportId: typeof s.reportId === "string" ? s.reportId : undefined,
    print: s.print === 1 || s.print === "1",
  }),
  component: ReportPage,
});

function ReportPage() {
  const { t } = useI18n();
  const { activeProject, activeWorkspace } = useWorkspace();
  const { print, reportId } = Route.useSearch();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const onGenerate = useCallback(async () => {
    if (!activeWorkspace?.id || !activeProject?.id) { toast.error(t("reports.toast.noProject")); return; }
    setGenerating(true);
    try {
      const ctx = buildProjectContext(activeProject);
      const row = await generateReportNow({ data: { workspaceId: activeWorkspace.id, projectId: activeProject.id, projectContext: ctx, uiLocale: locale } });
      toast.success(t("reports.toast.generated"));
      router.navigate({ to: "/report", search: { reportId: row.id } as never });
    } catch (e) { toast.error((e as Error).message); }
    finally { setGenerating(false); }
  }, [activeWorkspace?.id, activeProject, router, t]);
  const kb = activeProject?.knowledgeBase || {};

  // Load either a specific report by id, or fall back to the latest
  // completed Market job for the active project (legacy behaviour).
  const [report, setReport] = useState<ReportRow | null>(null);
  const [job, setJob] = useState<AIJob | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function go() {
      setLoading(true);
      try {
        if (reportId) {
          const r = await getReport({ data: { id: reportId } });
          if (!cancelled) { setReport(r); setJob(null); }
        } else if (activeWorkspace?.id && activeProject?.id) {
          const list = await listJobs({ workspaceId: activeWorkspace.id, projectId: activeProject.id, module: "market", limit: 1 });
          if (cancelled) return;
          setReport(null);
          setJob(list.find((j) => j.status === "completed") || null);
        } else {
          setReport(null); setJob(null);
        }
      } catch (e) { console.error(e); }
      finally { if (!cancelled) setLoading(false); }
    }
    go();
    return () => { cancelled = true; };
  }, [activeWorkspace?.id, activeProject?.id, reportId]);

  type ReportData = {
    summary?: string;
    confidence?: number;
    kpis?: { label: string; value: string; sub?: string }[];
    sources?: string[];
    keywords?: { k: string; growth: string; platform: string; score: number }[];
    regions?: { name: string; v: number; growth: string }[];
    title?: string;
    executiveSummary?: string;
    marketSection?: string;
    consumerSection?: string;
    localizationSection?: string;
    launchPlan?: string;
    risks?: string[];
    recommendations?: string[];
  };
  const data: ReportData = report
    ? (report.payload as unknown as ReportData)
    : ((job?.output_data ?? {}) as ReportData);
  if (report && !data.summary && data.executiveSummary) data.summary = data.executiveSummary;
  const hasReport = Boolean(report || (job && (data.summary || (data.kpis?.length ?? 0) > 0)));
  const dateStr = report?.created_at || job?.completed_at || null;
  const titleStr = report?.title || (activeProject?.name ? `${activeProject.name} · ${t("reports.title")}` : t("reports.title"));

  const onShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: activeProject?.name || "Report", url }); return; }
    } catch { /* fallthrough */ }
    try { await navigator.clipboard.writeText(url); toast.success(t("common.linkCopied")); }
    catch { toast.error(t("common.shareFailed")); }
  }, [activeProject?.name, t]);

  const onExport = useCallback(() => { window.print(); }, []);

  useEffect(() => {
    if (print && hasReport) {
      const id = setTimeout(() => window.print(), 400);
      return () => clearTimeout(id);
    }
  }, [print, hasReport]);

  return (
    <div>
      <ProjectContextBar />
      <PageHeader
        title={activeProject?.name ? `${activeProject.name} · ${t("reports.title")}` : t("reports.title")}
        description={t("reports.sub")}
      />
      <div className="mx-auto max-w-5xl space-y-8 py-2 md:py-6 print:max-w-full print:py-0">
        <header className="border-b border-[var(--border)] pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 font-medium">
              <Sparkles className="h-3 w-3 text-[var(--primary)]" />
              {t("report.generatedBy")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {new Date(dateStr || Date.now()).toLocaleDateString()}
            </span>
            {kb.industry && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  {activeProject?.targetMarket || activeProject?.region || "—"}
                </span>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[var(--muted)] to-[var(--primary-soft)] text-sm font-semibold">
                  {activeProject?.initials || "—"}
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--muted-foreground)]">
                    {activeProject?.name || "—"}
                  </div>
                  <h1 className="text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
                    {titleStr}
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button onClick={onShare} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-3.5 text-xs font-medium hover:bg-[var(--muted)]">
                <Share2 className="h-3.5 w-3.5" />
                {t("common.share")}
              </button>
              <button onClick={onExport} disabled={!hasReport} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--foreground)] px-3.5 text-xs font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50">
                <Download className="h-3.5 w-3.5" />
                {t("common.export")} PDF
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-10 text-center text-xs text-[var(--muted-foreground)]">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--primary)]" />
            <p className="mt-3">{t("common.loading")}</p>
          </div>
        ) : !hasReport ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-10 text-center shadow-[var(--shadow-soft)]">
            <FileText className="mx-auto h-5 w-5 text-[var(--primary)]" />
            <p className="mt-3 text-sm font-medium">
              {t("report.empty.title", { v: activeProject?.name || t("common.thisProject") })}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {t("report.empty.desc")}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {activeProject?.id && (
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: activeProject.id }}
                  className="inline-flex h-9 items-center rounded-md border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--muted)]"
                >
                  {t("report.empty.openKB")}
                </Link>
              )}
              <button
                onClick={onGenerate}
                disabled={generating}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {generating ? t("common.generating") : t("report.action.generateWithAI")}
              </button>
            </div>
          </div>
        ) : (
          <article className="space-y-8 text-sm leading-relaxed">
            {data.summary && (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("report.section.summary")}</h2>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]/90">{data.summary}</p>
                {typeof data.confidence === "number" && (
                  <p className="mt-3 text-xs text-[var(--muted-foreground)]">{t("market.summary.confidence")}: <span className="font-medium text-[var(--foreground)]">{data.confidence}%</span></p>
                )}
              </section>
            )}
            {data.marketSection && (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("report.section.market")}</h2>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]/90">{data.marketSection}</p>
              </section>
            )}
            {data.consumerSection && (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("report.section.consumer")}</h2>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]/90">{data.consumerSection}</p>
              </section>
            )}
            {data.localizationSection && (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("report.section.localization")}</h2>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]/90">{data.localizationSection}</p>
              </section>
            )}
            {data.launchPlan && (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("report.section.launchPlan")}</h2>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]/90">{data.launchPlan}</p>
              </section>
            )}
            {(data.risks?.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("report.section.risks")}</h2>
                <ul className="list-disc space-y-1 pl-5">{data.risks!.map((r) => <li key={r}>{r}</li>)}</ul>
              </section>
            )}
            {(data.recommendations?.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("report.section.recommendations")}</h2>
                <ul className="list-disc space-y-1 pl-5">{data.recommendations!.map((r) => <li key={r}>{r}</li>)}</ul>
              </section>
            )}
            {(data.kpis?.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("report.section.kpis")}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {data.kpis!.map((k) => (
                    <div key={k.label} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                      <p className="text-[11px] text-[var(--muted-foreground)]">{k.label}</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums">{k.value}</p>
                      {k.sub && <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{k.sub}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {(data.regions?.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("report.section.regions")}</h2>
                <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--background)]">
                  {data.regions!.map((r) => (
                    <li key={r.name} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span>{r.name}</span>
                      <span className="text-xs text-[var(--muted-foreground)]"><span className="tabular-nums">{r.v}</span> · {r.growth}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {(data.keywords?.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("report.section.keywords")}</h2>
                <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--background)]">
                  {data.keywords!.map((kw) => (
                    <li key={kw.k} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="font-medium">{kw.k}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{kw.platform} · {kw.growth} · {t("market.kw.score", { v: kw.score })}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {(data.sources?.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("report.section.sources")}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {data.sources!.map((s) => (
                    <span key={s} className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[11px] text-[var(--muted-foreground)]">{s}</span>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
