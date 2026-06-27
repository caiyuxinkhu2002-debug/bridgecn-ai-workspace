import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PlaceholderPanel } from "@/components/app-shell";

export const Route = createFileRoute("/_app/localization-studio")({
  head: () => ({ meta: [{ title: "Localization Studio — BridgeCN AI" }] }),
  component: () => (
    <div>
      <PageHeader title="Localization Studio" description="Transform Korean marketing content into localized Chinese content." />
      <PlaceholderPanel note="Side-by-side editor, tone presets and channel adapters will live here." />
    </div>
  ),
});
