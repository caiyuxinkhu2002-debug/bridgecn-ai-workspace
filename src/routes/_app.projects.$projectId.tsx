import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { stageLabelKey, stageOrder, stageToPath } from "@/lib/workflow";

export const Route = createFileRoute("/_app/projects/$projectId")({
  head: () => ({ meta: [{ title: "Project — BridgeCN AI" }] }),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const { t } = useI18n();
  const router = useRouter();
  const { allProjects, setActiveProjectId, activeProjectId } = useWorkspace();
  const project = allProjects.find((p) => p.id === projectId);

  useEffect(() => {
    if (project && project.id !== activeProjectId) setActiveProjectId(project.id);
  }, [project, activeProjectId, setActiveProjectId]);

  if (!project) {
    throw notFound();
  }

  const currentIdx = stageOrder.indexOf(project.stage);

  return (
    <div>
      <Link to="/projects" className="mb-4 inline-block text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        ← {t("projects.title")}
      </Link>
      <PageHeader title={project.name} description={project.summary} />

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