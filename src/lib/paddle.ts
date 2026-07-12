import { resolvePaddlePrice } from "@/lib/billing/payments.functions";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle: any;
  }
}

export function getPaddleEnvironment(): "sandbox" | "live" {
  return clientToken?.startsWith("test_") ? "sandbox" : "live";
}

/**
 * Whether the currently-configured payments environment is ready to accept
 * real customer charges. Test mode is always "ready" (safe to open checkout).
 * Live mode requires Paddle account verification + domain approval to be
 * complete; until then, opening checkout returns an error. Gate with the
 * `VITE_PAYMENTS_LIVE_READY` flag (set to "true" after Paddle final review).
 */
export function isLivePaymentsReady(): boolean {
  if (getPaddleEnvironment() === "sandbox") return true;
  return (import.meta.env.VITE_PAYMENTS_LIVE_READY as string | undefined) === "true";
}

let paddleInitialized = false;

export async function initializePaddle(): Promise<void> {
  if (paddleInitialized) return;
  if (!clientToken) throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set");

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      const paddleJsEnv = getPaddleEnvironment() === "sandbox" ? "sandbox" : "production";
      window.Paddle.Environment.set(paddleJsEnv);
      window.Paddle.Initialize({ token: clientToken });
      paddleInitialized = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function getPaddlePriceId(priceId: string): Promise<string> {
  const environment = getPaddleEnvironment();
  return resolvePaddlePrice({ data: { priceId, environment } });
}