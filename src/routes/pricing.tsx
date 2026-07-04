import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { PLAN_QUOTAS, PLAN_PRICES } from "@/lib/billing/plans";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — BridgeCN AI Market Entry Workspace" },
      {
        name: "description",
        content:
          "Simple pricing for Korean and Japanese brands entering China. Real SEMrush data, AI market insight, localized copy, launch checklists — from $49/month.",
      },
      { property: "og:title", content: "BridgeCN AI — Pricing" },
      {
        property: "og:description",
        content:
          "Simple pricing for Korean and Japanese brands entering China. From $49/month.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://bridgecn-ai-workspace.lovable.app/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "BridgeCN AI — Pricing" },
      {
        name: "twitter:description",
        content:
          "Simple pricing for Korean and Japanese brands entering China. From $49/month.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://bridgecn-ai-workspace.lovable.app/pricing" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "BridgeCN AI Workspace",
          description:
            "AI market entry workspace for Korean and Japanese brands expanding into China.",
          brand: { "@type": "Brand", name: "BridgeCN AI" },
          offers: [
            {
              "@type": "Offer",
              name: "Starter",
              price: PLAN_PRICES.starter.monthlyUsd,
              priceCurrency: "USD",
              url: "https://bridgecn-ai-workspace.lovable.app/pricing",
              category: "SaaS subscription",
            },
            {
              "@type": "Offer",
              name: "Pro",
              price: PLAN_PRICES.pro.monthlyUsd,
              priceCurrency: "USD",
              url: "https://bridgecn-ai-workspace.lovable.app/pricing",
              category: "SaaS subscription",
            },
          ],
        }),
      },
    ],
  }),
  component: PricingPage,
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function PricingPage() {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      key: "free" as const,
      name: "Free",
      tagline: "Explore BridgeCN with one project.",
      price: { amount: 0, sub: "Forever" },
      quotas: PLAN_QUOTAS.free,
      cta: { label: "Start free", to: "/register" },
      popular: false,
    },
    {
      key: "starter" as const,
      name: "Starter",
      tagline: "Solo founders launching in one market.",
      price:
        interval === "monthly"
          ? { amount: PLAN_PRICES.starter.monthlyUsd, sub: "/month" }
          : {
              amount: Math.round(PLAN_PRICES.starter.annualUsd / 12),
              sub: "/month, billed yearly",
            },
      quotas: PLAN_QUOTAS.starter,
      cta: { label: "Start with Starter", to: "/register" },
      popular: false,
    },
    {
      key: "pro" as const,
      name: "Pro",
      tagline: "Teams shipping into China with proof.",
      price:
        interval === "monthly"
          ? { amount: PLAN_PRICES.pro.monthlyUsd, sub: "/month" }
          : {
              amount: Math.round(PLAN_PRICES.pro.annualUsd / 12),
              sub: "/month, billed yearly",
            },
      quotas: PLAN_QUOTAS.pro,
      cta: { label: "Start with Pro", to: "/register" },
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PaymentTestModeBanner />

      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            BridgeCN AI
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/login"
              className="rounded-md px-3 py-1.5 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-[var(--primary)] px-3 py-1.5 font-medium text-[var(--primary-foreground)] transition hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--primary-soft)]/40 px-3 py-1 text-xs font-medium text-[var(--primary)]">
            <Sparkles className="h-3.5 w-3.5" /> For Korean & Japanese brands entering China
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Pricing that scales with your launch
          </h1>
          <p className="mt-4 text-base text-[var(--muted-foreground)]">
            Real SEMrush market data, AI-generated consumer insight, native-Chinese copy, and a
            launch checklist — from $49/month. Cancel anytime.
          </p>

          <div className="mt-8 inline-flex overflow-hidden rounded-full border border-[var(--border)] p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={`rounded-full px-4 py-1.5 font-medium transition ${
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
              className={`rounded-full px-4 py-1.5 font-medium transition ${
                interval === "annual"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)]"
              }`}
            >
              Annual · 2 months free
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.key}
              className={`relative rounded-2xl border p-6 ${
                p.popular
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]/30 shadow-lg"
                  : "border-[var(--border)] bg-[var(--background)]"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--primary-foreground)]">
                  Most popular
                </div>
              )}
              <div className="text-lg font-semibold">{p.name}</div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{p.tagline}</p>
              <div className="mt-5">
                <span className="text-4xl font-bold">${p.price.amount}</span>
                <span className="ml-1 text-sm text-[var(--muted-foreground)]">{p.price.sub}</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  {fmt(p.quotas.projects)} project{p.quotas.projects > 1 ? "s" : ""}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  {fmt(p.quotas.aiCalls)} AI generations / month
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  {fmt(p.quotas.semrushCalls)} verified SEMrush queries / month
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  {fmt(p.quotas.seats)} team seat{p.quotas.seats > 1 ? "s" : ""}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  {p.quotas.whiteLabel
                    ? "PDF export + brand white-label"
                    : p.quotas.watermark
                      ? "PDF export (with BridgeCN watermark)"
                      : "PDF export (no watermark)"}
                </li>
                {p.key === "pro" && (
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                    Shareable client-facing report links
                  </li>
                )}
              </ul>
              <Link
                to={p.cta.to}
                className={`mt-8 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  p.popular
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                    : "border border-[var(--border)] hover:bg-[var(--muted)]"
                }`}
              >
                {p.cta.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center text-xs text-[var(--muted-foreground)]">
          Prices in USD, exclusive of taxes. Local taxes and payment methods are handled by our
          payment provider. Need more? <Link to="/register" className="underline">Contact us</Link>
          &nbsp;about a custom plan.
        </div>
      </main>

      <footer className="border-t border-[var(--border)] mt-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-[var(--muted-foreground)] sm:flex-row">
          <div>© {new Date().getFullYear()} no · BridgeCN AI</div>
          <nav className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-[var(--foreground)]">Terms</Link>
            <Link to="/privacy" className="hover:text-[var(--foreground)]">Privacy</Link>
            <Link to="/refunds" className="hover:text-[var(--foreground)]">Refunds</Link>
          </nav>
          <div>
            Payments by <a href="https://www.paddle.com" target="_blank" rel="noreferrer" className="underline">Paddle</a> (Merchant of Record)
          </div>
        </div>
      </footer>
    </div>
  );
}