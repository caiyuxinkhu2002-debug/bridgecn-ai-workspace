import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Plus, ChevronRight } from "lucide-react";
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
  const { projects, setActiveProjectId, activeProjectId } = useWorkspace();

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

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_auto] gap-4 border-b border-[var(--border)] bg-[var(--muted)] px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
          <div>{t("projects.col.project")}</div>
          <div className="hidden md:block">{t("projects.col.stage")}</div>
          <div className="hidden md:block">{t("projects.col.owner")}</div>
          <div className="hidden md:block">{t("projects.col.updated")}</div>
          <div />
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {projects.map((p) => (
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
              <Link
                to="/projects/$projectId"
                params={{ projectId: p.id }}
                onClick={() => setActiveProjectId(p.id)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--muted)]"
              >
                <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}