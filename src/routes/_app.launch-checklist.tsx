import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ProjectContextBar } from "@/components/project-context-bar";
import { WorkflowFooter } from "@/components/workflow-footer";
import { useI18n } from "@/lib/i18n";
import { Check, Circle } from "lucide-react";

export const Route = createFileRoute("/_app/launch-checklist")({
  head: () => ({ meta: [{ title: "Launch Checklist — BridgeCN AI" }] }),
  component: LaunchChecklistPage,
});

const phases = [
  { name: "Phase 1 · Research", progress: 100, items: [
    { done: true, label: "China market sizing report", owner: "AI" },
    { done: true, label: "Top 5 competitor analysis", owner: "AI" },
    { done: true, label: "Consumer persona definition", owner: "Sora" },
  ]},
  { name: "Phase 2 · Localization & Compliance", progress: 60, items: [
    { done: true, label: "Brand name & taglines in 简体中文", owner: "AI" },
    { done: true, label: "Tmall PDP copy (top 3 SKUs)", owner: "Minji" },
    { done: false, label: "NMPA registration package", owner: "Legal" },
    { done: false, label: "China ICP filing for landing page", owner: "Wei" },
  ]},
  { name: "Phase 3 · Launch", progress: 20, items: [
    { done: true, label: "Xiaohongshu seeding plan (50 KOC)", owner: "Jihoon" },
    { done: false, label: "Tmall flagship store opening", owner: "Ops" },
    { done: false, label: "Douyin live commerce kickoff", owner: "Jihoon" },
    { done: false, label: "Q1 performance review", owner: "Sora" },
  ]},
];

function LaunchChecklistPage() {
  const { t } = useI18n();
  return (
    <div>
      <ProjectContextBar />
      <PageHeader title={t("launch.title")} description={t("launch.sub")} />
      <div className="space-y-6">
        {phases.map((p) => (
          <div key={p.name} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
              <div>
                <h3 className="text-sm font-semibold">{p.name}</h3>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{p.items.filter((i) => i.done).length} / {p.items.length} {t("launch.complete")}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${p.progress}%` }} /></div>
                <span className="text-xs tabular-nums text-[var(--muted-foreground)]">{p.progress}%</span>
              </div>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {p.items.map((item) => (
                <li key={item.label} className="flex items-center gap-3 px-6 py-3">
                  {item.done ? (
                    <div className="grid h-5 w-5 place-items-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]"><Check className="h-3 w-3" /></div>
                  ) : (<Circle className="h-5 w-5 text-[var(--muted-foreground)]" />)}
                  <span className={`flex-1 text-sm ${item.done ? "text-[var(--muted-foreground)] line-through" : ""}`}>{item.label}</span>
                  <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">{item.owner}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <WorkflowFooter current="launch" />
    </div>
  );
}