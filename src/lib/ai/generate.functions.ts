import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ProjectContext } from "./project-context";

// Real AI generation for every module via Lovable AI Gateway
// (google/gemini-3-flash-preview, JSON object response). Each module has
// its own strict schema, so output is consistent across UI pages.

export type AIModuleKey = "market" | "consumer" | "localization" | "launch" | "report";

export type GenerateInput = {
  module: AIModuleKey;
  projectContext: ProjectContext;
  /** UI language for free-text fields. JSON keys stay English. */
  uiLocale?: "en" | "ko" | "zh";
  // Module-specific extras (e.g. existing job outputs feeding the report)
  extra?: Record<string, unknown>;
};

// JSON-safe value type used for serializable server-fn return values.
export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type GenerateResult = {
  summary: string;
  output_data: { [k: string]: JsonValue };
  provider: "lovable";
  model: string;
};

const MODEL = "google/gemini-3-flash-preview";

// Institutions / data vendors the AI tends to hallucinate as "sources".
// BridgeCN never queries any of these directly — if SEMrush isn't connected,
// the only honest label is "AI inference". This regex is used to scrub the
// `sources` array (and any per-KPI `src` field) before the result reaches UI.
const FAKE_SOURCE_RE = /(euromonitor|questmobile|iimedia|nielsen|tmall(\s+global)?\s+insights?|xiaohongshu.*(trend|report)|red\s+(trend|report)|sasa|sephora|hkrma|hong\s*kong\s+retail\s+management|kantar|mintel|statista|frost\s*&?\s*sullivan|china\s+national\s+bureau|national\s+bureau\s+of\s+statistics|baidu\s+index|douyin\s+(trend|report)|weibo\s+(trend|report)|l'?or[ée]al.*(review|annual))/i;

function isFakeSource(s: string): boolean {
  if (!s) return true;
  if (/^verified\s*·?\s*semrush/i.test(s)) return false;
  if (/^ai\s+(inference|estimate|strategic)/i.test(s)) return false;
  return FAKE_SOURCE_RE.test(s);
}

function sanitizeSources(value: unknown, hasSemrush: boolean, market: string): string[] {
  const arr = Array.isArray(value) ? value.filter((v) => typeof v === "string") as string[] : [];
  const cleaned = arr.filter((s) => !isFakeSource(s));
  if (cleaned.length === 0) {
    return hasSemrush
      ? [`Verified · SEMrush · ${market.toUpperCase()}`, "AI inference · category benchmark"]
      : ["AI inference · category benchmark"];
  }
  return cleaned;
}

function sanitizeKpiSrc(src: unknown, hasSemrush: boolean, market: string): string {
  const s = typeof src === "string" ? src : "";
  if (!s) return hasSemrush ? `AI inference (SEMrush ${market.toUpperCase()} unavailable for this metric)` : "AI inference · category benchmark";
  if (isFakeSource(s)) return "AI inference · category benchmark";
  return s;
}

function scrubOutput(parsed: { [k: string]: JsonValue }, hasSemrush: boolean, market: string): { [k: string]: JsonValue } {
  const out = { ...parsed };
  if ("sources" in out) {
    out.sources = sanitizeSources(out.sources, hasSemrush, market) as JsonValue;
  }
  if (Array.isArray(out.kpis)) {
    out.kpis = (out.kpis as JsonValue[]).map((k) => {
      if (k && typeof k === "object" && !Array.isArray(k)) {
        const obj = k as { [key: string]: JsonValue };
        return { ...obj, src: sanitizeKpiSrc(obj.src, hasSemrush, market) };
      }
      return k;
    }) as JsonValue;
  }
  return out;
}

function contextBrief(ctx: ProjectContext): string {
  const lines: string[] = [];
  if (ctx.company) lines.push(`Company: ${ctx.company}`);
  if (ctx.industry) lines.push(`Industry: ${ctx.industry}`);
  if (ctx.category) lines.push(`Category: ${ctx.category}`);
  if (ctx.targetMarket) lines.push(`Target market: ${ctx.targetMarket}`);
  if (ctx.targetAudience) lines.push(`Target audience: ${ctx.targetAudience}`);
  if (ctx.products.length) lines.push(`Products: ${ctx.products.slice(0, 12).join(", ")}`);
  if (ctx.competitors.length) lines.push(`Competitors: ${ctx.competitors.slice(0, 8).join(", ")}`);
  if (ctx.brandTone.length) lines.push(`Brand tone: ${ctx.brandTone.slice(0, 6).join(", ")}`);
  if (ctx.keywords.length) lines.push(`Existing keywords: ${ctx.keywords.slice(0, 12).join(", ")}`);
  if (ctx.brandStory) lines.push(`Brand story: ${ctx.brandStory.slice(0, 600)}`);
  if (ctx.marketingCopy) lines.push(`Existing marketing copy: ${ctx.marketingCopy.slice(0, 800)}`);
  if (ctx.website) lines.push(`Website: ${ctx.website}`);
  if (ctx.socialChannels.length) lines.push(`Social: ${ctx.socialChannels.map((s) => `${s.label} ${s.url}`).join(", ")}`);
  return lines.join("\n");
}

function localeName(loc?: string): string {
  if (loc === "zh") return "Simplified Chinese (简体中文)";
  if (loc === "ko") return "Korean (한국어)";
  return "English";
}

function schemaFor(module: AIModuleKey, uiLocale?: string): { system: string; user: string } {
  const lang = localeName(uiLocale);
  const common = `You are a senior market entry strategist. Ground every claim in the Project Context. Be specific to the company, category and target market provided — do NOT default to skincare or any unrelated category. If the project says "Beverage / Natural Mineral Water", write about mineral water, not beauty.

DATA INTEGRITY (CRITICAL):
- If a "SEMRUSH DATA" block is present, those numbers (organicTraffic, organicKeywords, volume, cpc, competition, competitor domains) are REAL data from SEMrush. Use them VERBATIM in KPIs and the keywords table — do NOT round or replace. Tag those entries with "src": "Verified · SEMrush · <market>".
- Anything NOT covered by SEMRUSH DATA is a strategic ESTIMATE. Numbers you invent MUST be tagged "src": "AI inference · category benchmark".
- SOURCES ARRAY RULE (ABSOLUTE): The "sources" array may contain ONLY these literal strings:
    1. "Verified · SEMrush · <market>"  ← only when SEMRUSH DATA is present
    2. "AI inference · category benchmark"
  You are FORBIDDEN from naming any third-party data vendor or research firm — including but not limited to: Euromonitor, QuestMobile, iiMedia, Nielsen, Kantar, Mintel, Statista, Frost & Sullivan, Tmall Insights, Tmall Global Insights, Xiaohongshu/Red trend reports, Sasa, Sephora, HKRMA, National Bureau of Statistics, Baidu Index, Douyin/Weibo trend reports, L'Oréal annual reviews. BridgeCN has NOT queried any of these. Naming them is a hallucination and will be stripped server-side.
- The FIRST sentence of "summary" MUST disclose provenance (translated to ${lang}):
  · With SEMRUSH DATA: "Note: KPIs and keyword volumes below are verified SEMrush data for the {market} market as of {today}; narrative and forecasts are AI strategic inference."
  · Without: "Note: The following analysis is an AI strategic inference based on your Knowledge Base and category benchmarks. Numbers are model inferences, not measurements. Click 'Refresh with SEMrush' on the China Market Insight page to ground numbers in verified data."

LANGUAGE: Write ALL free-text values (summary, sections, notes, labels, items, descriptions, signals, painPoints, purchaseDrivers, recommendations, risks, persona fields, channel roles, etc.) in ${lang}. Keep JSON KEYS in English. Keep proper nouns (brand names, platforms like Xiaohongshu/Tmall, regulators like NMPA/KFTC) in their original form.

Return ONLY a JSON object matching the schema. No prose, no markdown fences.`;

  if (module === "market") {
    return {
      system: common,
      user: `Generate a market insight for the project. Schema:
{
  "summary": string,                  // 3-4 paragraphs, concrete to this brand and target market
  "confidence": number,               // 0-100, reflects how much KB data was available
  "kpis": [                           // exactly 4 items
    { "label": string, "value": string, "sub": string, "src": string, "conf": number }
  ],
  "sources": string[],                // 4-8 named data sources relevant to the target market
  "keywords": [                       // 6-10 trending keywords for this category in this market
    { "k": string, "growth": string, "platform": string, "score": number }
  ],
  "regions": [                        // 4-6 cities/regions in the target market
    { "name": string, "v": number, "growth": string }
  ],
  "growth": [                         // 6-12 monthly growth index points
    { "m": string, "v": number }
  ]
}`,
    };
  }

  if (module === "consumer") {
    return {
      system: common,
      user: `Generate consumer insight. Schema:
{
  "summary": string,                  // 2-3 paragraphs about the audience and what drives them
  "confidence": number,               // 0-100
  "personas": [                       // 2-4 personas
    { "name": string, "age": string, "occupation": string, "needs": string[], "channels": string[] }
  ],
  "painPoints": string[],             // 4-7 ranked from most to least common
  "purchaseDrivers": string[],        // 4-7 ranked
  "channels": [                       // 4-7 where this audience discovers / buys in the target market
    { "name": string, "role": string }
  ],
  "signals": string[]                 // 5-10 short conversational signals (real phrases people use)
}`,
    };
  }

  if (module === "localization") {
    return {
      system: common,
      user: `Generate localized marketing copy for the target market. Schema:
{
  "summary": string,                  // 2 paragraphs explaining the localization approach
  "items": [                          // 4-8 segments
    { "source": string, "target": string, "note": string }
  ],
  "insights": {
    "reasoning": string,
    "consumer": string,
    "seo": string[],                  // 5-10 SEO keywords in target-market language
    "platform": string,
    "cultural": string
  },
  "compliance": {
    "advertising": string,            // pass/issue note vs local advertising rules
    "sensitive": string,
    "risk": "Low" | "Medium" | "High",
    "regulation": string
  },
  "scores": { "localization": number, "seo": number, "native": number, "platformMatch": number }
}`,
    };
  }

  if (module === "launch") {
    return {
      system: common,
      user: `Generate a launch checklist tailored to this project and target market. Schema:
{
  "summary": string,                  // 1 paragraph framing
  "phases": [                         // 3-5 phases
    {
      "key": string,                  // stable slug like "research", "localization", "launch"
      "name": string,
      "items": [                      // 3-6 items per phase
        { "key": string, "label": string }
      ]
    }
  ]
}`,
    };
  }

  // report
  return {
    system: common,
    user: `Compile an executive report. Schema:
{
  "title": string,
  "executiveSummary": string,         // 2-3 paragraphs
  "marketSection": string,            // 2-4 paragraphs
  "consumerSection": string,
  "localizationSection": string,
  "launchPlan": string,
  "risks": string[],                  // 3-6
  "recommendations": string[]         // 3-6 prioritized next steps
}`,
  };
}

async function callGateway(system: string, user: string): Promise<{ [k: string]: JsonValue }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    }),
  });
  if (res.status === 429) throw new Error("AI rate limit — please retry in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Plans & credits.");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 240)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content) as { [k: string]: JsonValue };
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]) as { [k: string]: JsonValue }; } catch { /* fall */ }
    }
    throw new Error("AI returned non-JSON content");
  }
}

