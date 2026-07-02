import type { AIProvider, AIJobPhase, AIStreamEvent } from "../types";
import { generateAIOutput } from "../generate.functions";
import type { ProjectContext } from "../project-context";
import { placeholderProvider } from "./placeholder";

// Real provider: calls the Lovable AI Gateway (via a server function) and
// emits the same phase/data/done event stream the placeholder provider
// does, so every existing module page keeps working without changes.
//
// On any failure (network, 429, 402, schema error) we transparently fall
// back to the placeholder provider so the UI is never blank.

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

const PHASES: { phase: AIJobPhase; message: string; ms: number }[] = [
  { phase: "thinking", message: "Thinking…", ms: 300 },
  { phase: "searching", message: "Reading project Knowledge Base…", ms: 350 },
  { phase: "analyzing", message: "Analyzing market signals…", ms: 400 },
  { phase: "writing", message: "Writing response…", ms: 200 },
];

type SubmoduleMap = Record<string, "market" | "consumer" | "localization" | "launch" | "report">;
const MODULE_TO_SUB: SubmoduleMap = {
  market: "market",
  consumer: "consumer",
  localization: "localization",
  launch: "launch",
  reports: "report",
  workspace: "market",
};

export const lovableProvider: AIProvider = {
  id: "lovable",
  label: "Lovable AI (Gemini)",
  async *run({ module, input, signal, prompt }) {
    const ctx = (input?.projectContext ?? {}) as ProjectContext;
    const sub = MODULE_TO_SUB[module] ?? "market";
    const uiLocale = input?.uiLocale as "en" | "ko" | "zh" | undefined;

    // Phases for visual feedback while the real call is in flight.
    const callPromise = generateAIOutput({
      data: {
        module: sub,
        projectContext: ctx,
        uiLocale,
        extra: input?.extra as Record<string, unknown> | undefined,
      },
    });

    try {
      for (const step of PHASES) {
        if (signal?.aborted) return;
        yield { type: "phase", phase: step.phase, message: step.message };
        await delay(step.ms, signal);
      }
      const result = await callPromise;
      if (signal?.aborted) return;

      const out = (result.output_data ?? {}) as Record<string, unknown>;

      // Emit structured data events so existing pages light up immediately.
      const dataEvents: Record<string, unknown> = {};
      for (const key of [
        "confidence",
        "kpis",
        "sources",
        "keywords",
        "regions",
        "growth",
        "personas",
        "painPoints",
        "purchaseDrivers",
        "channels",
        "signals",
        "items",
        "insights",
        "compliance",
        "scores",
        "phases",
        "title",
        "executiveSummary",
        "marketSection",
        "consumerSection",
        "localizationSection",
        "launchPlan",
        "risks",
        "recommendations",
      ]) {
        if (key in out) dataEvents[key] = out[key];
      }
      if (Object.keys(dataEvents).length) {
        yield { type: "data", data: dataEvents };
      }

      // Stream the summary text so the typing animation feels real.
      const summary = result.summary || "";
      if (summary) {
        const tokens = summary.split(/(\s+)/);
        for (const tok of tokens) {
          if (signal?.aborted) return;
          await delay(8, signal);
          yield { type: "delta", text: tok };
        }
      }

      yield { type: "phase", phase: "completed", message: "Completed" };
      yield {
        type: "done",
        output: summary,
        output_data: { ...out, provider: "lovable", model: result.model },
      };
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      const errMsg = (e as Error)?.message || "AI generation failed";
      // Fallback: degrade to placeholder so the user sees something useful.
      console.warn("[lovable provider] falling back to placeholder:", errMsg);
      const fallback: AsyncGenerator<AIStreamEvent> = placeholderProvider.run({
        module,
        input,
        signal,
        prompt,
      });
      for await (const ev of fallback) {
        if (ev.type === "done") {
          const od = (ev.output_data ?? {}) as Record<string, unknown>;
          yield {
            type: "done",
            output: ev.output,
            output_data: { ...od, provider: "placeholder", fallback: true, error: errMsg },
          };
        } else {
          yield ev;
        }
      }
    }
  },
};
