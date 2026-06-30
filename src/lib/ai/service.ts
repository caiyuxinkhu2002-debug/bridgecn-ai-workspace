import { supabase } from "@/integrations/supabase/client";
import { getProvider, getDefaultProviderId } from "./providers";
import type { AIJob, AIJobPhase, AIModule, AIProviderId, AIStreamEvent } from "./types";

// Central AI service. Every module (Market, Consumer, Localization, Launch,
// Reports) goes through createAndRunJob(). The service:
//   1. Creates a `queued` job row in Supabase scoped to workspace/project/user/module
//   2. Picks a provider via the registry (placeholder for now)
//   3. Streams events back to the caller while persisting status/phase/output
//   4. Marks the row `completed` / `failed` / `cancelled` and stores the result

export type CreateJobInput = {
  workspaceId: string;
  projectId?: string | null;
  userId: string;
  module: AIModule;
  prompt: string;
  input?: Record<string, unknown>;
  provider?: AIProviderId;
  model?: string;
};

export type AIJobEvent =
  | { type: "created"; job: AIJob }
  | { type: "status"; status: AIJob["status"]; phase?: AIJobPhase | null; label?: string }
  | { type: "delta"; text: string; output: string }
  | { type: "data"; data: Record<string, unknown> }
  | { type: "completed"; job: AIJob }
  | { type: "failed"; error: string; job: AIJob | null }
  | { type: "cancelled"; job: AIJob | null };

type DbAIJob = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  user_id: string;
  module: string;
  provider: string;
  model: string | null;
  prompt: string;
  input: Record<string, unknown> | null;
  status: AIJob["status"];
  phase: string | null;
  output: string | null;
  output_data: Record<string, unknown> | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

