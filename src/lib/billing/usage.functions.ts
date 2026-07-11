import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLAN_QUOTAS } from "./plans";
import { monthStartISO } from "./quota";

export type UsageStatus = {
  plan: "free" | "starter" | "pro";
  semrushUsed: number;
  semrushLimit: number;
  aiUsed: number;
  aiLimit: number;
  periodStart: string;
};

export const getUsageStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { workspaceId: string }) => data)
  .handler(async ({ data, context }): Promise<UsageStatus> => {
    const { resolvePlan } = await import("./quota.server");
    const plan = await resolvePlan(context.userId);
    const period = monthStartISO();
    const { data: row } = await context.supabase
      .from("usage_counters")
      .select("ai_calls, semrush_calls")
      .eq("workspace_id", data.workspaceId)
      .eq("period_start", period)
      .maybeSingle();
    const q = PLAN_QUOTAS[plan];
    return {
      plan,
      semrushUsed: (row?.semrush_calls as number | undefined) ?? 0,
      semrushLimit: q.semrushCalls,
      aiUsed: (row?.ai_calls as number | undefined) ?? 0,
      aiLimit: q.aiCalls,
      periodStart: period,
    };
  });