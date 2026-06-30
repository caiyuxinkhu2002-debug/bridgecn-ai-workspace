import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Circle, Pencil, Trash2, Loader2, Copy, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { stageLabelKey, stageOrder, stageToPath, type Stage } from "@/lib/workflow";

export const Route = createFileRoute("/_app/projects/$projectId")({
  head: () => ({ meta: [{ title: "Project — BridgeCN AI" }] }),
  component: ProjectDetailPage,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{label}</span>
      {children}
    </label>
  );
}

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const { t } = useI18n();
  const router = useRouter();
  const { allProjects, setActiveProjectId, activeProjectId, updateProject, deleteProject, duplicateProject, archiveProject, unarchiveProject } = useWorkspace();
  const project = allProjects.find((p) => p.id === projectId);

  useEffect(() => {
    if (project && project.id !== activeProjectId) setActiveProjectId(project.id);
  }, [project, activeProjectId, setActiveProjectId]);

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ name: "", industry: "", targetMarket: "", description: "", stage: "research" as Stage });
  useEffect(() => {
    if (project) setDraft({
      name: project.name,
      industry: project.industry === "—" ? "" : project.industry,
      targetMarket: project.targetMarket || (project.region === "—" ? "" : project.region),
      description: project.description || project.summary || "",
      stage: project.stage,
    });
  }, [project?.id]);

  if (!project) {
    throw notFound();
  }

  async function save() {
    setBusy(true);
    try {
      await updateProject(project!.id, draft);
      toast.success("Project updated");
      setEditing(false);
    } catch (e) { console.error(e); toast.error("Could not save project"); }
    finally { setBusy(false); }
  }

  async function onDelete() {
    if (!confirm(`Delete "${project!.name}"? This can be restored from the database.`)) return;
    setBusy(true);
    try {
      await deleteProject(project!.id);
      toast.success("Project deleted");
      router.navigate({ to: "/projects" });
    } catch (e) { console.error(e); toast.error("Could not delete"); }
    finally { setBusy(false); }
  }

  async function onDuplicate() {
    setBusy(true);
    try {
      const dup = await duplicateProject(project!.id);
      if (dup) {
        toast.success("Project duplicated");
        setActiveProjectId(dup.id);
        router.navigate({ to: "/projects/$projectId", params: { projectId: dup.id } });
      }
    } catch { toast.error("Could not duplicate"); }
    finally { setBusy(false); }
  }

  async function onArchive() {
    setBusy(true);
    try {
      if (project!.archived) { await unarchiveProject(project!.id); toast.success("Project restored"); }
      else { await archiveProject(project!.id); toast.success("Project archived"); }
    } catch { toast.error("Could not archive"); }
    finally { setBusy(false); }
  }

  const currentIdx = stageOrder.indexOf(project.stage);

  return (
    <div>
      <Link to="/projects" className="mb-4 inline-block text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        ← {t("projects.title")}
      </Link>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader title={project.name} description={project.summary || project.description} />
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setEditing((v) => !v)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 text-xs font-medium hover:bg-[var(--muted)]"
          >
            <Pencil className="h-3.5 w-3.5" />
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={onDuplicate}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 text-xs font-medium hover:bg-[var(--muted)] disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </button>
          <button
            onClick={onArchive}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 text-xs font-medium hover:bg-[var(--muted)] disabled:opacity-50"
          >
            {project.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            {project.archived ? "Restore" : "Archive"}
          </button>
          <button
            onClick={onDelete}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
          <h3 className="mb-4 text-sm font-semibold">Edit project</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand name">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
            </Field>
            <Field label="Industry">
              <input value={draft.industry} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
            </Field>
            <Field label="Target market">
              <input value={draft.targetMarket} onChange={(e) => setDraft({ ...draft, targetMarket: e.target.value })} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
            </Field>
            <Field label="Status">
              <select value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value as Stage })} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm">
                {stageOrder.map((s) => <option key={s} value={s}>{t(stageLabelKey[s])}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-2 text-sm" />
              </Field>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]">Cancel</button>
            <button onClick={save} disabled={busy || !draft.name.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50">
              {busy && <Loader2 className="h-3 w-3 animate-spin" />} Save
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
            <h3 className="mb-4 text-sm font-semibold">{t("pd.timeline")}</h3>
            <ol className="space-y-3">
              {stageOrder.map((s, idx) => {
                const done = idx < currentIdx;
                const active = idx === currentIdx;
                return (
                  <li key={s} className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
                    ) : active ? (
                      <div className="h-4 w-4 rounded-full bg-[var(--primary)] ring-4 ring-[var(--primary-soft)]" />
                    ) : (
                      <Circle className="h-4 w-4 text-[var(--muted-foreground)]" />
                    )}
                    <button
                      onClick={() => router.navigate({ to: stageToPath[s] })}
                      className={`flex flex-1 items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-[var(--muted)] ${active ? "font-medium" : "text-[var(--muted-foreground)]"}`}
                    >
                      <span>{t(stageLabelKey[s])}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
            <h3 className="mb-3 text-sm font-semibold">{t("pd.summary")}</h3>
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{project.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
              <span className="rounded-full bg-[var(--muted)] px-2 py-0.5">{project.industry}</span>
              <span className="rounded-full bg-[var(--muted)] px-2 py-0.5">{project.region}</span>
              <span className="rounded-full bg-[var(--muted)] px-2 py-0.5">{project.owner}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
            <h3 className="mb-4 text-sm font-semibold">{t("pd.kpis")}</h3>
            <dl className="space-y-3">
              {project.kpi.map((k) => (
                <div key={k.label} className="flex items-center justify-between">
                  <dt className="text-xs text-[var(--muted-foreground)]">{k.label}</dt>
                  <dd className="text-sm font-semibold tabular-nums">{k.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <button
            onClick={() => router.navigate({ to: stageToPath[project.stage] })}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--background)] hover:opacity-90"
          >
            {t("dash.resume")} {t(stageLabelKey[project.stage])}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}