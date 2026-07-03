import { CheckCircle2, Circle, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/workspace-context";
import { stageOrder } from "@/lib/workflow";

/**
 * Project Health Card
 * -------------------
 * Purely client-side scorecard that grades a project's readiness for launch.
 * We give the user a concrete, checkable rubric instead of a vague "progress".
 * All logic is derived from data already loaded into the workspace context —
 * no extra network calls, no DB changes.
 */
type Check = { id: string; labelKey: string; ok: boolean; weight: number };

function computeChecks(project: Project): Check[] {
  const kb = project.knowledgeBase || {};
  const stageIdx = stageOrder.indexOf(project.stage);
  const has = (v: unknown) =>
    Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim().length > 0 : Boolean(v);

  return [
    {
      id: "brand",
      labelKey: "health.check.brand",
      ok: has(kb.company) || has(project.name),
      weight: 1,
    },
    {
      id: "industry",
      labelKey: "health.check.industry",
      ok: has(kb.industry) || has(project.industry),
      weight: 1,
    },
    { id: "products", labelKey: "health.check.products", ok: has(kb.products), weight: 1 },
    { id: "story", labelKey: "health.check.story", ok: has(kb.brandStory), weight: 1 },
    { id: "audience", labelKey: "health.check.audience", ok: has(kb.targetAudience), weight: 1 },
    { id: "keywords", labelKey: "health.check.keywords", ok: has(kb.keywords), weight: 1 },
    { id: "competitors", labelKey: "health.check.competitors", ok: has(kb.competitors), weight: 1 },
    { id: "market", labelKey: "health.check.market", ok: has(project.targetMarket), weight: 1 },
    {
      id: "website",
      labelKey: "health.check.website",
      ok: has(kb.website) || has(project.website),
      weight: 1,
    },
    { id: "locale", labelKey: "health.check.locale", ok: has(kb._locale), weight: 1 },
    { id: "stage", labelKey: "health.check.stage", ok: stageIdx >= 2, weight: 2 },
  ];
}

export function ProjectHealthCard({ project }: { project: Project }) {
  const { t } = useI18n();
  const checks = useMemo(() => computeChecks(project), [project]);
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const scoreWeight = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  const pct = Math.round((scoreWeight / totalWeight) * 100);

  const tone =
    pct >= 80
      ? {
          Icon: ShieldCheck,
          badgeKey: "health.badge.ready",
          ring: "oklch(0.72 0.16 150)",
          bg: "oklch(0.97 0.05 150)",
          bgDark: "oklch(0.20 0.04 150)",
        }
      : pct >= 50
        ? {
            Icon: ShieldQuestion,
            badgeKey: "health.badge.progress",
            ring: "oklch(0.75 0.15 85)",
            bg: "oklch(0.98 0.04 85)",
            bgDark: "oklch(0.20 0.04 85)",
          }
        : {
            Icon: ShieldAlert,
            badgeKey: "health.badge.early",
            ring: "oklch(0.68 0.19 25)",
            bg: "oklch(0.98 0.03 25)",
            bgDark: "oklch(0.20 0.04 25)",
          };

  const Icon = tone.Icon;
  const nextTodo = checks.find((c) => !c.ok);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("health.title")}</h3>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background: `color-mix(in oklch, ${tone.ring} 18%, transparent)`,
            color: tone.ring,
          }}
        >
          <Icon className="h-3 w-3" />
          {t(tone.badgeKey)}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div
          className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(${tone.ring} ${pct * 3.6}deg, var(--muted) 0deg)`,
          }}
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--background)]">
            <span className="text-sm font-bold tabular-nums">{pct}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--muted-foreground)]">{t("health.score.sub")}</p>
          <p className="mt-1 text-sm">
            {scoreWeight}/{totalWeight} {t("health.score.points")}
          </p>
        </div>
      </div>
      {nextTodo && (
        <p className="mt-3 rounded-md bg-[var(--muted)] px-2.5 py-1.5 text-[11px] text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--foreground)]">{t("health.next")}: </span>
          {t(nextTodo.labelKey)}
        </p>
      )}
      <ul className="mt-4 space-y-1.5">
        {checks.map((c) => (
          <li key={c.id} className="flex items-center gap-2 text-xs">
            {c.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--primary)]" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            )}
            <span className={c.ok ? "" : "text-[var(--muted-foreground)]"}>{t(c.labelKey)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
