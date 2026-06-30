import type { AIProvider, AIJobPhase, AIStreamEvent } from "../types";
import { type ProjectContext, deriveKeywords, describeBrand, targetMarketLabel } from "../project-context";

// Placeholder provider — emits the same event stream a real provider will,
// but every piece of output is derived from the injected ProjectContext.
// No hardcoded brand/category demo content is allowed here.

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const id = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(id); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
  });
}

const PHASE_SCRIPT: { phase: AIJobPhase; message: string; ms: number }[] = [
  { phase: "thinking", message: "Thinking…", ms: 600 },
  { phase: "searching", message: "Searching the China market knowledge base…", ms: 800 },
  { phase: "analyzing", message: "Analyzing relevant signals…", ms: 800 },
  { phase: "writing", message: "Writing the response…", ms: 400 },
];

const LOC_PHASE_SCRIPT: { phase: AIJobPhase; message: string; ms: number }[] = [
  { phase: "thinking",  message: "Thinking…",                          ms: 500 },
  { phase: "searching", message: "Analyzing Brand",                    ms: 700 },
  { phase: "analyzing", message: "Understanding Chinese Consumers",    ms: 800 },
  { phase: "writing",   message: "Rewriting",                          ms: 500 },
];

const MARKET_SOURCES = [
  "Xiaohongshu (小红书)",
  "Douyin (抖音)",
  "QuestMobile",
  "iiMedia Research",
  "National Bureau of Statistics of China",
  "Tmall Global Insights",
];

const MARKET_REGIONS = [
  { name: "Shanghai",  v: 94, growth: "+21.4%" },
  { name: "Beijing",   v: 88, growth: "+18.7%" },
  { name: "Hangzhou",  v: 76, growth: "+24.1%" },
  { name: "Shenzhen",  v: 71, growth: "+16.2%" },
  { name: "Guangzhou", v: 63, growth: "+12.8%" },
  { name: "Chengdu",   v: 58, growth: "+19.5%" },
];

const PLATFORM_ROTATION = ["Xiaohongshu", "Douyin", "Tmall", "Weibo", "WeChat", "JD.com"];
const GROWTH_ROTATION = ["+42%", "+35%", "+28%", "+24%", "+19%", "+14%"];
const SCORE_ROTATION = [96, 91, 87, 84, 78, 72];

function readContext(input: Record<string, unknown> | undefined): ProjectContext {
  const raw = (input?.projectContext ?? {}) as Partial<ProjectContext>;
  return {
    company: raw.company ?? "",
    industry: raw.industry ?? "",
    category: raw.category ?? "",
    products: raw.products ?? [],
    competitors: raw.competitors ?? [],
    website: raw.website ?? "",
    targetAudience: raw.targetAudience ?? "",
    targetMarket: raw.targetMarket ?? "",
    brandStory: raw.brandStory ?? "",
    brandTone: raw.brandTone ?? [],
    marketingCopy: raw.marketingCopy ?? "",
    keywords: raw.keywords ?? [],
    socialChannels: raw.socialChannels ?? [],
  };
}

function buildMarketKeywords(ctx: ProjectContext) {
  const kws = deriveKeywords(ctx, 6);
  return kws.map((k, i) => ({
    k,
    growth: GROWTH_ROTATION[i % GROWTH_ROTATION.length],
    platform: PLATFORM_ROTATION[i % PLATFORM_ROTATION.length],
    score: SCORE_ROTATION[i % SCORE_ROTATION.length],
  }));
}

function buildMarketParagraphs(ctx: ProjectContext): string[] {
  const brand = describeBrand(ctx);
  const market = targetMarketLabel(ctx);
  const cat = ctx.category || ctx.industry || "this category";
  const kws = deriveKeywords(ctx, 4).slice(0, 3).join(", ") || "the brand's core themes";
  const audience = ctx.targetAudience || "the 25–34 segment";
  const comp = ctx.competitors.slice(0, 2).join(" and ");
  return [
    `The ${cat} market in ${market} shows steady demand, with ${brand} positioned to capture share through differentiated product storytelling and channel mix.`,
    `Over the last 30 days, conversation around ${kws} has trended upward on Xiaohongshu and Douyin, signaling discovery momentum for ${cat} brands targeting ${audience}.`,
    comp
      ? `Competitive whitespace exists versus ${comp}: focus on the brand's distinctive proof points and seed via KOC before scaling paid channels.`
      : `Next step: validate hero offers through KOC seeding, then scale to a Tmall flagship once resonance stabilizes.`,
  ];
}

function buildGenericParagraphs(ctx: ProjectContext): string[] {
  const brand = describeBrand(ctx);
  const market = targetMarketLabel(ctx);
  const tone = ctx.brandTone.slice(0, 3).join(", ");
  const prods = ctx.products.slice(0, 3).join(", ");
  return [
    `Based on the ${brand} project context, the ${market} market shows demand patterns aligned with the brand's positioning and core product set.`,
    `Recommended positioning leans into the brand's defined tone${tone ? ` (${tone})` : ""}${prods ? ` and lead products: ${prods}` : ""}.`,
    `Next steps include validating hero offers through targeted seeding, then scaling once the signal stabilizes.`,
  ];
}

