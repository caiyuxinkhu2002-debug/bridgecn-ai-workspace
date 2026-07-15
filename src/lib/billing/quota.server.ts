import { planFromProductId, type PlanKey } from "./plans";
import { monthStartISO, quotaColumn, quotaLimit, QuotaExceededError, type QuotaKind } from "./quota";

function resolvedEnvForServer(): "sandbox" | "live" {
  const token = process.env.VITE_PAYMENTS_CLIENT_TOKEN || "";
  return token.startsWith("test_") ? "sandbox" : "live";
}

export async function resolvePlan(userId: string): Promise<PlanKey> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const env = resolvedEnvForServer();
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("product_id, status, current_period_end")
    .eq("user_id", userId)
    .eq("environment", env)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub) return "free";
  const now = new Date();
  const active =
    (["active", "trialing", "past_due"].includes(sub.status as string) &&
      (!sub.current_period_end || new Date(sub.current_period_end as string) > now)) ||
    (sub.status === "canceled" &&
      sub.current_period_end &&
      new Date(sub.current_period_end as string) > now);
  return active ? planFromProductId(sub.product_id as string) : "free";
}

export async function checkAndIncrement(opts: {
  userId: string;
  workspaceId: string;
  kind: QuotaKind;
  by?: number;
}): Promise<{ plan: PlanKey; used: number; limit: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const by = opts.by ?? 1;
  const plan = await resolvePlan(opts.userId);
  const limit = quotaLimit(plan, opts.kind);
  const col = quotaColumn(opts.kind);
  const period = monthStartISO();

  await supabaseAdmin
    .from("usage_counters")
    .upsert(
      {
        workspace_id: opts.workspaceId,
        period_start: period,
        ai_calls: 0,
        semrush_calls: 0,
        projects_created: 0,
        kol_crawls: 0,
      },
      { onConflict: "workspace_id,period_start", ignoreDuplicates: true },
    );

  const { data: row, error: readErr } = await supabaseAdmin
    .from("usage_counters")
    .select(`id, ${col}`)
    .eq("workspace_id", opts.workspaceId)
    .eq("period_start", period)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  const currentUsed = ((row as unknown as Record<string, number>)?.[col] ?? 0) as number;

  if (currentUsed + by > limit) {
    throw new QuotaExceededError(opts.kind, plan, currentUsed, limit);
  }

  const nextValue = currentUsed + by;
  const { error: updErr } = await supabaseAdmin
    .from("usage_counters")
    .update({ [col]: nextValue } as never)
    .eq("workspace_id", opts.workspaceId)
    .eq("period_start", period);
  if (updErr) throw new Error(updErr.message);

  return { plan, used: nextValue, limit };
}