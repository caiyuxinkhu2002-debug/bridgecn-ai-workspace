import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ProjectContextBar } from "@/components/project-context-bar";
import { WorkflowFooter } from "@/components/workflow-footer";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { Circle } from "lucide-react";

export const Route = createFileRoute("/_app/launch-checklist")({
  head: () => ({ meta: [{ title: "Launch Checklist — BridgeCN AI" }] }),
  component: LaunchChecklistPage,
});

// Sprint 9: generic templated phases, no brand-specific items. Once the
// AI engine wires checklist generation, items will come from the active
// project's AI jobs and Knowledge Base.
// i18n-only template — every label is a translation key.
const TEMPLATE_PHASES: { nameKey: string; itemKeys: string[] }[] = [
  { nameKey: "launch.phase.research", itemKeys: ["launch.item.sizing", "launch.item.competitors", "launch.item.personas"] },
  { nameKey: "launch.phase.localization", itemKeys: ["launch.item.names", "launch.item.pdp", "launch.item.regulatory", "launch.item.landing"] },
  { nameKey: "launch.phase.launch", itemKeys: ["launch.item.seeding", "launch.item.flagship", "launch.item.live", "launch.item.review"] },
];

function LaunchChecklistPage() {
  const { t } = useI18n();
  const { activeProject } = useWorkspace();
  const hasProject = Boolean(activeProject?.id);

  return (
    <div>
      <ProjectContextBar />
      <PageHeader title={t("launch.title")} description={t("launch.sub")} />
      {!hasProject ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-10 text-center text-sm text-[var(--muted-foreground)]">
          {t("common.empty")}
        </div>
      ) : (
        <div className="space-y-6">
          {TEMPLATE_PHASES.map((p) => (
            <div key={p.nameKey} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
                <div>
                  <h3 className="text-sm font-semibold">{t(p.nameKey)}</h3>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">0 / {p.itemKeys.length} {t("launch.complete")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-40 overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `0%` }} /></div>
                  <span className="text-xs tabular-nums text-[var(--muted-foreground)]">0%</span>
                </div>
              </div>
              <ul className="divide-y divide-[var(--border)]">
                {p.itemKeys.map((itemKey) => (
                  <li key={itemKey} className="flex items-center gap-3 px-6 py-3">
                    <Circle className="h-5 w-5 text-[var(--muted-foreground)]" />
                    <span className="flex-1 text-sm">{t(itemKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <WorkflowFooter current="launch" />
    </div>
  );
}

// Reference Check to silence unused-import lint when items become done.
