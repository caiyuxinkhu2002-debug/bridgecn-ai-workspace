import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Real-KOL crawl pipeline.
//   1. Firecrawl scrape (public profile URL → markdown + json + links)
//   2. Gemini structuring (categories / tone / audience / brands / price band)
//   3. Gemini embedding (for matching)
//   4. Upsert into public.kols + snapshot into public.kol_snapshots
//
// Every field the AI infers is stamped with a confidence level so the UI
// can honestly label "Measured" vs "AI Estimated" — never both.

export type Platform = "xiaohongshu" | "douyin" | "bilibili" | "wechat";

function detectPlatform(url: string): Platform | null {
  const u = url.toLowerCase();
  if (u.includes("xiaohongshu.com") || u.includes("xhslink")) return "xiaohongshu";
  if (u.includes("douyin.com") || u.includes("iesdouyin")) return "douyin";
  if (u.includes("bilibili.com") || u.includes("b23.tv")) return "bilibili";
  if (u.includes("weixin.qq.com") || u.includes("mp.weixin") || u.includes("channels.weixin"))
    return "wechat";
  return null;
}

function extractHandle(url: string, platform: Platform): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (platform === "xiaohongshu") return parts[parts.length - 1] || parsed.pathname;
    if (platform === "bilibili") return parts.find((p) => /^\d+$/.test(p)) || parts[0] || "";
    if (platform === "douyin") return parts[parts.length - 1] || "";
    return parts.join("/") || parsed.hostname;
  } catch {
    return url;
  }
}

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl";

async function firecrawlScrape(url: string): Promise<{
  markdown: string;
  json?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  screenshot?: string;
  error?: string;
}> {
  const apiKey = process.env.LOVABLE_API_KEY;
  const connKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey || !connKey) return { markdown: "", error: "Firecrawl not configured" };
  const res = await fetch(`${GATEWAY}/v2/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Connection-Api-Key": connKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      waitFor: 2000,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    data?: {
      markdown?: string;
      json?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    };
    success?: boolean;
    error?: string;
  };
  if (!res.ok || body.error) {
    return { markdown: "", error: body.error || `Firecrawl HTTP ${res.status}` };
  }
  return {
    markdown: body.data?.markdown || "",
    json: body.data?.json,
    metadata: body.data?.metadata,
  };
}

type Structured = {
  display_name?: string;
  followers?: number;
  bio?: string;
  primary_categories?: string[];
  content_types?: string[];
  tone?: string[];
  audience_profile?: {
    gender_skew?: string;
    age_band?: string;
    tier_city?: string;
    interests?: string[];
  };
  mentioned_brands?: string[];
  contact_public_email?: string;
  contact_note?: string;
  price_band?: { min?: number; max?: number; currency?: string; confidence?: string };
  _confidence?: Record<string, "high" | "medium" | "low">;
};

async function structureWithGemini(
  markdown: string,
  platform: Platform,
  profileUrl: string,
): Promise<Structured> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const system = `You are an analyst who extracts a Chinese KOL / creator profile card from raw scraped page content. Be grounded: only assert what the source supports. If a field is unknown, omit it or mark low confidence. Never invent a phone number, WeChat ID, or agency email. Only include contact_public_email if a real email string appears in the source. Language: keep Chinese names/handles as-is; write categories, tone, and audience fields in Korean.`;
  const user = `Platform: ${platform}
Profile URL: ${profileUrl}

--- RAW PAGE CONTENT (truncated) ---
${markdown.slice(0, 18000)}
--- END ---

Return STRICT JSON with this shape (omit unknown fields):
{
  "display_name": string,
  "followers": number,                   // integer follower count if visible
  "bio": string,                         // self-intro / signature
  "primary_categories": string[],        // e.g. ["뷰티","스킨케어"] — 2-4 items
  "content_types": string[],             // ["튜토리얼","리뷰","브이로그","라이브커머스"]
  "tone": string[],                      // ["전문적","친근한","클리니컬"]
  "audience_profile": {
    "gender_skew": string,               // "여성 우세" / "남성 우세" / "혼합"
    "age_band": string,                  // "18-24" / "25-34" ...
    "tier_city": string,                 // "1선 도시 중심" / "1-2선" ...
    "interests": string[]
  },
  "mentioned_brands": string[],          // brand names visible in recent posts
  "contact_public_email": string,        // only if literally present in source
  "contact_note": string,                // e.g. "商务合作请私信" — verbatim
  "price_band": { "min": number, "max": number, "currency": "CNY", "confidence": "high"|"medium"|"low" },
  "_confidence": { "<field>": "high"|"medium"|"low" }
}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content) as Structured;
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    return m ? (JSON.parse(m[0]) as Structured) : {};
  }
}