export const generateAIOutput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: GenerateInput) => input)
  .handler(async ({ data }) => {
    const { module, projectContext, extra, uiLocale } = data;
    const { system, user: userTpl } = schemaFor(module, uiLocale);
    const ctxLines = contextBrief(projectContext);
    let extraBlock = "";
    let hasSemrush = false;
    let semrushMarket = "";
    if (extra && Object.keys(extra).length) {
      const sem = (extra as { semrush?: { market?: string; domainOverview?: unknown; keywords?: unknown[]; competitors?: unknown[] } }).semrush;
      if (sem && (sem.domainOverview || (sem.keywords && sem.keywords.length) || (sem.competitors && sem.competitors.length))) {
        hasSemrush = true;
        semrushMarket = sem.market || "";
        extraBlock = `\n\n--- SEMRUSH DATA (REAL, VERIFIED — USE VERBATIM) ---\n${JSON.stringify(sem).slice(0, 5000)}`;
      }
      const other = { ...(extra as Record<string, unknown>) };
      delete (other as Record<string, unknown>).semrush;
      if (Object.keys(other).length) {
        extraBlock += `\n\n--- ADDITIONAL CONTEXT ---\n${JSON.stringify(other).slice(0, 4000)}`;
      }
    }
    const userPrompt = `--- PROJECT CONTEXT ---\n${ctxLines}${extraBlock}\n\n--- TASK ---\n${userTpl}`;

    const raw = await callGateway(system, userPrompt);
    const parsed = scrubOutput(raw, hasSemrush, semrushMarket || "n/a");

    // Build a free-text summary that the existing UI streaming text uses.
    let summary = "";
    if (typeof parsed.summary === "string") summary = parsed.summary;
    else if (typeof parsed.executiveSummary === "string") summary = parsed.executiveSummary;

    const result: GenerateResult = {
      summary,
      output_data: parsed,
      provider: "lovable",
      model: MODEL,
    };
    return result;
  });