function fromDb(r: DbAIJob): AIJob {
  return {
    id: r.id,
    workspace_id: r.workspace_id,
    project_id: r.project_id,
    user_id: r.user_id,
    module: r.module as AIModule,
    provider: r.provider as AIProviderId,
    model: r.model,
    prompt: r.prompt,
    input: (r.input ?? {}) as Record<string, unknown>,
    status: r.status,
    phase: (r.phase as AIJobPhase | null) ?? null,
    output: r.output ?? "",
    output_data: r.output_data,
    error: r.error,
    started_at: r.started_at,
    completed_at: r.completed_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// Throttle DB writes for streaming deltas — we don't want a row update per token.
const PERSIST_INTERVAL_MS = 600;

export async function* createAndRunJob(
  input: CreateJobInput,
  signal?: AbortSignal,
): AsyncGenerator<AIJobEvent, void, unknown> {
  // table is generated in supabase types after the migration; cast is intentional.
  const sb = supabase as unknown as {
    from: (t: string) => {
      insert: (v: Record<string, unknown>) => { select: (q: string) => { maybeSingle: () => Promise<{ data: DbAIJob | null; error: { message: string } | null }> } };
      update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => { select: (q: string) => { maybeSingle: () => Promise<{ data: DbAIJob | null; error: { message: string } | null }> } } & Promise<{ data: unknown; error: { message: string } | null }> };
      select: (q: string) => { eq: (c: string, v: string) => { order: (c: string, opts: { ascending: boolean }) => Promise<{ data: DbAIJob[] | null; error: { message: string } | null }> } & { maybeSingle: () => Promise<{ data: DbAIJob | null; error: { message: string } | null }> } };
    };
  };

  const providerId = input.provider || getDefaultProviderId();
  const provider = getProvider(providerId);

  // 1) create job row (status=queued)
  const createRes = await sb
    .from("ai_jobs")
    .insert({
      workspace_id: input.workspaceId,
      project_id: input.projectId ?? null,
      user_id: input.userId,
      module: input.module,
      provider: providerId,
      model: input.model ?? null,
      prompt: input.prompt,
      input: input.input ?? {},
      status: "queued",
    })
    .select("*")
    .maybeSingle();
  if (createRes.error || !createRes.data) {
    yield { type: "failed", error: createRes.error?.message || "Could not create job", job: null };
    return;
  }
  let job = fromDb(createRes.data);
  yield { type: "created", job };

  // 2) mark running
  await sb.from("ai_jobs").update({ status: "running", phase: "thinking", started_at: new Date().toISOString() }).eq("id", job.id);
  job = { ...job, status: "running", phase: "thinking", started_at: new Date().toISOString() };
  yield { type: "status", status: "running", phase: "thinking" };

  let output = "";
  let outputData: Record<string, unknown> | null = null;
  let lastPersist = Date.now();

  try {
    const stream = provider.run({ module: input.module, prompt: input.prompt, input: input.input, model: input.model, signal });
    for await (const ev of stream as AsyncGenerator<AIStreamEvent>) {
      if (signal?.aborted) break;
      if (ev.type === "phase") {
        await sb.from("ai_jobs").update({ phase: ev.phase }).eq("id", job.id);
        yield { type: "status", status: "running", phase: ev.phase, label: ev.message };
      } else if (ev.type === "delta") {
        output += ev.text;
        yield { type: "delta", text: ev.text, output };
        if (Date.now() - lastPersist > PERSIST_INTERVAL_MS) {
          lastPersist = Date.now();
          await sb.from("ai_jobs").update({ output }).eq("id", job.id);
        }
      } else if (ev.type === "data") {
        outputData = { ...(outputData ?? {}), ...ev.data };
        yield { type: "data", data: ev.data };
      } else if (ev.type === "done") {
        output = ev.output || output;
        if (ev.output_data) outputData = { ...(outputData ?? {}), ...ev.output_data };
      } else if (ev.type === "error") {
        throw new Error(ev.error);
      }
    }

    if (signal?.aborted) {
      const cancelled = await sb
        .from("ai_jobs")
        .update({ status: "cancelled", output, completed_at: new Date().toISOString() })
        .eq("id", job.id)
        .select("*")
        .maybeSingle();
      yield { type: "cancelled", job: cancelled.data ? fromDb(cancelled.data) : null };
      return;
    }

    const completed = await sb
      .from("ai_jobs")
      .update({
        status: "completed",
        phase: "completed",
        output,
        output_data: outputData,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .select("*")
      .maybeSingle();
    yield { type: "completed", job: completed.data ? fromDb(completed.data) : { ...job, status: "completed", phase: "completed", output, output_data: outputData, completed_at: new Date().toISOString() } };
  } catch (e) {
    const msg = (e as Error)?.message || "Unknown error";
    const failed = await sb
      .from("ai_jobs")
      .update({ status: "failed", error: msg, output, completed_at: new Date().toISOString() })
      .eq("id", job.id)
      .select("*")
      .maybeSingle();
    yield { type: "failed", error: msg, job: failed.data ? fromDb(failed.data) : null };
  }
}

// History helpers

export async function listJobs(opts: { workspaceId: string; projectId?: string | null; module?: AIModule; limit?: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = (supabase as unknown as { from: (t: string) => any }).from("ai_jobs").select("*").eq("workspace_id", opts.workspaceId);
  if (opts.projectId) q = q.eq("project_id", opts.projectId);
  if (opts.module) q = q.eq("module", opts.module);
  q = q.order("created_at", { ascending: false }).limit(opts.limit ?? 50);
  const { data, error } = (await q) as { data: DbAIJob[] | null; error: { message: string } | null };
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromDb);
}

export async function getJob(id: string): Promise<AIJob | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await ((supabase as unknown as { from: (t: string) => any }).from("ai_jobs").select("*").eq("id", id).maybeSingle()) as { data: DbAIJob | null; error: { message: string } | null };
  if (res.error) throw new Error(res.error.message);
  return res.data ? fromDb(res.data) : null;
}

export async function deleteJob(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await ((supabase as unknown as { from: (t: string) => any }).from("ai_jobs").delete().eq("id", id)) as { error: { message: string } | null };
  if (res.error) throw new Error(res.error.message);
}