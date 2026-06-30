import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Circle, Pencil, Trash2, Loader2, Copy, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n";
import { useWorkspace, type Project, type KnowledgeBase } from "@/lib/workspace-context";
import { stageLabelKey, stageOrder, stageToPath, type Stage } from "@/lib/workflow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

function KnowledgeBasePanel({ project }: { project: Project }) {
  const { updateProject } = useWorkspace();
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kb, setKb] = useState<KnowledgeBase>(project.knowledgeBase || {});
  useEffect(() => { setKb(project.knowledgeBase || {}); }, [project.id, project.knowledgeBase]);

  const kbAny = (k: keyof KnowledgeBase) => (kb[k] ?? "") as string;

  async function save() {
    setBusy(true);
    try {
      await updateProject(project.id, { knowledgeBase: kb, website: kb.website });
      toast.success(t("pd.toast.kbSaved"));
      setEditing(false);
    } catch { toast.error(t("pd.toast.kbSaveFailed")); } finally { setBusy(false); }
  }

  const set = <K extends keyof KnowledgeBase>(k: K, v: KnowledgeBase[K]) => setKb({ ...kb, [k]: v });

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("kb.title")}</h3>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setKb(project.knowledgeBase || {}); }} className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--muted)]">{t("pd.action.cancel")}</button>
            <button onClick={save} disabled={busy} className="inline-flex items-center gap-1 rounded-md bg-[var(--foreground)] px-2.5 py-1 text-xs font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50">
              {busy && <Loader2 className="h-3 w-3 animate-spin" />} {t("pd.action.save")}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--muted)]">{t("pd.action.edit")}</button>
        )}
      </div>

      {!editing ? (
        <dl className="space-y-3 text-sm">
          <KV label={t("kb.field.company")} value={kb.company} />
          <KV label={t("kb.field.industry")} value={kb.industry} />
          <KV label={t("kb.field.category")} value={kb.category} />
          <KVList label={t("kb.field.products")} items={kb.products} />
          <KV label={t("kb.field.brandStory")} value={kb.brandStory} multiline />
          <KVList label={t("kb.field.brandTone")} items={kb.brandTone} />
          <KVList label={t("kb.field.keywords")} items={kb.keywords} />
          <KVList label={t("kb.field.competitors")} items={kb.competitors} />
          <KV label={t("kb.field.targetAudience")} value={kb.targetAudience} multiline />
          <KV label={t("kb.field.koreanCopy")} value={kb.koreanCopy} multiline />
          <KV label={t("kb.field.website")} value={kb.website} />
          {kb.socialChannels && kb.socialChannels.length > 0 && (
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{t("kb.field.socialChannels")}</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {kb.socialChannels.map((c, i) => (
                  <a key={i} href={c.url} target="_blank" rel="noreferrer" className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs hover:opacity-80">{c.label}</a>
                ))}
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <div className="space-y-3 text-sm">
          <Field label={t("kb.field.company")}><input value={kbAny("company")} onChange={(e) => set("company", e.target.value)} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("kb.field.industry")}><input value={kbAny("industry")} onChange={(e) => set("industry", e.target.value)} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" /></Field>
            <Field label={t("kb.field.category")}><input value={kbAny("category")} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" /></Field>
          </div>
          <Field label={`${t("kb.field.products")} (${t("kb.hint.commaSeparated")})`}><input value={(kb.products || []).join(", ")} onChange={(e) => set("products", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" /></Field>
          <Field label={t("kb.field.brandStory")}><textarea rows={4} value={kbAny("brandStory")} onChange={(e) => set("brandStory", e.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-2 text-sm" /></Field>
          <Field label={`${t("kb.field.brandTone")} (${t("kb.hint.commaSeparated")})`}><input value={(kb.brandTone || []).join(", ")} onChange={(e) => set("brandTone", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" /></Field>
          <Field label={`${t("kb.field.keywords")} (${t("kb.hint.commaSeparated")})`}><input value={(kb.keywords || []).join(", ")} onChange={(e) => set("keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" /></Field>
          <Field label={`${t("kb.field.competitors")} (${t("kb.hint.commaSeparated")})`}><input value={(kb.competitors || []).join(", ")} onChange={(e) => set("competitors", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" /></Field>
          <Field label={t("kb.field.targetAudience")}><textarea rows={3} value={kbAny("targetAudience")} onChange={(e) => set("targetAudience", e.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-2 text-sm" /></Field>
          <Field label={t("kb.field.koreanCopy")}><textarea rows={3} value={kbAny("koreanCopy")} onChange={(e) => set("koreanCopy", e.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-2 text-sm" /></Field>
          <Field label={t("kb.field.website")}><input value={kbAny("website")} onChange={(e) => set("website", e.target.value)} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" /></Field>
        </div>
      )}
    </div>
  );
}

function KV({ label, value, multiline }: { label: string; value?: string; multiline?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{label}</dt>
      <dd className={multiline ? "mt-1 whitespace-pre-line text-sm leading-relaxed" : "mt-1 text-sm"}>{value}</dd>
    </div>
  );
}
function KVList({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{label}</dt>
      <dd className="mt-1 flex flex-wrap gap-1.5">
        {items.map((it, i) => <span key={`${it}-${i}`} className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs">{it}</span>)}
      </dd>
    </div>
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
  const [confirmDelete, setConfirmDelete] = useState(false);
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
      toast.success(t("pd.toast.updated"));
      setEditing(false);
    } catch (e) { console.error(e); toast.error(t("pd.toast.updateFailed")); }
    finally { setBusy(false); }
  }

  async function onDelete() {
    setBusy(true);
    try {
      await deleteProject(project!.id);
      toast.success(t("pd.toast.deleted"));
      router.navigate({ to: "/projects" });
    } catch (e) { console.error(e); toast.error(t("pd.toast.deleteFailed")); }
    finally { setBusy(false); }
  }

  async function onDuplicate() {
    setBusy(true);
    try {
      const dup = await duplicateProject(project!.id);
      if (dup) {
        toast.success(t("pd.toast.duplicated"));
        setActiveProjectId(dup.id);
        router.navigate({ to: "/projects/$projectId", params: { projectId: dup.id } });
      }
    } catch { toast.error(t("pd.toast.duplicateFailed")); }
    finally { setBusy(false); }
  }

  async function onArchive() {
    setBusy(true);
    try {
      if (project!.archived) { await unarchiveProject(project!.id); toast.success(t("pd.toast.restored")); }
      else { await archiveProject(project!.id); toast.success(t("pd.toast.archived")); }
    } catch { toast.error(t("pd.toast.archiveFailed")); }
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
            {editing ? t("pd.action.cancel") : t("pd.action.edit")}
          </button>
          <button
            onClick={onDuplicate}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 text-xs font-medium hover:bg-[var(--muted)] disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" />
            {t("pd.action.duplicate")}
          </button>
          <button
            onClick={onArchive}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 text-xs font-medium hover:bg-[var(--muted)] disabled:opacity-50"
          >
            {project.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            {project.archived ? t("pd.action.restore") : t("pd.action.archive")}
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("pd.action.delete")}
          </button>
        </div>
      </div>

      {editing && (
        <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
          <h3 className="mb-4 text-sm font-semibold">{t("pd.edit.title")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("pd.field.brandName")}>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
            </Field>
            <Field label={t("pd.field.industry")}>
              <input value={draft.industry} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
            </Field>
            <Field label={t("pd.field.targetMarket")}>
              <input value={draft.targetMarket} onChange={(e) => setDraft({ ...draft, targetMarket: e.target.value })} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
            </Field>
            <Field label={t("pd.field.status")}>
              <select value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value as Stage })} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm">
                {stageOrder.map((s) => <option key={s} value={s}>{t(stageLabelKey[s])}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label={t("pd.field.description")}>
                <textarea rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-2 text-sm" />
              </Field>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]">{t("pd.action.cancel")}</button>
            <button onClick={save} disabled={busy || !draft.name.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50">
              {busy && <Loader2 className="h-3 w-3 animate-spin" />} {t("pd.action.save")}
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

          <KnowledgeBasePanel project={project} />
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
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("pd.delete.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("pd.delete.confirmBody", { v: project.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("pd.action.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmDelete(false); onDelete(); }}>{t("pd.action.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}