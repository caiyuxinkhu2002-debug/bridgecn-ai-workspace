import { PLAN_QUOTAS, type PlanKey } from "./plans";

export type QuotaKind = "aiCalls" | "semrushCalls" | "projects";

export class QuotaExceededError extends Error {
  constructor(
    public kind: QuotaKind,
    public plan: PlanKey,
    public used: number,
    public limit: number,
  ) {
    super(`Quota exceeded: ${kind} used ${used}/${limit} on ${plan} plan`);
    this.name = "QuotaExceededError";
  }
}

export function quotaColumn(kind: QuotaKind): string {
  if (kind === "aiCalls") return "ai_calls";
  if (kind === "semrushCalls") return "semrush_calls";
  return "projects_created";
}

export function quotaLimit(plan: PlanKey, kind: QuotaKind): number {
  const q = PLAN_QUOTAS[plan];
  if (kind === "aiCalls") return q.aiCalls;
  if (kind === "semrushCalls") return q.semrushCalls;
  return q.projects;
}

export function monthStartISO(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function isQuotaError(e: unknown): e is QuotaExceededError {
  if (e instanceof QuotaExceededError) return true;
  const msg = e instanceof Error ? e.message : String(e ?? "");
  return /Quota exceeded/i.test(msg);
}