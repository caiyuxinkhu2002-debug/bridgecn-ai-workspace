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

const SAMPLE_PARAGRAPHS = [
  "Based on the active project context, the China market shows strong demand in Tier 1 cities — particularly Shanghai and Hangzhou — with Xiaohongshu being the primary discovery channel.",
  "Recommended positioning leans into ingredient storytelling and heritage cues, paired with a clean, scientific tone that resonates with the 25–34 segment.",
  "Next steps include validating two hero SKUs through KOC seeding, then scaling to a Tmall flagship once the resonance signal stabilizes above 0.7.",
];

export const placeholderProvider: AIProvider = {
  id: "placeholder",
  label: "Placeholder (Architecture Preview)",
  async *run({ signal }) {
    const events: AIStreamEvent[] = [];
    try {
      for (const step of PHASE_SCRIPT) {
        await delay(step.ms, signal);
        yield { type: "phase", phase: step.phase, message: step.message };
      }
      // Stream tokens word-by-word so the UI can render progressive text.
      let acc = "";
      for (const para of SAMPLE_PARAGRAPHS) {
        const tokens = para.split(/(\s+)/);
        for (const tok of tokens) {
          await delay(25, signal);
          acc += tok;
          yield { type: "delta", text: tok };
        }
        acc += "\n\n";
        yield { type: "delta", text: "\n\n" };
      }
      yield { type: "phase", phase: "completed", message: "Completed" };
      yield { type: "done", output: acc.trim(), output_data: { provider: "placeholder", tokens: acc.split(/\s+/).length } };
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      const error = (e as Error)?.message ?? "Unknown provider error";
      events.push({ type: "error", error });
      yield { type: "error", error };
    }
  },
};