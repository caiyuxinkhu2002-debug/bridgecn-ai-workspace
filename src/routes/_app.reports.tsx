import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { ProjectContextBar } from "@/components/project-context-bar";
import { WorkflowFooter } from "@/components/workflow-footer";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { Download, Share2, FileText, Search, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listReports, deleteReport, generateReportNow, type ReportRow } from "@/lib/reports.functions";
import { buildProjectContext } from "@/lib/ai/project-context";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — BridgeCN AI" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { activeProject, activeWorkspace } = useWorkspace();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const refresh = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    setLoading(true);
    try {
      const list = await listReports({ data: { workspaceId: activeWorkspace.id, projectId: activeProject?.id || null } });
      setRows(list);
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }, [activeWorkspace?.id, activeProject?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = rows.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));

  const onGenerate = useCallback(async () => {
    if (!activeWorkspace?.id || !activeProject?.id) {
      toast.error(t("reports.toast.noProject"));
      return;
    }
    setGenerating(true);
    try {
      const ctx = buildProjectContext(activeProject);
      const row = await generateReportNow({ data: { workspaceId: activeWorkspace.id, projectId: activeProject.id, projectContext: ctx, uiLocale: locale } });
      toast.success(t("reports.toast.generated"));
      await refresh();
      router.navigate({ to: "/report", search: { reportId: row.id } as never });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setGenerating(false); }
  }, [activeWorkspace?.id, activeProject, refresh, router, t, locale]);

  const onDelete = useCallback(async (id: string) => {
    try { await deleteReport({ data: { id } }); await refresh(); toast.success(t("reports.toast.deleted")); }
    catch (e) { toast.error((e as Error).message); }
  }, [refresh, t]);

  async function onShare(id: string, title: string) {
    const url = `${window.location.origin}/report?reportId=${encodeURIComponent(id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch { /* fallthrough to clipboard */ }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("common.linkCopied"));
    } catch {
      toast.error(t("common.shareFailed"));
    }
  }
  function onDownload(id: string) {
    router.navigate({ to: "/report", search: { reportId: id, print: 1 } as never });
  }
  return (
    <div>
      <ProjectContextBar />
      <PageHeader title={t("reports.title")} description={t("reports.sub")} />
      <div className="mb-5 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("reports.search")} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />
        </div>
        <button
          onClick={onGenerate}
          disabled={generating || !activeProject?.id}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 text-xs font-medium text-white shadow-[var(--shadow-soft)] hover:opacity-90 disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {generating ? t("common.generating") : t("reports.action.generate")}
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
        <ul className="divide-y divide-[var(--border)]">
          {loading ? (
            <li className="px-5 py-10 text-center text-xs text-[var(--muted-foreground)]"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></li>
          ) : filtered.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">{t("common.noResults")}</li>
          ) : filtered.map((r) => (
            <li key={r.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--muted)]/60">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--muted)]"><FileText className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <button onClick={() => router.navigate({ to: "/report", search: { reportId: r.id } as never })} className="block w-full truncate text-left text-sm font-medium hover:underline">{r.title}</button>
                <p className="truncate text-xs text-[var(--muted-foreground)]">{r.type} · {new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${r.status === "Ready" ? "bg-[oklch(0.96_0.04_150)] text-[oklch(0.42_0.12_150)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{r.status === "Ready" ? t("reports.status.ready") : t("reports.status.draft")}</span>
              <button onClick={() => onShare(r.id, r.title)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--background)]" aria-label={t("common.share")}><Share2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => onDownload(r.id)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--background)]" aria-label={t("common.download")}><Download className="h-3.5 w-3.5" /></button>
              <button onClick={() => onDelete(r.id)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--background)]" aria-label="delete"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      </div>
      <WorkflowFooter current="reports" />
      <div className="sr-only"><Link to="/report">report</Link></div>
    </div>
  );
}