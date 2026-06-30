// Core types for the AI generation engine.
// All modules (Market, Consumer, Localization, Launch, Reports) go through this layer.

export type AIJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type AIJobPhase =
  | "thinking"
  | "searching"
  | "analyzing"
  | "writing"
  | "completed";

export type AIModule =
  | "market"
  | "consumer"
  | "localization"
  | "launch"
  | "reports"
  | "workspace";

export type AIProviderId =
  | "placeholder"
  | "openai"
  | "claude"
  | "gemini"
  | "openrouter"
  | "deepseek"
  | "qwen";

export type AIJob = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  user_id: string;
  module: AIModule;
  provider: AIProviderId;
  model: string | null;
  prompt: string;
  input: Record<string, unknown>;
  status: AIJobStatus;
  phase: AIJobPhase | null;
  output: string;
  output_data: Record<string, unknown> | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Provider streaming event contract. All providers MUST emit these.
export type AIStreamEvent =
  | { type: "phase"; phase: AIJobPhase; message?: string }
  | { type: "delta"; text: string }
  | { type: "data"; data: Record<string, unknown> }
  | { type: "done"; output: string; output_data?: Record<string, unknown> }
  | { type: "error"; error: string };

export type AIRunRequest = {
  module: AIModule;
  prompt: string;
  input?: Record<string, unknown>;
  model?: string;
  signal?: AbortSignal;
};

export type AIProvider = {
  id: AIProviderId;
  label: string;
  /** Stream events for a single run. Must be cancellable via the AbortSignal. */
  run(req: AIRunRequest): AsyncGenerator<AIStreamEvent, void, unknown>;
};