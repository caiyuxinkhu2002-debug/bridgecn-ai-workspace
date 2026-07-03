import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, ArrowUpRight, ExternalLink, Sparkles } from "lucide-react";
import {
  getCurrentPlan,
  openCustomerPortal,
  type CurrentPlan,
} from "@/lib/billing/subscription.functions";
import { PLAN_QUOTAS, PLAN_PRICES, type PlanKey } from "@/lib/billing/plans";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useWorkspace } from "@/lib/workspace-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const PLAN_ORDER: PlanKey[] = ["free", "starter", "pro"];
const PLAN_LABEL: Record<PlanKey, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

function fmt(v: number) {
  return new Intl.NumberFormat("en-US").format(v);
}

function Bar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const over = used >= limit;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
      <div
        className={`h-full transition-all ${over ? "bg-red-500" : "bg-[var(--primary)]"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function BillingTab() {
  const { activeWorkspace } = useWorkspace();
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const env = getPaddleEnvironment();
  const getCurrentPlanFn = useServerFn(getCurrentPlan);
  const openPortalFn = useServerFn(openCustomerPortal);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const q = useQuery<CurrentPlan | null>({
    queryKey: ["billing.currentPlan", activeWorkspace?.id, env],
    enabled: !!activeWorkspace?.id,
    queryFn: () =>
      activeWorkspace?.id
        ? getCurrentPlanFn({ data: { workspaceId: activeWorkspace.id, environment: env } })
        : Promise.resolve(null),
  });

  const cp = q.data;
  const currentPlan: PlanKey = cp?.plan ?? "free";

  async function upgrade(target: "starter" | "pro") {
    if (!userId || !activeWorkspace?.id) {
      toast.error("Please sign in first.");
      return;
    }
    const priceId = interval === "monthly" ? PLAN_PRICES[target].monthly : PLAN_PRICES[target].annual;
    try {
      await openCheckout({
        priceId,
        customerEmail: email ?? undefined,
        customData: { userId, workspaceId: activeWorkspace.id },
      });
    } catch (e) {
      toast.error((e as Error).message || "Could not open checkout.");
    }
  }

  async function managePortal() {
    try {
      const { url } = await openPortalFn();
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message || "Could not open portal.");
    }
  }

  return (
    <div className="space-y-6">
      <PaymentTestModeBanner />

      {/* Current plan + usage */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              Current plan
            </div>
            <div className="mt-1 flex items-center gap-2 text-2xl font-semibold">
              {PLAN_LABEL[currentPlan]}
              {cp?.cancelAtPeriodEnd && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Cancels at period end
                </span>
              )}
            </div>
            {cp?.currentPeriodEnd && (
              <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                Renews {new Date(cp.currentPeriodEnd).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {currentPlan !== "free" && (
              <Button variant="outline" size="sm" onClick={managePortal}>
                Manage subscription <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Usage bars */}
        {cp && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium">AI generations</span>
                <span className="text-[var(--muted-foreground)]">
                  {fmt(cp.usage.aiCalls)} / {fmt(cp.quotas.aiCalls)}
                </span>
              </div>
              <Bar used={cp.usage.aiCalls} limit={cp.quotas.aiCalls} />
            </div>
            <div>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium">SEMrush queries</span>
                <span className="text-[var(--muted-foreground)]">
                  {fmt(cp.usage.semrushCalls)} / {fmt(cp.quotas.semrushCalls)}
                </span>
              </div>
              <Bar used={cp.usage.semrushCalls} limit={cp.quotas.semrushCalls} />
            </div>
            <div>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium">Projects this month</span>
                <span className="text-[var(--muted-foreground)]">
                  {fmt(cp.usage.projectsCreated)} / {fmt(cp.quotas.projects)}
                </span>
              </div>
              <Bar used={cp.usage.projectsCreated} limit={cp.quotas.projects} />
            </div>
          </div>
        )}
      </div>

      {/* Plans */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Plans</div>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Payments handled by our provider — cancel anytime.
            </p>
          </div>
          <div className="inline-flex overflow-hidden rounded-full border border-[var(--border)] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={`rounded-full px-3 py-1 font-medium transition ${
                interval === "monthly"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)]"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("annual")}
              className={`rounded-full px-3 py-1 font-medium transition ${
                interval === "annual"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)]"
              }`}
            >
              Annual · 2 months free
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {PLAN_ORDER.map((p) => {
            const q = PLAN_QUOTAS[p];
            const isCurrent = currentPlan === p;
            const price =
              p === "free"
                ? { amount: 0, sub: "Forever" }
                : interval === "monthly"
                  ? { amount: PLAN_PRICES[p].monthlyUsd, sub: "/month" }
                  : { amount: Math.round(PLAN_PRICES[p].annualUsd / 12), sub: "/month, billed yearly" };
            return (
              <div
                key={p}
                className={`rounded-xl border p-5 ${
                  isCurrent
                    ? "border-[var(--primary)] bg-[var(--primary-soft)]/40"
                    : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <div className="text-base font-semibold">{PLAN_LABEL[p]}</div>
                  {p === "pro" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary-foreground)]">
                      <Sparkles className="h-3 w-3" /> Popular
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-bold">${price.amount}</span>
                  <span className="ml-1 text-xs text-[var(--muted-foreground)]">{price.sub}</span>
                </div>
                <ul className="mt-4 space-y-2 text-xs">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[var(--primary)]" />
                    {fmt(q.projects)} projects
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[var(--primary)]" />
                    {fmt(q.aiCalls)} AI generations / month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[var(--primary)]" />
                    {fmt(q.semrushCalls)} SEMrush queries / month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[var(--primary)]" />
                    {fmt(q.seats)} team seat{q.seats > 1 ? "s" : ""}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[var(--primary)]" />
                    {q.whiteLabel ? "PDF export + brand white-label" : q.watermark ? "PDF export (with watermark)" : "PDF export (no watermark)"}
                  </li>
                </ul>
                <div className="mt-5">
                  {p === "free" ? (
                    <Button variant="outline" size="sm" disabled className="w-full">
                      {isCurrent ? "Current plan" : "Included by default"}
                    </Button>
                  ) : isCurrent ? (
                    <Button variant="outline" size="sm" onClick={managePortal} className="w-full">
                      Manage <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => upgrade(p as "starter" | "pro")}
                      disabled={checkoutLoading || !userId}
                      className="w-full"
                    >
                      Upgrade to {PLAN_LABEL[p]} <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}