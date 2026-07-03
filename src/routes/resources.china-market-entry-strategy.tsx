import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

const URL = "https://bridgecn-ai-workspace.lovable.app/resources/china-market-entry-strategy";
const TITLE = "China Market Entry Strategy: A 2026 Guide for Korean & Japanese Brands";
const DESCRIPTION =
  "Compare cross-border e-commerce vs. local entity setups, and learn how Xiaohongshu and Douyin fit into a modern China market entry strategy backed by real market research.";

export const Route = createFileRoute("/resources/china-market-entry-strategy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          url: URL,
          mainEntityOfPage: URL,
          author: { "@type": "Organization", name: "BridgeCN AI" },
          publisher: { "@type": "Organization", name: "BridgeCN AI" },
        }),
      },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            BridgeCN AI
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/pricing" className="rounded-md px-3 py-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              Pricing
            </Link>
            <Link to="/register" className="rounded-md bg-[var(--primary)] px-3 py-1.5 font-medium text-[var(--primary-foreground)] hover:opacity-90">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <article className="prose prose-neutral max-w-none dark:prose-invert">
          <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">Guide · Market entry</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            China Market Entry Strategy: A 2026 Guide for Korean & Japanese Brands
          </h1>
          <p className="mt-4 text-lg text-[var(--muted-foreground)]">
            China is the largest consumer market in the world, but it is also the most fragmented
            digitally. Choosing the right entry path — and grounding it in real market research —
            decides whether your brand scales or stalls in the first 12 months.
          </p>

          <h2 className="mt-10 text-2xl font-semibold">Why market research in China is different</h2>
          <p>
            Global keyword tools underweight Chinese search, Baidu and Xiaohongshu behave nothing
            like Google, and category demand shifts by tier-1 vs. tier-2 city. Any credible market
            research for China combines three signals: cross-border e-commerce transaction volume,
            social-commerce mentions on Xiaohongshu and Douyin, and category-level Tmall Global
            search share. Skipping any one of these produces a distorted picture.
          </p>

          <h2 className="mt-10 text-2xl font-semibold">Cross-border e-commerce vs. local entity</h2>
          <p>The two dominant China market entry strategies today:</p>
          <ul>
            <li>
              <strong>Cross-border e-commerce (CBEC)</strong> via Tmall Global, JD Worldwide, or
              Douyin Global Shop. No Chinese entity required, lighter regulatory load, faster to
              launch (4–8 weeks), and the pricing narrative stays premium. Best for testing
              product-market fit and building a Xiaohongshu content base before committing capital.
            </li>
            <li>
              <strong>Local legal entity (WFOE or JV)</strong> unlocks Tmall Mainland, mainland
              Douyin storefronts, RMB pricing, and local payment rails. Setup takes 3–6 months, but
              margins improve and long-term brand equity compounds. Best once you have proven
              repeat-purchase data from CBEC.
            </li>
          </ul>
          <p>
            A common winning sequence is CBEC first, then convert to a WFOE once monthly GMV crosses
            a threshold and Xiaohongshu content velocity is self-sustaining.
          </p>

          <h2 className="mt-10 text-2xl font-semibold">Social commerce: Xiaohongshu and Douyin</h2>
          <p>
            Xiaohongshu (Red) is where Chinese consumers research beauty, wellness, fashion, and
            lifestyle purchases — the platform behaves like a search engine layered on a review
            site. Douyin owns short-video discovery and live-commerce conversion. Both are
            non-negotiable in a modern China market entry strategy: even brands selling through
            Tmall report that 60–80% of their new customers first encountered them on Xiaohongshu
            or Douyin.
          </p>
          <p>
            The BridgeCN AI workspace is built specifically for this: it pulls verified SEMrush
            demand data alongside Xiaohongshu and Douyin signal, then generates native-Chinese
            product copy your team can localize instead of translate.
          </p>

          <h2 className="mt-10 text-2xl font-semibold">A 90-day entry checklist</h2>
          <ol>
            <li>Weeks 1–2: category and competitor market research (CBEC + social).</li>
            <li>Weeks 3–4: choose CBEC vs. WFOE, register storefronts, secure IP.</li>
            <li>Weeks 5–8: native-Chinese product copy, hero SKU selection, Xiaohongshu seeding.</li>
            <li>Weeks 9–12: Douyin livestream pilot, review velocity monitoring, first ROAS review.</li>
          </ol>

          <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--primary-soft)]/30 p-6">
            <h3 className="text-lg font-semibold">Run your entry plan in BridgeCN AI</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Real SEMrush demand, AI consumer insight, native-Chinese copy, and a launch checklist
              tailored for Korean and Japanese brands. From $49/month.
            </p>
            <Link
              to="/register"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
            >
              Start free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
