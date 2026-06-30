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

    setState({ status: "queued", phase: null, output: "", error: null, job: null, isRunning: true });

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
          setState((s) => ({ ...s, job: ev.job, status: ev.job.status }));
        } else if (ev.type === "status") {
          setState((s) => ({ ...s, status: ev.status, phase: ev.phase ?? s.phase }));
        } else if (ev.type === "delta") {
          setState((s) => ({ ...s, output: ev.output }));
        } else if (ev.type === "completed") {
          finalJob = ev.job;
          setState((s) => ({ ...s, status: "completed", phase: "completed", job: ev.job, output: ev.job.output, isRunning: false }));
        } else if (ev.type === "failed") {
          setState((s) => ({ ...s, status: "failed", error: ev.error, job: ev.job ?? s.job, isRunning: false }));
        } else if (ev.type === "cancelled") {
          setState((s) => ({ ...s, status: "cancelled", job: ev.job ?? s.job, isRunning: false }));
        }
      }
    } catch (e) {
      setState((s) => ({ ...s, status: "failed", error: (e as Error)?.message || "Unknown error", isRunning: false }));
    }
    return finalJob;
  }, [user, activeWorkspace?.id, activeProject?.id]);

  const reset = useCallback(() => {
    setState({ status: "idle", phase: null, output: "", error: null, job: null, isRunning: false });
  }, []);

  return { ...state, run, cancel, reset };
}