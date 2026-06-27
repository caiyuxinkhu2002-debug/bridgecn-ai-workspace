import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PlaceholderPanel } from "@/components/app-shell";

export const Route = createFileRoute("/_app/consumer-insight")({
  head: () => ({ meta: [{ title: "Consumer Insight — BridgeCN AI" }] }),
  component: () => (
    <div>
      <PageHeader title="Consumer Insight" description="Understand Chinese consumers — behavior, preferences, and emerging trends." />
      <PlaceholderPanel note="Persona builder, sentiment radar and trend signals will appear here." />
    </div>
  ),
});
