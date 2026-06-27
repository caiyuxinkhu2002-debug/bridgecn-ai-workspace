import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PlaceholderPanel } from "@/components/app-shell";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — BridgeCN AI" }] }),
  component: () => (
    <div>
      <PageHeader title="Settings" description="Manage your workspace, team members and billing." />
      <PlaceholderPanel note="Workspace profile, members and plan configuration will live here." />
    </div>
  ),
});
