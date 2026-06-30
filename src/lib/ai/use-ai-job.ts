import { useCallback, useRef, useState } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { createAndRunJob, type CreateJobInput } from "./service";
import type { AIJob, AIJobPhase, AIModule } from "./types";
import { buildProjectContext } from "./project-context";

// AI activity event. Carries an i18n key + params so the UI can re-translate
// instantly when the user switches language. `fallback` is the raw provider
// label used when no key is present.
export type AIJobEventItem = {
  ts: number;
  kind: "phase" | "data" | "delta" | "status";
  phase?: AIJobPhase;
  key?: string;
  params?: Record<string, string | number>;
  fallback?: string;
};

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
  events: AIJobEventItem[];
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

    setState({
      status: "queued",
      phase: null,
      output: "",
      error: null,
      job: null,
      isRunning: true,
      data: {},
      events: [{ ts: Date.now(), kind: "status", key: "ai.event.queued" }],
    });

    // Build a shared ProjectContext from the active project Knowledge Base
    // and auto-inject it into every AI job. Providers MUST derive output
    // from this object — no hardcoded brand/category data.
    const projectContext = buildProjectContext(activeProject);

    const payload: CreateJobInput = {
      workspaceId: activeWorkspace.id,
      projectId: activeProject?.id || null,
      userId: user.id,
      module: req.module,
      prompt: req.prompt,
      input: { ...(req.input ?? {}), projectContext },
    };

    let finalJob: AIJob | null = null;
    try {
      for await (const ev of createAndRunJob(payload, ctrl.signal)) {
        if (ev.type === "created") {
          setState((s) => ({
            ...s,
            job: ev.job,
            status: ev.job.status,
            events: [...s.events, { ts: Date.now(), kind: "status", key: "ai.event.jobCreated" }],
          }));
        } else if (ev.type === "status") {
          setState((s) => ({
            ...s,
            status: ev.status,
            phase: ev.phase ?? s.phase,
            events: ev.phase
              ? [...s.events, { ts: Date.now(), kind: "phase", phase: ev.phase, fallback: ev.label }]
              : s.events,
          }));
        } else if (ev.type === "delta") {
          setState((s) => ({ ...s, output: ev.output }));
        } else if (ev.type === "data") {
          setState((s) => {
            const data = mergeData(s.data, ev.data);
            const ev2 = describeData(ev.data);
            return {
              ...s,
              data,
              events: ev2 ? [...s.events, { ts: Date.now(), kind: "data", ...ev2 }] : s.events,
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
            events: [...s.events, { ts: Date.now(), kind: "status", key: "ai.event.completed" }],
          }));
        } else if (ev.type === "failed") {
          setState((s) => ({
            ...s,
            status: "failed",
            error: ev.error,
            job: ev.job ?? s.job,
            isRunning: false,
            events: [...s.events, { ts: Date.now(), kind: "status", key: "ai.event.failed", params: { v: ev.error }, fallback: ev.error }],
          }));
        } else if (ev.type === "cancelled") {
          setState((s) => ({
            ...s,
            status: "cancelled",
            job: ev.job ?? s.job,
            isRunning: false,
            events: [...s.events, { ts: Date.now(), kind: "status", key: "ai.event.cancelled" }],
          }));
        }
      }
    } catch (e) {
      setState((s) => ({ ...s, status: "failed", error: (e as Error)?.message || "Unknown error", isRunning: false }));
    }
    return finalJob;
  }, [user, activeWorkspace?.id, activeProject]);

  const reset = useCallback(() => {
    setState({ status: "idle", phase: null, output: "", error: null, job: null, isRunning: false, data: {}, events: [] });
  }, []);

  return { ...state, run, cancel, reset };
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

function describeData(d: Record<string, unknown>): Pick<AIJobEventItem, "key" | "params" | "fallback"> | null {
  if ("sourceAppend" in d) return { key: "ai.event.sourceIndexed", params: { v: String(d.sourceAppend) } };
  if ("regionAppend" in d) {
    const r = d.regionAppend as { name?: string };
    return { key: "ai.event.regionalDemand", params: { v: r?.name ?? "" } };
  }
  if ("keywordAppend" in d) {
    const k = d.keywordAppend as { k?: string };
    return { key: "ai.event.trendingKeyword", params: { v: k?.k ?? "" } };
  }
  if ("confidence" in d) return { key: "ai.event.confidenceUpdated", params: { v: String(d.confidence) } };
  if ("itemAppend" in d) {
    const it = d.itemAppend as { note?: string };
    return { key: "ai.event.localizedSegment", params: { v: it?.note ?? "" } };
  }
  if ("insights" in d) return { key: "ai.event.insightsUpdated" };
  if ("compliance" in d) return { key: "ai.event.complianceUpdated" };
  if ("scores" in d) return { key: "ai.event.scoresUpdated" };
  return null;
}