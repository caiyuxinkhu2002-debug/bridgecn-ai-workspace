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
    const paragraphs = isMarket ? MARKET_PARAGRAPHS : GENERIC_PARAGRAPHS;
    try {
      for (const step of PHASE_SCRIPT) {
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