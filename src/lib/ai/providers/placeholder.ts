import type { AIProvider, AIJobPhase, AIStreamEvent } from "../types";

// Placeholder provider — emits the same event stream a real provider will,
// so every downstream consumer (jobs table, UI, history) is exercised end-to-end
// without making a real API call yet. Swap to OpenAI/Claude/Gemini/etc later
// by adding a sibling module under `providers/` that exports the same shape.

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

const GENERIC_PARAGRAPHS = [
  "Based on the active project context, the China market shows strong demand in Tier 1 cities — particularly Shanghai and Hangzhou — with Xiaohongshu being the primary discovery channel.",
  "Recommended positioning leans into ingredient storytelling and heritage cues, paired with a clean, scientific tone that resonates with the 25–34 segment.",
  "Next steps include validating two hero SKUs through KOC seeding, then scaling to a Tmall flagship once the resonance signal stabilizes above 0.7.",
];

const MARKET_PARAGRAPHS = [
  "The K-beauty skincare market in China continues to grow at double-digit rates, driven by ingredient-focused consumers and accelerating demand in Tier-1 cities.",
  "Over the last 30 days, Xiaohongshu discussions around glass skin and sensitive skin care have increased significantly, while Douyin live commerce for Korean derma brands posted record GMV.",
  "Premium positioning at ¥350–¥450 basket size remains the strongest opportunity for new entrants targeting the 25–34 segment.",
];

const MARKET_SOURCES = [
  "Xiaohongshu (小红书)",
  "Douyin (抖音)",
  "QuestMobile",
  "iiMedia Research",
  "National Bureau of Statistics of China",
  "Tmall Global Insights",
];

const MARKET_KEYWORDS = [
  { k: "Glass Skin · 玻璃肌",         growth: "+42%", platform: "Xiaohongshu", score: 98 },
  { k: "Ingredient-led · 成分党",     growth: "+35%", platform: "Douyin",      score: 91 },
  { k: "Sensitive Skin · 敏感肌",     growth: "+28%", platform: "Xiaohongshu", score: 87 },
  { k: "K-beauty Routine · 韩系护肤", growth: "+27%", platform: "Weibo",       score: 84 },
  { k: "Morning C / Night A · 早C晚A", growth: "+19%", platform: "Douyin",     score: 78 },
  { k: "Clean Beauty · 纯净护肤",     growth: "+14%", platform: "Tmall",       score: 72 },
];

const MARKET_REGIONS = [
  { name: "Shanghai",  v: 94, growth: "+21.4%" },
  { name: "Beijing",   v: 88, growth: "+18.7%" },
  { name: "Hangzhou",  v: 76, growth: "+24.1%" },
  { name: "Shenzhen",  v: 71, growth: "+16.2%" },
  { name: "Guangzhou", v: 63, growth: "+12.8%" },
  { name: "Chengdu",   v: 58, growth: "+19.5%" },
];

export const placeholderProvider: AIProvider = {
  id: "placeholder",
  label: "Placeholder (Architecture Preview)",
  async *run({ module, signal }) {
    const events: AIStreamEvent[] = [];
    const isMarket = module === "market";
    const isLoc = module === "localization";
    const paragraphs = isMarket ? MARKET_PARAGRAPHS : GENERIC_PARAGRAPHS;
    const script = isLoc ? LOC_PHASE_SCRIPT : PHASE_SCRIPT;
    try {
      for (const step of script) {
        await delay(step.ms, signal);
        yield { type: "phase", phase: step.phase, message: step.message };
        if (isMarket && step.phase === "searching") {
          // Stream sources one-by-one so the UI can light them up progressively.
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
        if (isLoc) {
          if (step.phase === "analyzing") {
            const insights = {
              reasoning: "Replaced direct Korean phrasing with culturally resonant Chinese metaphors (e.g. 玻璃肌) to feel native rather than translated.",
              consumer: "Tier-1 Chinese consumers respond to ingredient storytelling and heritage cues; we lead with 韩方 and clinical proof points.",
              seo: ["玻璃肌", "敏感肌", "韩方护肤", "成分党", "早C晚A"],
              platform: "Tightened length and added emoji rhythm for Xiaohongshu; CTAs aligned with Tmall PDP conventions.",
              cultural: "Removed first-person Korean voice; added collective ‘姐妹们’ framing common in RED beauty content.",
            };
            await delay(150, signal);
            yield { type: "data", data: { insights } };
          }
        }
      }
      const LOC_ITEMS = [
          { source: "촉촉하고 깨끗한 스킨케어 라인업.",                  target: "清润舒缓的护肤体验 ✨ 姐妹们一试就爱。",                       note: "Hero claim · primary brand line" },
          { source: "민감한 피부를 위한 순한 클렌징 밤.",                target: "敏感肌也能放心用的温和洁颜膏,卸妆零负担。",                   note: "Sensitive skin product line" },
          { source: "비건 처방, 99% 자연유래 성분.",                     target: "纯素配方 · 99% 天然来源成分,成分党安心选。",                    note: "Ingredient story · ingredient-led consumers" },
      ];
      const LOC_INSIGHTS = {
        reasoning: "Replaced direct Korean phrasing with culturally resonant Chinese metaphors (e.g. 玻璃肌) to feel native rather than translated.",
        consumer: "Tier-1 Chinese consumers respond to ingredient storytelling and heritage cues; we lead with 韩方 and clinical proof points.",
        seo: ["玻璃肌", "敏感肌", "韩方护肤", "成分党", "早C晚A"],
        platform: "Tightened length and added emoji rhythm for Xiaohongshu; CTAs aligned with Tmall PDP conventions.",
        cultural: "Removed first-person Korean voice; added collective ‘姐妹们’ framing common in RED beauty content.",
      };
      const LOC_COMPLIANCE = {
        advertising: "Pass — no superlatives requiring substantiation under SAMR ad rules.",
        sensitive: "No restricted terms detected (medical claims, ‘最’, ‘第一’ avoided).",
        risk: "Low",
        regulation: "Compliant with NMPA cosmetic labeling guidance for imported skincare.",
      };
      const LOC_SCORES = { localization: 94, seo: 88, native: 92, platformMatch: 90 };
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
      // Stream tokens word-by-word so the UI can render progressive text.
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