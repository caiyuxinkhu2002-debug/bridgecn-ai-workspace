import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { DataIntegrityBanner } from "@/components/data-integrity-banner";
import { ProjectContextBar } from "@/components/project-context-bar";
import { ProjectSummaryStrip } from "@/components/project-summary-strip";
import { WorkflowFooter } from "@/components/workflow-footer";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { Sparkles, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_app/consumer-insight")({
  head: () => ({ meta: [{ title: "Consumer Insight — BridgeCN AI" }] }),
  component: ConsumerInsightPage,
});

function ConsumerInsightPage() {
  const { t } = useI18n();
  const { activeProject } = useWorkspace();
  const kb = activeProject?.knowledgeBase || {};
  const audience = (kb.targetAudience || "").trim();
  const tone = kb.brandTone || [];
  const keywords = kb.keywords || [];
  const hasData = Boolean(audience) || tone.length > 0 || keywords.length > 0;

  return (
    <div>
      <ProjectContextBar />
      <PageHeader title={t("consumer.title")} description={t("consumer.sub")} />
      <ProjectSummaryStrip />
      <DataIntegrityBanner />
      {!hasData ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-10 text-center shadow-[var(--shadow-soft)]">
          <Sparkles className="mx-auto h-5 w-5 text-[var(--primary)]" />
          <p className="mt-3 text-sm font-medium">
            No consumer data for {activeProject?.name || "this project"} yet.
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Enrich the Project Knowledge Base with target audience, tone and keywords to generate
            consumer insight.
          </p>
          {activeProject?.id && (
            <Link
              to="/projects/$projectId"
              params={{ projectId: activeProject.id }}
              className="mt-4 inline-flex h-9 items-center rounded-md bg-[var(--foreground)] px-3 text-xs font-medium text-[var(--background)] hover:opacity-90"
            >
              Open Knowledge Base
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--primary)]" />
              <h3 className="text-sm font-semibold">Target audience</h3>
            </div>
            {audience ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--foreground)]/85">
                {audience}
              </p>
            ) : (
              <p className="text-xs text-[var(--muted-foreground)]">
                Add a target audience description in the Knowledge Base.
              </p>
            )}
            {tone.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tone.map((tn) => (
                  <span
                    key={tn}
                    className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]"
                  >
                    {tn}
                  </span>
                ))}
              </div>
            )}
          </div>
          {keywords.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                <h3 className="text-sm font-semibold">{t("consumer.signals")}</h3>
              </div>
              <ul className="divide-y divide-[var(--border)]">
                {keywords.map((kw) => (
                  <li key={kw} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-[var(--muted-foreground)]" />
                      <p className="text-sm font-medium">{kw}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <WorkflowFooter current="consumer" />
    </div>
  );
}
