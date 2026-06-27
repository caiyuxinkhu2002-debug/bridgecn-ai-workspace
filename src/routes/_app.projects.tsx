import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { MoreHorizontal, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/projects")({
  head: () => ({ meta: [{ title: "Projects — BridgeCN AI" }] }),
  component: ProjectsPage,
});

const projects = [
  { name: "Beauty of Joseon", workspace: "China Expansion", status: "In progress", owner: "Sora Kim", updated: "2h ago", initials: "BJ" },
  { name: "ANUA", workspace: "Xiaohongshu Strategy", status: "Drafting", owner: "Jihoon Park", updated: "Yesterday", initials: "AN" },
  { name: "Medicube", workspace: "China Market Research", status: "Reviewing", owner: "Minji Lee", updated: "3 days ago", initials: "MC" },
  { name: "Round Lab", workspace: "Tmall Launch", status: "Planning", owner: "Sora Kim", updated: "1 week ago", initials: "RL" },
  { name: "Torriden", workspace: "Douyin Campaign", status: "In progress", owner: "Jihoon Park", updated: "2 weeks ago", initials: "TR" },
];

function ProjectsPage() {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <PageHeader title="Projects" description="All workspaces for your China market expansion." />
        <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90">
          <Plus className="h-3.5 w-3.5" />
          New project
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_auto] gap-4 border-b border-[var(--border)] bg-[var(--muted)] px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
          <div>Project</div>
          <div className="hidden md:block">Status</div>
          <div className="hidden md:block">Owner</div>
          <div className="hidden md:block">Updated</div>
          <div />
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {projects.map((p) => (
            <li key={p.name} className="grid grid-cols-[1.6fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--muted)]/60">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">
                  {p.initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="truncate text-xs text-[var(--muted-foreground)]">{p.workspace}</div>
                </div>
              </div>
              <div className="hidden md:block">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                  {p.status}
                </span>
              </div>
              <div className="hidden md:block text-sm text-[var(--muted-foreground)]">{p.owner}</div>
              <div className="hidden md:block text-xs text-[var(--muted-foreground)]">{p.updated}</div>
              <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--muted)]">
                <MoreHorizontal className="h-4 w-4 text-[var(--muted-foreground)]" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}