import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { ProjectContextBar } from "@/components/project-context-bar";
import { WorkflowFooter } from "@/components/workflow-footer";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { Download, Share2, FileText, Search } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — BridgeCN AI" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { reports, setActiveProjectId, activeProject } = useWorkspace();
  const [q, setQ] = useState("");
  const scopedRaw = activeProject?.id ? reports.filter((r) => r.projectId === activeProject.id) : [];
  // Fall back to all reports when the active project has no demo reports linked.
  const scoped = scopedRaw.length > 0 ? scopedRaw : reports;
  const filtered = scoped.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <ProjectContextBar />
      <PageHeader title={t("reports.title")} description={t("reports.sub")} />
      <div className="mb-5 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("reports.search")} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />
        </div>
        <button className="h-9 rounded-md border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--muted)]">{t("reports.allTypes")}</button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
        <ul className="divide-y divide-[var(--border)]">
          {filtered.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">{t("common.noResults")}</li>
          ) : filtered.map((r) => (
            <li key={r.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--muted)]/60">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--muted)]"><FileText className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <button onClick={() => { setActiveProjectId(r.projectId); router.navigate({ to: "/report" }); }} className="block w-full truncate text-left text-sm font-medium hover:underline">{r.title}</button>
                <p className="truncate text-xs text-[var(--muted-foreground)]">{r.type} · {r.date}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${r.status === "Ready" ? "bg-[oklch(0.96_0.04_150)] text-[oklch(0.42_0.12_150)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{r.status === "Ready" ? t("reports.status.ready") : t("reports.status.draft")}</span>
              <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--background)]" aria-label={t("common.share")}><Share2 className="h-3.5 w-3.5" /></button>
              <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--background)]" aria-label={t("common.download")}><Download className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      </div>
      <WorkflowFooter current="reports" />
      <div className="sr-only"><Link to="/report">report</Link></div>
    </div>
  );
}