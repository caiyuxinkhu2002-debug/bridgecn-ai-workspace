import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Plus,
  Languages,
  FileBarChart,
  ListChecks,
  CheckCircle2,
  Activity,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { stageLabelKey, stageToPath } from "@/lib/workflow";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BridgeCN AI" },
      {
        name: "description",
        content: "BridgeCN AI workspace for Korean companies expanding into China.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { activeProject, projects, reports, setActiveProjectId } = useWorkspace();

  // Sprint 9: removed hardcoded suggestions/trends/activity/tasks. These
  // surfaces now render KB-driven content; empty arrays trigger empty
  // states instead of falling back to demo brand examples.
  const suggestions: string[] = [];
  const trends: string[] = [];
  const activity: string[] = [];
  const tasks: string[] = [];

  return (
    <div className="space-y-8">
      <PageHeader title={t("dash.welcome")} description={t("dash.sub")} />

      {/* Continue working */}
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--primary-soft)]/40 p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[oklch(0.45_0.22_280)] text-sm font-semibold text-white shadow">
              {activeProject.initials}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                {t("dash.continue")}
              </p>
              <p className="mt-0.5 text-lg font-semibold tracking-tight">{activeProject.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {activeProject.industry} · {t(stageLabelKey[activeProject.stage])} ·{" "}
                {activeProject.progress}%
              </p>
            </div>
          </div>
          <button
            onClick={() => router.navigate({ to: stageToPath[activeProject.stage] })}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--background)] hover:opacity-90"
          >
            {t("dash.resume")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">{t("dash.quickActions")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: "/start", icon: Plus, label: t("dash.qa.newProject") },
            { to: "/localization-studio", icon: Languages, label: t("dash.qa.localize") },
            { to: "/reports", icon: FileBarChart, label: t("dash.qa.report") },
            { to: "/launch-checklist", icon: ListChecks, label: t("dash.qa.checklist") },
          ].map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.to}
                to={q.to}
                className="group flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-card)]"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--muted)]">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{q.label}</span>
                <ChevronRight className="ml-auto h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Two col: recent projects + ai suggestions */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("dash.recentProjects")}</h2>
            <Link
              to="/projects"
              className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {t("common.viewAll")} →
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
            <ul className="divide-y divide-[var(--border)]">
              {projects.slice(0, 5).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)]/60"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--muted)] to-[var(--primary-soft)] text-xs font-semibold">
                    {p.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => {
                        setActiveProjectId(p.id);
                        router.navigate({
                          to: "/projects/$projectId",
                          params: { projectId: p.id },
                        });
                      }}
                      className="block truncate text-left text-sm font-medium hover:underline"
                    >
                      {p.name}
                    </button>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">{p.industry}</p>
                  </div>
                  <span className="hidden md:inline-flex items-center rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
                    {t(stageLabelKey[p.stage])}
                  </span>
                  <span className="hidden md:inline text-xs text-[var(--muted-foreground)]">
                    {p.updated}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            {t("dash.suggestions")}
          </h2>
          <div className="space-y-3">
            {suggestions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-xs text-[var(--muted-foreground)]">
                {t("common.empty")}
              </div>
            ) : (
              suggestions.map((s) => (
                <div
                  key={s}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-soft)]"
                >
                  <p className="text-sm font-medium">{s}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Trends + recent reports */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <TrendingUp className="h-3.5 w-3.5 text-[var(--primary)]" />
            {t("dash.trends")}
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
            {trends.length === 0 ? (
              <p className="px-4 py-4 text-xs text-[var(--muted-foreground)]">
                {t("common.empty")}
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {trends.map((tr) => (
                  <li key={tr} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-sm">{tr}</span>
                    <Link
                      to="/china-market-insight"
                      className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      {t("common.open")} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">{t("dash.recentReports")}</h2>
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
            {reports.length === 0 ? (
              <p className="px-4 py-4 text-xs text-[var(--muted-foreground)]">
                {t("common.empty")}
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {reports.slice(0, 4).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <Link
                        to="/report"
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {r.title}
                      </Link>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {r.type} · {r.date}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Activity + tasks */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Activity className="h-3.5 w-3.5 text-[var(--primary)]" />
            {t("dash.activity")}
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
            {activity.length === 0 ? (
              <p className="px-4 py-4 text-xs text-[var(--muted-foreground)]">
                {t("common.empty")}
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {activity.map((a) => (
                  <li key={a} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--primary)]" />
            {t("dash.tasks")}
          </h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
            {tasks.length === 0 ? (
              <p className="px-4 py-4 text-xs text-[var(--muted-foreground)]">
                {t("common.empty")}
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {tasks.map((tk) => (
                  <li key={tk} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-[var(--border)] accent-[var(--primary)]"
                    />
                    <span className="flex-1">{tk}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Journey footer: always show a next-step CTA */}
      <section className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
          {projects.length === 0 ? t("dash.sub") : t("dash.continue.sub")}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Link
            to="/projects"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--muted)]"
          >
            {t("nav.projects")}
          </Link>
          {projects.length === 0 ? (
            <Link
              to="/start"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 text-xs font-medium text-[var(--background)] hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("projects.new")}
            </Link>
          ) : (
            <button
              onClick={() => router.navigate({ to: stageToPath[activeProject.stage] })}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 text-xs font-medium text-[var(--background)] hover:opacity-90"
            >
              {t("dash.resume")} {t(stageLabelKey[activeProject.stage])}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
