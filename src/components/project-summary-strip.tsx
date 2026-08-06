import { Link } from "@tanstack/react-router";
import { AlertCircle, Plus, Sparkles, Target, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { buildProjectContext } from "@/lib/ai/project-context";
import { stageLabelKey, stageToPath, nextStage } from "@/lib/workflow";

const COPY = {
  en: {
    noProject: "No project selected yet.",
    noProjectBody: "Create a project first — every module reads its brand, category and audience from it.",
    create: "Create project",
    brand: "Brand",
    category: "Category",
    audience: "Audience",
    tone: "Tone",
    market: "Target market",
    next: "Next",
    editKb: "Edit Knowledge Base",
    autoApplied: "This page is auto-filled from the active project.",
    missing: "Not set",
  },
  ko: {
    noProject: "선택된 프로젝트가 없습니다.",
    noProjectBody: "먼저 프로젝트를 만들어 주세요 — 모든 모듈이 브랜드·카테고리·타깃을 이 프로젝트에서 읽어옵니다.",
    create: "프로젝트 만들기",
    brand: "브랜드",
    category: "카테고리",
    audience: "타깃",
    tone: "톤",
    market: "타깃 시장",
    next: "다음 단계",
    editKb: "지식베이스 편집",
    autoApplied: "이 페이지는 활성 프로젝트 정보로 자동 채워집니다.",
    missing: "미설정",
  },
  zh: {
    noProject: "尚未选择项目。",
    noProjectBody: "请先创建项目 —— 所有模块都会读取其品牌、品类与目标人群。",
    create: "创建项目",
    brand: "品牌",
    category: "品类",
    audience: "目标人群",
    tone: "语调",
    market: "目标市场",
    next: "下一步",
    editKb: "编辑知识库",
    autoApplied: "本页内容依据当前项目自动填充。",
    missing: "未设置",
  },
} as const;

export function useProjectStripCopy() {
  const { locale } = useI18n();
  return COPY[locale] ?? COPY.en;
}

/** Renders a "no project" CTA when there is nothing to work on. Returns null otherwise. */
export function NoProjectCta() {
  const c = useProjectStripCopy();
  const { projects } = useWorkspace();
  if (projects.length > 0) return null;
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-8 text-center shadow-[var(--shadow-soft)]">
      <AlertCircle className="mx-auto h-5 w-5 text-[var(--primary)]" />
      <p className="mt-3 text-sm font-medium">{c.noProject}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{c.noProjectBody}</p>
      <Link
        to="/start"
        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 text-xs font-medium text-[var(--background)] hover:opacity-90"
      >
        <Plus className="h-3.5 w-3.5" />
        {c.create}
      </Link>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </div>
      <div className="truncate text-xs font-medium">{value}</div>
    </div>
  );
}

/**
 * Shared project-context strip. Every workflow module renders this so the
 * brand / category / audience defined during onboarding is visibly carried
 * through the whole flow instead of being re-entered per page.
 */
export function ProjectSummaryStrip({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const c = useProjectStripCopy();
  const { activeProject, projects } = useWorkspace();

  if (projects.length === 0 || !activeProject) return <NoProjectCta />;

  const ctx = buildProjectContext(activeProject);
  const ns = nextStage(activeProject.stage);

  return (
    <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-center gap-2">
          <Target className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
          <Field label={c.brand} value={ctx.company || activeProject.name} />
        </div>
        <Field label={c.category} value={ctx.category || ctx.industry || c.missing} />
        <Field label={c.market} value={ctx.targetMarket || c.missing} />
        {!compact && (
          <div className="flex min-w-0 items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
            <Field
              label={c.audience}
              value={ctx.targetAudience ? ctx.targetAudience.slice(0, 48) : c.missing}
            />
          </div>
        )}
        {!compact && ctx.brandTone.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {ctx.brandTone.slice(0, 3).map((tn) => (
              <span
                key={tn}
                className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]"
              >
                {tn}
              </span>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {ns && (
            <Link
              to={stageToPath[ns]}
              className="inline-flex h-7 items-center rounded-md border border-[var(--border)] px-2 text-[11px] font-medium hover:bg-[var(--muted)]"
            >
              {c.next}: {t(stageLabelKey[ns])} →
            </Link>
          )}
          <Link
            to="/projects/$projectId"
            params={{ projectId: activeProject.id }}
            className="inline-flex h-7 items-center rounded-md border border-[var(--border)] px-2 text-[11px] font-medium hover:bg-[var(--muted)]"
          >
            {c.editKb}
          </Link>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
        <Sparkles className="h-3 w-3 text-[var(--primary)]" />
        {c.autoApplied}
      </p>
    </div>
  );
}
