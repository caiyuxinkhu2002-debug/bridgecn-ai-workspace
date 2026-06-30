import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { nextStage, prevStage, stageLabelKey, stageToPath, type Stage } from "@/lib/workflow";

export function WorkflowFooter({ current }: { current: Stage }) {
  const { t } = useI18n();
  const router = useRouter();
  const { advanceStage } = useWorkspace();
  const next = nextStage(current);
  const prev = prevStage(current);

  return (
    <div className="mt-10 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
        {t(stageLabelKey[current])}
      </div>
      <div className="flex items-center justify-end gap-2">
        {prev && (
          <Link
            to={stageToPath[prev]}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--muted)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t(stageLabelKey[prev])}
          </Link>
        )}
        {next ? (
          <button
            onClick={() => {
              advanceStage(next);
              router.navigate({ to: stageToPath[next] });
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 text-xs font-medium text-[var(--background)] hover:opacity-90"
          >
            {t("workflow.next")} {t(stageLabelKey[next])}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="inline-flex h-9 items-center rounded-md bg-[var(--primary-soft)] px-3 text-xs font-medium text-[var(--primary)]">
            {t("workflow.done")}
          </span>
        )}
      </div>
    </div>
  );
}