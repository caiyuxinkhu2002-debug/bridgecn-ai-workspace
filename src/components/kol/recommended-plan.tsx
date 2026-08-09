import { Loader2, Sparkles, Target, Wallet } from "lucide-react";
import { KolCard } from "@/components/kol/kol-card";
import type { KolPlan } from "@/lib/kol/plan";

const PLATFORM_LABEL: Record<string, string> = {
  xiaohongshu: "小红书",
  douyin: "抖音",
  bilibili: "B站",
  wechat: "微信",
};

function fmtReach(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`;
  return n.toLocaleString();
}

export function RecommendedPlan({
  brandName,
  plan,
  loading,
  saving,
  savedIds,
  budget,
  onBudgetChange,
  onSavePlan,
  onAddOne,
  onBrowseManually,
}: {
  brandName: string;
  plan: KolPlan;
  loading?: boolean;
  saving?: boolean;
  savedIds: Set<string>;
  budget?: number;
  onBudgetChange: (v?: number) => void;
  onSavePlan: () => void;
  onAddOne: (kolId: string, score: number, breakdown: Record<string, number>) => void;
  onBrowseManually: () => void;
}) {
  const allSaved = plan.total > 0 && plan.tiers.every((t) => t.items.every((i) => savedIds.has(i.id)));

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold inline-flex items-center gap-2">
            <Target className="h-4 w-4 text-[oklch(0.55_0.18_260)]" />
            「{brandName}」를 위한 추천 KOL
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            앞 단계에서 수집한 브랜드 카테고리 · 경쟁사 · 타깃 오디언스를 그대로 매칭 엔진에 넣어
            자동 구성한 집행 플랜입니다. 직접 검색하지 않아도 됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Wallet className="absolute left-2 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <input
              type="number"
              value={budget ?? ""}
              onChange={(e) => onBudgetChange(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="총 예산 (¥)"
              className="w-40 rounded-md border border-[var(--border)] bg-[var(--background)] pl-7 pr-2 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={onSavePlan}
            disabled={saving || plan.total === 0 || allSaved}
            className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.55_0.18_260)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {allSaved ? "숏리스트에 저장됨" : "이 플랜을 숏리스트로 저장"}
          </button>
          <button
            type="button"
            onClick={onBrowseManually}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--muted)]"
          >
            직접 고르기
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Stat label="추천 인원" value={`${plan.total}명`} />
        <Stat
          label="예상 집행비 (AI 추정)"
          value={
            plan.estCostMax
              ? `¥${plan.estCostMin.toLocaleString()} ~ ${plan.estCostMax.toLocaleString()}`
              : "—"
          }
        />
        <Stat label="합산 도달 (팔로워)" value={fmtReach(plan.reach)} />
        <Stat
          label="플랫폼 분포"
          value={
            plan.platformMix.map((m) => `${PLATFORM_LABEL[m.platform] || m.platform} ${m.count}`).join(" · ") ||
            "—"
          }
        />
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
          브랜드 컨텍스트로 매칭 중…
        </div>
      ) : plan.total === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">
          현재 조건(예산 포함)에 맞는 추천 조합을 만들지 못했습니다. 예산을 올리거나 아래에서 직접
          골라보세요.
        </div>
      ) : (
        plan.tiers
          .filter((t) => t.items.length > 0)
          .map((t) => (
            <div key={t.tier} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-semibold">{t.label}</h3>
                <span className="text-[11px] text-[var(--muted-foreground)]">{t.note}</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">· {t.items.length}명</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {t.items.map((k) => (
                  <div key={k.id} className="space-y-1">
                    <KolCard
                      kol={k}
                      score={k.match_score}
                      breakdown={k.match_breakdown}
                      inShortlist={savedIds.has(k.id)}
                      onAddToShortlist={() => onAddOne(k.id, k.match_score, k.match_breakdown)}
                    />
                    <p className="text-[11px] text-[oklch(0.45_0.12_260)] px-1">추천 이유: {k.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
      <div className="text-[10px] text-[var(--muted-foreground)]">{label}</div>
      <div className="text-sm font-semibold truncate">{value}</div>
    </div>
  );
}