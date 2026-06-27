import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PlaceholderPanel } from "@/components/app-shell";

export const Route = createFileRoute("/_app/launch-checklist")({
  head: () => ({ meta: [{ title: "Launch Checklist — BridgeCN AI" }] }),
  component: () => (
    <div>
      <PageHeader title="Launch Checklist" description="Generate step-by-step China market entry plans for your brand." />
      <PlaceholderPanel note="Phased launch plans, regulatory steps and channel readiness coming soon." />
    </div>
  ),
});
