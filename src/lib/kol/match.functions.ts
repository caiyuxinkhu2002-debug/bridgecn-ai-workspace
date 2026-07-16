import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { KolRow } from "./kols.functions";

export type MatchInput = {
  workspaceId: string;
  targetCategories: string[]; // brand's category / keywords
  targetAudience?: string; // free text (age / gender / tier city hints)
  platforms?: ("xiaohongshu" | "douyin" | "bilibili" | "wechat")[];
  minFollowers?: number;
  maxFollowers?: number;
  maxBudgetCny?: number;
};

export type Scored = KolRow & {
  match_score: number;
  match_breakdown: {
    category: number;
    audience: number;
    platform: number;
    price: number;
  };
};

function categoryScore(kol: KolRow, wanted: string[]): number {
  if (!wanted.length) return 0.5;
  const kolCats = [...(kol.primary_categories || []), ...(kol.mentioned_brands || [])]
    .join(" ")
    .toLowerCase();
  const hits = wanted.filter((c) => kolCats.includes(c.toLowerCase())).length;
  return Math.min(1, hits / Math.max(1, wanted.length));
}

function audienceScore(kol: KolRow, target?: string): number {
  if (!target) return 0.5;
  const t = target.toLowerCase();
  const blob = JSON.stringify(kol.audience_profile || {}).toLowerCase();
  const tokens = t.split(/[\s,·、]+/).filter(Boolean);
  if (!tokens.length) return 0.5;
  const hits = tokens.filter((tok) => blob.includes(tok)).length;
  return Math.min(1, hits / tokens.length);
}

function priceScore(kol: KolRow, maxBudget?: number): number {
  if (!maxBudget) return 0.5;
  const max = kol.price_band?.max;
  if (!max) return 0.4;
  if (max <= maxBudget) return 1;
  if (max <= maxBudget * 1.5) return 0.6;
  return 0.2;
}

export const matchKols = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: MatchInput) => input)
  .handler(async ({ data, context }): Promise<Scored[]> => {
    let q = context.supabase
      .from("kols")
      .select(
        "id,platform,handle,display_name,profile_url,avatar_url,followers,bio,primary_categories,content_types,tone,audience_profile,mentioned_brands,contact_public_email,contact_note,price_band,ai_confidence,verified_source,last_crawled_at,updated_at,data_source,popularity_score",
      )
      .or(`workspace_id.is.null,workspace_id.eq.${data.workspaceId}`);
    if (data.platforms?.length) q = q.in("platform", data.platforms);
    if (data.minFollowers) q = q.gte("followers", data.minFollowers);
    if (data.maxFollowers) q = q.lte("followers", data.maxFollowers);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const scored = ((rows || []) as unknown as KolRow[]).map((k) => {
      const cat = categoryScore(k, data.targetCategories);
      const aud = audienceScore(k, data.targetAudience);
      const platform = 1; // already filtered
      const price = priceScore(k, data.maxBudgetCny);
      const total = cat * 0.5 + aud * 0.25 + platform * 0.1 + price * 0.15;
      return {
        ...k,
        match_score: Number(total.toFixed(3)),
        match_breakdown: { category: cat, audience: aud, platform, price },
      };
    });
    scored.sort((a, b) => b.match_score - a.match_score);
    return scored;
  });