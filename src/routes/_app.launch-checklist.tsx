import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { DataIntegrityBanner } from "@/components/data-integrity-banner";
import { ProjectContextBar } from "@/components/project-context-bar";
import { WorkflowFooter } from "@/components/workflow-footer";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Circle, CheckCircle2, Loader2, Sparkles, Play } from "lucide-react";
import { listChecklist, seedChecklist, toggleChecklistItem, type ChecklistItem } from "@/lib/checklist.functions";
import { useAIJob } from "@/lib/ai/use-ai-job";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/launch-checklist")({
  head: () => ({ meta: [{ title: "Launch Checklist — BridgeCN AI" }] }),
  component: LaunchChecklistPage,
});

// Sprint 9: generic templated phases, no brand-specific items. Once the
// AI engine wires checklist generation, items will come from the active
// project's AI jobs and Knowledge Base.
// i18n-only template — every label is a translation key.
// Fallback template — only used if AI generation hasn't run yet AND the
// project still has no persisted checklist rows. Real items are generated
// by Lovable AI tailored to the project's category and target market.
const FALLBACK_PHASES = [
  { key: "research", name: "launch.phase.research", items: [
    { key: "launch.item.sizing", label: "Validate market sizing for the target market" },
    { key: "launch.item.competitors", label: "Audit top competitors and whitespace" },
    { key: "launch.item.personas", label: "Confirm target personas" },
  ]},
  { key: "localization", name: "launch.phase.localization", items: [
    { key: "launch.item.names", label: "Localize product / brand names" },
    { key: "launch.item.pdp", label: "Translate product detail pages" },
    { key: "launch.item.regulatory", label: "Pass regulatory / labeling review" },
    { key: "launch.item.landing", label: "Build localized landing page" },
  ]},
  { key: "launch", name: "launch.phase.launch", items: [
    { key: "launch.item.seeding", label: "KOC / influencer seeding" },
    { key: "launch.item.flagship", label: "Open flagship store on primary channel" },
    { key: "launch.item.live", label: "Go live with launch campaign" },
    { key: "launch.item.review", label: "30-day post-launch review" },
  ]},
];

const PHASE_NAME_KEY: Record<string, string> = {
  research: "launch.phase.research",
  localization: "launch.phase.localization",
  launch: "launch.phase.launch",
};

function LaunchChecklistPage() {
  const { t } = useI18n();
  const { activeProject } = useWorkspace();
  const hasProject = Boolean(activeProject?.id);
  const ai = useAIJob();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const refresh = useCallback(async () => {
    if (!activeProject?.id) { setItems([]); return; }
    setLoading(true);
    try {
      const rows = await listChecklist({ data: { projectId: activeProject.id } });
      setItems(rows);
      if (rows.length === 0) {
        // First time on this project: seed from the fallback template so the
        // user sees something usable immediately. Generate AI version on demand.
        setSeeding(true);
        await seedChecklist({ data: { projectId: activeProject.id, phases: FALLBACK_PHASES } });
        const seeded = await listChecklist({ data: { projectId: activeProject.id } });
        setItems(seeded);
        setSeeding(false);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const onToggle = useCallback(async (item: ChecklistItem) => {
    const next = !item.checked;
    // optimistic
    setItems((list) => list.map((x) => x.id === item.id ? { ...x, checked: next } : x));
    try {
      await toggleChecklistItem({ data: { id: item.id, checked: next } });
    } catch (e) {
      setItems((list) => list.map((x) => x.id === item.id ? { ...x, checked: item.checked } : x));
      toast.error((e as Error).message);
    }
  }, []);

  const onGenerate = useCallback(async () => {
    if (!activeProject?.id) return;
    await ai.run({ module: "launch", prompt: `Generate launch checklist for ${activeProject.name}` });
  }, [ai, activeProject?.id, activeProject?.name]);

  // When AI returns phases, persist them as new checklist items.
  useEffect(() => {
    async function syncFromAI() {
      if (ai.status !== "completed" || !activeProject?.id) return;
      const phases = (ai.data?.phases as { key: string; name: string; items: { key: string; label: string }[] }[] | undefined);
      if (!phases || phases.length === 0) return;
      try {
        await seedChecklist({ data: { projectId: activeProject.id, phases } });
        await refresh();
        toast.success(t("launch.toast.generated") || "Checklist generated");
      } catch (e) { toast.error((e as Error).message); }
    }
    syncFromAI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai.status]);

  const phases = useMemo(() => {
    const grouped = new Map<string, ChecklistItem[]>();
    for (const it of items) {
      const arr = grouped.get(it.phase_key) ?? [];
      arr.push(it);
      grouped.set(it.phase_key, arr);
    }
    return Array.from(grouped.entries()).map(([key, list]) => ({
      key,
      name: list[0]?.phase_key ?? key,
      items: list,
      done: list.filter((x) => x.checked).length,
      total: list.length,
    }));
  }, [items]);

  return (
    <div>
      <ProjectContextBar />
      <PageHeader title={t("launch.title")} description={t("launch.sub")} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
          <span>{ai.isRunning ? t("common.generating") : `${items.filter((x) => x.checked).length} / ${items.length} complete`}</span>
        </div>
        <button
          onClick={onGenerate}
          disabled={ai.isRunning || !hasProject}
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-soft)] hover:opacity-90 disabled:opacity-50"
        >
          {ai.isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {ai.isRunning ? t("common.generating") : t("launch.action.generate")}
        </button>
      </div>
      {!hasProject ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-10 text-center text-sm text-[var(--muted-foreground)]">
          {t("common.empty")}
        </div>
      ) : loading || seeding ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-10 text-center text-xs text-[var(--muted-foreground)]">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <div className="space-y-6">
          {phases.map((p) => {
            const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
            return (
              <div key={p.key} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
                  <div>
                    <h3 className="text-sm font-semibold capitalize">{t(PHASE_NAME_KEY[p.key] ?? p.name)}</h3>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{p.done} / {p.total} {t("launch.complete")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} /></div>
                    <span className="text-xs tabular-nums text-[var(--muted-foreground)]">{pct}%</span>
                  </div>
                </div>
                <ul className="divide-y divide-[var(--border)]">
                  {p.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 px-6 py-3">
                      <button onClick={() => onToggle(it)} aria-label="toggle" className="text-[var(--muted-foreground)] hover:text-[var(--primary)]">
                        {it.checked
                          ? <CheckCircle2 className="h-5 w-5 text-[var(--primary)]" />
                          : <Circle className="h-5 w-5" />}
                      </button>
                      <span className={`flex-1 text-sm ${it.checked ? "text-[var(--muted-foreground)] line-through" : ""}`}>{translateItem(it.item_key, it.label, t)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      <WorkflowFooter current="launch" />
    </div>
  );
}

// Try to render a translated label by item_key; fall back to the persisted
// label (which is what the AI generated or what was previously seeded).
function translateItem(key: string, fallback: string, t: (k: string) => string): string {
  if (!key) return fallback;
  const translated = t(key);
  return translated && translated !== key ? translated : fallback;
}