async function embed(text: string): Promise<number[] | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || !text) return null;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text.slice(0, 6000),
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { embedding?: number[] }[] };
  return json.data?.[0]?.embedding ?? null;
}

export type CrawlInput = { workspaceId: string; profileUrl: string };
export type CrawlResult = {
  ok: boolean;
  kolId?: string;
  platform?: Platform;
  error?: string;
};

export const crawlKol = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CrawlInput) => input)
  .handler(async ({ data, context }): Promise<CrawlResult> => {
    const url = data.profileUrl?.trim();
    if (!url) return { ok: false, error: "Missing profile URL" };
    const platform = detectPlatform(url);
    if (!platform) {
      return {
        ok: false,
        error: "지원하지 않는 URL입니다. 小红书 / 抖音 / B站 / 微信 공개 프로필 링크만 가능합니다.",
      };
    }

    // Quota check
    try {
      const { checkAndIncrement } = await import("@/lib/billing/quota.server");
      await checkAndIncrement({
        userId: context.userId,
        workspaceId: data.workspaceId,
        kind: "kolCrawls",
      });
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }

    const scrape = await firecrawlScrape(url);
    if (scrape.error || !scrape.markdown) {
      return { ok: false, error: scrape.error || "크롤 결과 비어있음" };
    }

    let structured: Structured = {};
    try {
      structured = await structureWithGemini(scrape.markdown, platform, url);
    } catch (e) {
      return { ok: false, error: `AI 분석 실패: ${(e as Error).message}` };
    }

    const handle = extractHandle(url, platform);
    const embeddingText = [
      structured.display_name,
      structured.bio,
      (structured.primary_categories || []).join(" "),
      (structured.tone || []).join(" "),
      (structured.mentioned_brands || []).join(" "),
    ]
      .filter(Boolean)
      .join(" | ");
    const vector = await embed(embeddingText).catch(() => null);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      workspace_id: data.workspaceId,
      platform,
      handle,
      profile_url: url,
      display_name: structured.display_name || handle,
      followers: structured.followers ?? null,
      bio: structured.bio || null,
      primary_categories: structured.primary_categories || [],
      content_types: structured.content_types || [],
      tone: structured.tone || [],
      audience_profile: structured.audience_profile || {},
      mentioned_brands: structured.mentioned_brands || [],
      contact_public_email: structured.contact_public_email || null,
      contact_note: structured.contact_note || null,
      price_band: structured.price_band || null,
      ai_confidence: (structured._confidence || {}) as unknown as Record<string, string>,
      embedding: vector ? `[${vector.join(",")}]` : null,
      last_crawled_at: new Date().toISOString(),
      created_by: context.userId,
      verified_source: "crawl" as const,
    };

    const { data: upserted, error: upErr } = await supabaseAdmin
      .from("kols")
      .upsert(row, { onConflict: "workspace_id,platform,handle" })
      .select("id")
      .single();
    if (upErr || !upserted) return { ok: false, error: upErr?.message || "저장 실패" };

    await supabaseAdmin.from("kol_snapshots").insert({
      kol_id: upserted.id,
      raw_markdown: scrape.markdown.slice(0, 200_000),
      raw_json: JSON.parse(JSON.stringify(structured ?? {})),
      ai_confidence: structured._confidence
        ? JSON.parse(JSON.stringify(structured._confidence))
        : null,
    });

    return { ok: true, kolId: upserted.id, platform };
  });