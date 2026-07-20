import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Platform snapshots: raw, measured indicators crawled from public
// Xiaohongshu (小红书) hashtag / Douyin (抖音) topic pages via Firecrawl.
// Stored in `platform_snapshots` so every project can read the shared
// market signal without burning Firecrawl credits per user.

export type PlatformSnapshot = {
  id: string;
  platform: "xiaohongshu" | "douyin";
  category: string;
  query: string;
  source_url: string;
  metrics: {
    notes_or_videos_count?: number | null;
    total_views?: number | null;
    top_hashtags?: string[];
    top_creators?: { name: string; url?: string }[];
  };
  raw_excerpt: string | null;
  captured_at: string;
};

// ---------- read (used by the UI) ----------

export const listPlatformSnapshots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { category?: string; platform?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("platform_snapshots")
      .select("*")
      .order("captured_at", { ascending: false })
      .limit(12);
    if (data.category) q = q.eq("category", data.category);
    if (data.platform) q = q.eq("platform", data.platform);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as PlatformSnapshot[];
  });

// ---------- crawl (called by cron OR by a manual refresh button) ----------

// Xiaohongshu category seeds. Kept small on purpose — the plan targets
// beauty & fashion first. Extend when more Firecrawl budget is confirmed.
const XHS_SEEDS: { category: string; query: string; url: string }[] = [
  { category: "beauty", query: "K-뷰티", url: "https://www.xiaohongshu.com/search_result?keyword=k%E7%BE%8E%E5%A6%86" },
  { category: "beauty", query: "韩国护肤", url: "https://www.xiaohongshu.com/search_result?keyword=%E9%9F%A9%E5%9B%BD%E6%8A%A4%E8%82%A4" },
  { category: "skincare", query: "敏感肌", url: "https://www.xiaohongshu.com/search_result?keyword=%E6%95%8F%E6%84%9F%E8%82%8C" },
  { category: "fashion", query: "韩系穿搭", url: "https://www.xiaohongshu.com/search_result?keyword=%E9%9F%A9%E7%B3%BB%E7%A9%BF%E6%90%AD" },
  { category: "fashion", query: "K-fashion", url: "https://www.xiaohongshu.com/search_result?keyword=k-fashion" },
];

const DOUYIN_SEEDS: { category: string; query: string; url: string }[] = [
  { category: "beauty", query: "韩国美妆", url: "https://www.douyin.com/search/%E9%9F%A9%E5%9B%BD%E7%BE%8E%E5%A6%86" },
  { category: "fashion", query: "韩系穿搭", url: "https://www.douyin.com/search/%E9%9F%A9%E7%B3%BB%E7%A9%BF%E6%90%AD" },
];

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

// Extract loose numeric signals from Firecrawl markdown. The crawler
// pages are Chinese so we scan for patterns like "12.3万篇笔记" or
// "1.2亿次播放". These are heuristics, not authoritative — the UI
// labels the source as "measured" from that platform and shows the
// captured_at timestamp so users can judge freshness.
function parseChineseCount(md: string, pattern: RegExp): number | null {
  const m = md.match(pattern);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (Number.isNaN(num)) return null;
  const unit = m[2] ?? "";
  if (unit.includes("亿")) return Math.round(num * 100_000_000);
  if (unit.includes("万")) return Math.round(num * 10_000);
  return Math.round(num);
}

function extractHashtags(md: string, limit = 5): string[] {
  const found = new Set<string>();
  const re = /#([\u4e00-\u9fa5A-Za-z0-9]{2,20})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) && found.size < limit) found.add(m[1]);
  return [...found];
}

async function firecrawlScrape(url: string) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (!lovableKey || !fcKey) throw new Error("Firecrawl connector not configured");
  const res = await fetch(`${GATEWAY}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": fcKey,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      location: { country: "CN", languages: ["zh-CN"] },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { markdown?: string; data?: { markdown?: string } };
  return json.markdown ?? json.data?.markdown ?? "";
}

/**
 * Crawl seed pages and upsert one snapshot row per seed. Returns a
 * summary of what was captured. Called by the pg_cron endpoint under
 * /api/public/hooks/refresh-platform-snapshots.
 */
export async function crawlAndStoreAllSeeds() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const results: { url: string; ok: boolean; error?: string }[] = [];

  const runOne = async (
    platform: "xiaohongshu" | "douyin",
    seed: { category: string; query: string; url: string },
  ) => {
    try {
      const md = await firecrawlScrape(seed.url);
      const notesCount = parseChineseCount(md, /([\d.]+)\s*(万|亿)?\s*(?:篇笔记|条笔记|篇内容)/);
      const totalViews = parseChineseCount(md, /([\d.]+)\s*(万|亿)?\s*(?:次播放|次观看|次浏览)/);
      const topHashtags = extractHashtags(md, 6);

      const { error } = await supabaseAdmin.from("platform_snapshots").insert({
        platform,
        category: seed.category,
        query: seed.query,
        source_url: seed.url,
        metrics: {
          notes_or_videos_count: notesCount,
          total_views: totalViews,
          top_hashtags: topHashtags,
        },
        raw_excerpt: md.slice(0, 800),
      });
      if (error) throw new Error(error.message);
      results.push({ url: seed.url, ok: true });
    } catch (e) {
      results.push({ url: seed.url, ok: false, error: (e as Error).message });
    }
  };

  for (const s of XHS_SEEDS) await runOne("xiaohongshu", s);
  for (const s of DOUYIN_SEEDS) await runOne("douyin", s);

  return {
    total: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    details: results,
  };
}