function buildLocItems(ctx: ProjectContext) {
  const company = ctx.company || "the brand";
  const cat = ctx.category || ctx.industry || "product";
  const products = ctx.products.length ? ctx.products : [cat];
  const market = targetMarketLabel(ctx);
  const source = ctx.marketingCopy
    ? ctx.marketingCopy.split(/\n+/).map((s) => s.trim()).filter(Boolean).slice(0, 3)
    : [
        `${company} — ${cat}`,
        products[0] ? `${products[0]} 신제품 라인업.` : `${company} 신제품.`,
        ctx.brandStory ? ctx.brandStory.split(/[.。!?]/)[0] : `${company} 브랜드 스토리.`,
      ];
  return source.map((s, i) => ({
    source: s,
    target: `${s} · 中文本地化版本 (for ${market})`,
    note: products[i] || `${cat} segment`,
  }));
}

function buildLocInsights(ctx: ProjectContext) {
  const kws = deriveKeywords(ctx, 5);
  const tone = ctx.brandTone.slice(0, 2).join(", ") || "premium";
  return {
    reasoning: `Rewrote source copy to feel native in ${targetMarketLabel(ctx)} while preserving the brand's ${tone} tone.`,
    consumer: ctx.targetAudience
      ? `Speaks to ${ctx.targetAudience} with culturally resonant phrasing and locally familiar references.`
      : `Adapted phrasing and references to local market norms.`,
    seo: kws,
    platform: `Tuned length, rhythm and CTA conventions for the selected channel.`,
    cultural: `Replaced source-language idioms with locally idiomatic equivalents; removed phrasing that doesn't translate cleanly.`,
  };
}

const LOC_COMPLIANCE = {
  advertising: "Pass — no superlatives requiring substantiation under SAMR ad rules.",
  sensitive: "No restricted terms detected (medical claims, '最', '第一' avoided).",
  risk: "Low",
  regulation: "Reviewed against relevant SAMR / industry guidance for imported goods in this category.",
};

const LOC_SCORES = { localization: 94, seo: 88, native: 92, platformMatch: 90 };

export const placeholderProvider: AIProvider = {
  id: "placeholder",
  label: "Placeholder (Architecture Preview)",
  async *run({ module, input, signal }) {
    const events: AIStreamEvent[] = [];
    const isMarket = module === "market";
    const isLoc = module === "localization";
    const ctx = readContext(input);
    const MARKET_KEYWORDS = buildMarketKeywords(ctx);
    const paragraphs = isMarket ? buildMarketParagraphs(ctx) : buildGenericParagraphs(ctx);
    const LOC_ITEMS = buildLocItems(ctx);
    const LOC_INSIGHTS = buildLocInsights(ctx);
    const script = isLoc ? LOC_PHASE_SCRIPT : PHASE_SCRIPT;
    try {
      for (const step of script) {
        await delay(step.ms, signal);
        yield { type: "phase", phase: step.phase, message: step.message };
        if (isMarket && step.phase === "searching") {
          for (const s of MARKET_SOURCES) {
            await delay(120, signal);
            yield { type: "data", data: { sourceAppend: s } };
          }
        }
        if (isMarket && step.phase === "analyzing") {
          yield { type: "data", data: { confidence: 78 } };
          await delay(200, signal);
          for (const r of MARKET_REGIONS) {
            await delay(80, signal);
            yield { type: "data", data: { regionAppend: r } };
          }
          for (const k of MARKET_KEYWORDS) {
            await delay(80, signal);
            yield { type: "data", data: { keywordAppend: k } };
          }
          yield { type: "data", data: { confidence: 92 } };
        }
        if (isLoc && step.phase === "analyzing") {
          await delay(150, signal);
          yield { type: "data", data: { insights: LOC_INSIGHTS } };
        }
      }
      if (isLoc) {
        for (const it of LOC_ITEMS) {
          await delay(220, signal);
          yield { type: "data", data: { itemAppend: it } };
        }
        await delay(180, signal);
        yield { type: "data", data: { compliance: LOC_COMPLIANCE } };
        await delay(120, signal);
        yield { type: "data", data: { scores: LOC_SCORES } };
      }
      let acc = "";
      for (const para of paragraphs) {
        const tokens = para.split(/(\s+)/);
        for (const tok of tokens) {
          await delay(25, signal);
          acc += tok;
          yield { type: "delta", text: tok };
        }
        acc += "\n\n";
        yield { type: "delta", text: "\n\n" };
      }
      if (isMarket) {
        yield { type: "data", data: { confidence: 96 } };
      }
      yield { type: "phase", phase: "completed", message: "Completed" };
      yield {
        type: "done",
        output: acc.trim(),
        output_data: isMarket
          ? {
              provider: "placeholder",
              summary: acc.trim(),
              confidence: 96,
              sources: MARKET_SOURCES,
              keywords: MARKET_KEYWORDS,
              regions: MARKET_REGIONS,
            }
          : isLoc
            ? {
                provider: "placeholder",
                summary: acc.trim(),
                items: LOC_ITEMS,
                insights: LOC_INSIGHTS,
                compliance: LOC_COMPLIANCE,
                scores: LOC_SCORES,
              }
            : { provider: "placeholder", tokens: acc.split(/\s+/).length },
      };
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      const error = (e as Error)?.message ?? "Unknown provider error";
      events.push({ type: "error", error });
      yield { type: "error", error };
    }
  },
};