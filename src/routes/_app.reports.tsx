import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PlaceholderPanel } from "@/components/app-shell";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — BridgeCN AI" }] }),
  component: () => (
    <div>
      <PageHeader title="Reports" description="Export, share and revisit generated research and strategy documents." />
      <PlaceholderPanel note="Saved reports, export history and shared links will appear here." />
    </div>
  ),
});
