import type { Scored } from "./match.functions";

export type Tier = "leading" | "mid" | "micro";

export type PlannedKol = Scored & {
  tier: Tier;
  reason: string;
};

export type KolPlan = {
  tiers: { tier: Tier; label: string; note: string; items: PlannedKol[] }[];
  total: number;
  estCostMin: number;
  estCostMax: number;
  reach: number;
  platformMix: { platform: string; count: number }[];
};

export const TIER_LABEL: Record<Tier, { label: string; note: string }> = {
  leading: { label: "리딩 KOL", note: "인지도 · 신뢰 확보" },
  mid: { label: "미드티어", note: "전환 · 구매 유도" },
  micro: { label: "마이크로", note: "리뷰 볼륨 · 검색 노출" },
};

function tierOf(followers: number | null | undefined): Tier {
  const f = followers || 0;
  if (f >= 1_000_000) return "leading";
  if (f >= 150_000) return "mid";
  return "micro";
}

const TIER_QUOTA: Record<Tier, number> = { leading: 2, mid: 5, micro: 8 };
/** Rough share of the budget each tier should absorb. */
const TIER_BUDGET_SHARE: Record<Tier, number> = { leading: 0.5, mid: 0.3, micro: 0.2 };

function priceOf(k: Scored): { min: number; max: number } {
  const max = k.price_band?.max ?? 0;
  const min = k.price_band?.min ?? Math.round(max * 0.6);
  return { min, max };
}

function buildReason(k: Scored, categoryLabel?: string): string {
  const bits: string[] = [];
  const b = k.match_breakdown;
  if (b.category >= 0.5) {
    bits.push(`카테고리 일치${categoryLabel ? `(${categoryLabel})` : ""}`);
  } else if ((k.primary_categories || []).length) {
    bits.push(`인접 카테고리 ${k.primary_categories[0]}`);
  }
  if (b.competitor > 0) bits.push("경쟁사 협업 이력");
  if (b.audience >= 0.5) bits.push("타깃 오디언스 일치");
  if (b.price >= 0.9) bits.push("예산 내 단가");
  else if (b.price <= 0.3) bits.push("예산 초과 가능");
  if ((k.followers || 0) >= 500_000) bits.push("대형 도달");
  if (k.contact_public_email) bits.push("공개 연락처 확보");
  return bits.slice(0, 3).join(" · ") || "브랜드 카테고리 기준 상위 후보";
}

/**
 * Slice a score-ordered candidate list into a tiered activation plan.
 * Pure function — no server calls, fully reproducible.
 */
export function buildKolPlan(
  candidates: Scored[],
  opts: { budgetTotalCny?: number; categoryLabel?: string } = {},
): KolPlan {
  const buckets: Record<Tier, Scored[]> = { leading: [], mid: [], micro: [] };
  for (const k of candidates) buckets[tierOf(k.followers)].push(k);

  const picked: PlannedKol[] = [];
  (["leading", "mid", "micro"] as Tier[]).forEach((tier) => {
    const cap = opts.budgetTotalCny
      ? opts.budgetTotalCny * TIER_BUDGET_SHARE[tier]
      : Number.POSITIVE_INFINITY;
    let spent = 0;
    for (const k of buckets[tier]) {
      if (picked.filter((p) => p.tier === tier).length >= TIER_QUOTA[tier]) break;
      const { max } = priceOf(k);
      if (opts.budgetTotalCny && max && spent + max > cap) continue;
      spent += max;
      picked.push({ ...k, tier, reason: buildReason(k, opts.categoryLabel) });
    }
  });

  let estCostMin = 0;
  let estCostMax = 0;
  let reach = 0;
  const mix = new Map<string, number>();
  for (const p of picked) {
    const { min, max } = priceOf(p);
    estCostMin += min;
    estCostMax += max;
    reach += p.followers || 0;
    mix.set(p.platform, (mix.get(p.platform) || 0) + 1);
  }

  return {
    tiers: (["leading", "mid", "micro"] as Tier[]).map((tier) => ({
      tier,
      label: TIER_LABEL[tier].label,
      note: TIER_LABEL[tier].note,
      items: picked.filter((p) => p.tier === tier),
    })),
    total: picked.length,
    estCostMin,
    estCostMax,
    reach,
    platformMix: [...mix.entries()].map(([platform, count]) => ({ platform, count })),
  };
}