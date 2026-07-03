import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPaddleClient, type PaddleEnv } from "@/lib/paddle.server";
import { planFromProductId, PLAN_QUOTAS, type PlanKey } from "./plans";

export type CurrentPlan = {
  plan: PlanKey;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  environment: PaddleEnv;
  paddleSubscriptionId: string | null;
  paddleCustomerId: string | null;
  quotas: (typeof PLAN_QUOTAS)[PlanKey];
  usage: { aiCalls: number; semrushCalls: number; projectsCreated: number; periodStart: string };
};

function monthStartISO(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export const getCurrentPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { workspaceId: string; environment: PaddleEnv }) => input)
  .handler(async ({ data, context }): Promise<CurrentPlan> => {
    const sb = context.supabase;
    const { data: sub } = await sb
      .from("subscriptions")
      .select(
        "product_id, status, current_period_end, cancel_at_period_end, environment, paddle_subscription_id, paddle_customer_id",
      )
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();
    const isActive =
      sub &&
      ((["active", "trialing", "past_due"].includes(sub.status) &&
        (!sub.current_period_end || new Date(sub.current_period_end) > now)) ||
        (sub.status === "canceled" && sub.current_period_end && new Date(sub.current_period_end) > now));

    const plan: PlanKey = isActive ? planFromProductId(sub!.product_id) : "free";
    const period = monthStartISO();

    const { data: counter } = await sb
      .from("usage_counters")
      .select("ai_calls, semrush_calls, projects_created")
      .eq("workspace_id", data.workspaceId)
      .eq("period_start", period)
      .maybeSingle();

    return {
      plan,
      status: sub?.status ?? null,
      cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
      currentPeriodEnd: sub?.current_period_end ?? null,
      environment: data.environment,
      paddleSubscriptionId: sub?.paddle_subscription_id ?? null,
      paddleCustomerId: sub?.paddle_customer_id ?? null,
      quotas: PLAN_QUOTAS[plan],
      usage: {
        aiCalls: counter?.ai_calls ?? 0,
        semrushCalls: counter?.semrush_calls ?? 0,
        projectsCreated: counter?.projects_created ?? 0,
        periodStart: period,
      },
    };
  });

export const openCustomerPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: sub, error } = await context.supabase
      .from("subscriptions")
      .select("paddle_subscription_id, paddle_customer_id, environment")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sub) throw new Error("No subscription found");

    const paddle = getPaddleClient(sub.environment as PaddleEnv);
    const session = await paddle.customerPortalSessions.create(sub.paddle_customer_id, [
      sub.paddle_subscription_id,
    ]);
    return { url: session.urls.general.overview };
  });