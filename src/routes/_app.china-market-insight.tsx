import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PlaceholderPanel } from "@/components/app-shell";

export const Route = createFileRoute("/_app/china-market-insight")({
  head: () => ({ meta: [{ title: "China Market Insight — BridgeCN AI" }] }),
  component: () => (
    <div>
      <PageHeader title="China Market Insight" description="Analyze China's market opportunities across categories, channels, and regions." />
      <PlaceholderPanel note="Market sizing, category heatmaps and competitive landscape will live here." />
    </div>
  ),
});
