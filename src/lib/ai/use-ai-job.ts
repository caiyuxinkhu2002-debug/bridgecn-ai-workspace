import { useCallback, useRef, useState } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { createAndRunJob, type CreateJobInput } from "./service";
import type { AIJob, AIJobPhase, AIModule } from "./types";

// React hook wrapping the AI service. Components call `run({ module, prompt })`
// and read live state: phase, streaming output, status, error, and the final
// persisted job record. Designed so every existing module page can opt-in
// without changing its layout.

export type UseAIJobState = {
  status: AIJob["status"] | "idle";
  phase: AIJobPhase | null;
  output: string;
  error: string | null;
  job: AIJob | null;
  isRunning: boolean;
  data: Record<string, unknown>;
  events: { ts: number; kind: "phase" | "data" | "delta" | "status"; label: string }[];
};

export function useAIJob() {
  const { activeWorkspace, activeProject, user } = useWorkspace();
  const [state, setState] = useState<UseAIJobState>({
    status: "idle",
    phase: null,
    output: "",
    error: null,
    job: null,
    isRunning: false,
    data: {},
    events: [],
  });
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const run = useCallback(async (req: { module: AIModule; prompt: string; input?: Record<string, unknown> }) => {
    if (!user || !activeWorkspace?.id) {
      setState((s) => ({ ...s, status: "failed", error: "No active workspace or user." }));
      return null;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState({ status: "queued", phase: null, output: "", error: null, job: null, isRunning: true, data: {}, events: [{ ts: Date.now(), kind: "status", label: "Queued" }] });

    const payload: CreateJobInput = {
      workspaceId: activeWorkspace.id,
      projectId: activeProject?.id || null,
      userId: user.id,
      module: req.module,
      prompt: req.prompt,
      input: req.input,
    };

    let finalJob: AIJob | null = null;
    try {
      for await (const ev of createAndRunJob(payload, ctrl.signal)) {
        if (ev.type === "created") {
          setState((s) => ({ ...s, job: ev.job, status: ev.job.status, events: [...s.events, { ts: Date.now(), kind: "status", label: `Job created` }] }));
        } else if (ev.type === "status") {
          setState((s) => ({
            ...s,
            status: ev.status,
            phase: ev.phase ?? s.phase,
            events: ev.phase
              ? [...s.events, { ts: Date.now(), kind: "phase", label: ev.label || phaseLabel(ev.phase) }]
              : s.events,
          }));
        } else if (ev.type === "delta") {
          setState((s) => ({ ...s, output: ev.output }));
        } else if (ev.type === "data") {
          setState((s) => {
            const data = mergeData(s.data, ev.data);
            const label = describeData(ev.data);
            return {
              ...s,
              data,
              events: label ? [...s.events, { ts: Date.now(), kind: "data", label }] : s.events,
            };
          });
        } else if (ev.type === "completed") {
          finalJob = ev.job;
          setState((s) => ({
            ...s,
            status: "completed",
            phase: "completed",
            job: ev.job,
            output: ev.job.output,
            isRunning: false,
            data: mergeData(s.data, (ev.job.output_data ?? {}) as Record<string, unknown>),
            events: [...s.events, { ts: Date.now(), kind: "status", label: "Completed" }],
          }));
        } else if (ev.type === "failed") {
          setState((s) => ({ ...s, status: "failed", error: ev.error, job: ev.job ?? s.job, isRunning: false, events: [...s.events, { ts: Date.now(), kind: "status", label: `Failed: ${ev.error}` }] }));
        } else if (ev.type === "cancelled") {
          setState((s) => ({ ...s, status: "cancelled", job: ev.job ?? s.job, isRunning: false, events: [...s.events, { ts: Date.now(), kind: "status", label: "Cancelled" }] }));
        }
      }
    } catch (e) {
      setState((s) => ({ ...s, status: "failed", error: (e as Error)?.message || "Unknown error", isRunning: false }));
    }
    return finalJob;
  }, [user, activeWorkspace?.id, activeProject?.id]);

  const reset = useCallback(() => {
    setState({ status: "idle", phase: null, output: "", error: null, job: null, isRunning: false, data: {}, events: [] });
  }, []);

  return { ...state, run, cancel, reset };
}

function phaseLabel(p: AIJobPhase): string {
  switch (p) {
    case "thinking": return "Thinking…";
    case "searching": return "Searching the China market knowledge base…";
    case "analyzing": return "Analyzing relevant signals…";
    case "writing": return "Writing the response…";
    case "completed": return "Completed";
  }
}

function mergeData(prev: Record<string, unknown>, next: Record<string, unknown>): Record<string, unknown> {
  const out = { ...prev };
  for (const [k, v] of Object.entries(next)) {
    if (k === "sourceAppend" && typeof v === "string") {
      const arr = (out.sources as string[] | undefined) ?? [];
      out.sources = arr.includes(v) ? arr : [...arr, v];
    } else if (k === "keywordAppend") {
      const arr = (out.keywords as unknown[] | undefined) ?? [];
      out.keywords = [...arr, v];
    } else if (k === "regionAppend") {
      const arr = (out.regions as unknown[] | undefined) ?? [];
      out.regions = [...arr, v];
    } else if (k === "itemAppend") {
      const arr = (out.items as unknown[] | undefined) ?? [];
      out.items = [...arr, v];
    } else {
      out[k] = v;
    }
  }
  return out;
}

function describeData(d: Record<string, unknown>): string | null {
  if ("sourceAppend" in d) return `Source indexed: ${String(d.sourceAppend)}`;
  if ("regionAppend" in d) {
    const r = d.regionAppend as { name?: string };
    return `Regional demand · ${r?.name ?? "region"}`;
  }
  if ("keywordAppend" in d) {
    const k = d.keywordAppend as { k?: string };
    return `Trending keyword · ${k?.k ?? "keyword"}`;
  }
  if ("confidence" in d) return `AI Confidence updated · ${String(d.confidence)}%`;
  if ("itemAppend" in d) {
    const it = d.itemAppend as { note?: string };
    return `Localized segment · ${it?.note ?? "ready"}`;
  }
  if ("insights" in d) return "Localization insights updated";
  if ("compliance" in d) return "Compliance check updated";
  if ("scores" in d) return "Localization scores updated";
  return null;
}