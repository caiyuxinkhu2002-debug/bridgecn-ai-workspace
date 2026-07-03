export type PlanKey = "free" | "starter" | "pro";

export type Quotas = {
  projects: number;
  aiCalls: number;
  semrushCalls: number;
  seats: number;
  watermark: boolean;
  whiteLabel: boolean;
};

export const PLAN_QUOTAS: Record<PlanKey, Quotas> = {
  free: { projects: 1, aiCalls: 10, semrushCalls: 5, seats: 1, watermark: true, whiteLabel: false },
  starter: { projects: 5, aiCalls: 100, semrushCalls: 50, seats: 1, watermark: false, whiteLabel: false },
  pro: { projects: 20, aiCalls: 500, semrushCalls: 300, seats: 3, watermark: false, whiteLabel: true },
};

export function planFromProductId(productId: string | null | undefined): PlanKey {
  if (productId === "pro_plan") return "pro";
  if (productId === "starter_plan") return "starter";
  return "free";
}

export const PLAN_PRICES = {
  starter: { monthly: "starter_monthly", annual: "starter_annual", monthlyUsd: 49, annualUsd: 470 },
  pro: { monthly: "pro_monthly", annual: "pro_annual", monthlyUsd: 149, annualUsd: 1430 },
} as const;