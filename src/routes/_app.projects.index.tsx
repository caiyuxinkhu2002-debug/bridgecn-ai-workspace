import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Plus, ChevronRight, Copy, Archive, Trash2, ArchiveRestore } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { stageLabelKey } from "@/lib/workflow";

export const Route = createFileRoute("/_app/projects")({
  head: () => ({ meta: [{ title: "Projects — BridgeCN AI" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { projects, archivedProjects, setActiveProjectId, activeProjectId, duplicateProject, archiveProject, unarchiveProject, deleteProject } = useWorkspace();
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [busyId, setBusyId] = useState<string | null>(null);
  const list = tab === "active" ? projects : archivedProjects;

  async function onDuplicate(id: string) {
    setBusyId(id);
    try {
      const p = await duplicateProject(id);
      if (p) toast.success("Project duplicated");
    } catch { toast.error("Could not duplicate"); }
    finally { setBusyId(null); }
  }
  async function onArchive(id: string) {
    setBusyId(id);
    try { await archiveProject(id); toast.success("Project archived"); }
    catch { toast.error("Could not archive"); }
    finally { setBusyId(null); }
  }
  async function onUnarchive(id: string) {
    setBusyId(id);
    try { await unarchiveProject(id); toast.success("Project restored"); }
    catch { toast.error("Could not restore"); }
    finally { setBusyId(null); }
  }
  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    setBusyId(id);
    try { await deleteProject(id); toast.success("Project deleted"); }
    catch { toast.error("Could not delete"); }
    finally { setBusyId(null); }
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <PageHeader title={t("projects.title")} description={t("projects.sub")} />
        <Link
          to="/start"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("projects.new")}
        </Link>
      </div>

      <div className="mb-4 inline-flex rounded-md border border-[var(--border)] bg-[var(--background)] p-0.5 text-xs">
        <button onClick={() => setTab("active")} className={`rounded px-3 py-1.5 font-medium ${tab === "active" ? "bg-[var(--muted)] text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>Active ({projects.length})</button>
        <button onClick={() => setTab("archived")} className={`rounded px-3 py-1.5 font-medium ${tab === "archived" ? "bg-[var(--muted)] text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>Archived ({archivedProjects.length})</button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_auto] gap-4 border-b border-[var(--border)] bg-[var(--muted)] px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
          <div>{t("projects.col.project")}</div>
          <div className="hidden md:block">{t("projects.col.stage")}</div>
          <div className="hidden md:block">{t("projects.col.owner")}</div>
          <div className="hidden md:block">{t("projects.col.updated")}</div>
          <div />
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {list.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">{tab === "active" ? "No projects yet." : "No archived projects."}</li>
          )}
          {list.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-[1.6fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--muted)]/60"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">
                  {p.initials}
                </div>
                <div className="min-w-0">
                  <button
                    onClick={() => {
                      setActiveProjectId(p.id);
                      router.navigate({ to: "/projects/$projectId", params: { projectId: p.id } });
                    }}
                    className="truncate text-left text-sm font-medium hover:underline"
                  >
                    {p.name}
                  </button>
                  <div className="truncate text-xs text-[var(--muted-foreground)]">{p.industry} · {p.region}</div>
                </div>
                {p.id === activeProjectId && (
                  <span className="ml-1 rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary-foreground)]">
                    Active
                  </span>
                )}
              </div>
              <div className="hidden md:block">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                  {t(stageLabelKey[p.stage])}
                </span>
              </div>
              <div className="hidden md:block text-sm text-[var(--muted-foreground)]">{p.owner}</div>
              <div className="hidden md:block text-xs text-[var(--muted-foreground)]">{p.updated}</div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => onDuplicate(p.id)} disabled={busyId === p.id} title="Duplicate" className="grid h-8 w-8 place-items-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-50"><Copy className="h-3.5 w-3.5" /></button>
                {tab === "active" ? (
                  <button onClick={() => onArchive(p.id)} disabled={busyId === p.id} title="Archive" className="grid h-8 w-8 place-items-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-50"><Archive className="h-3.5 w-3.5" /></button>
                ) : (
                  <button onClick={() => onUnarchive(p.id)} disabled={busyId === p.id} title="Restore" className="grid h-8 w-8 place-items-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-50"><ArchiveRestore className="h-3.5 w-3.5" /></button>
                )}
                <button onClick={() => onDelete(p.id, p.name)} disabled={busyId === p.id} title="Delete" className="grid h-8 w-8 place-items-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-red-600 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  onClick={() => setActiveProjectId(p.id)}
                  className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--muted)]"
                >
                  <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}