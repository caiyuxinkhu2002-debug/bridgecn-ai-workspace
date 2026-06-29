import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Download, Share2, FileText, Search } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — BridgeCN AI" }] }),
  component: ReportsPage,
});

const reports = [
  { name: "Beauty of Joseon · China Expansion", type: "Market Entry", date: "Jun 24, 2026", status: "Ready" },
  { name: "ANUA · Xiaohongshu Strategy", type: "Channel Strategy", date: "Jun 18, 2026", status: "Ready" },
  { name: "Medicube · Tmall Launch Plan", type: "Launch Plan", date: "Jun 12, 2026", status: "Ready" },
  { name: "Round Lab · Consumer Insight", type: "Consumer Research", date: "Jun 03, 2026", status: "Ready" },
  { name: "Torriden · Douyin Campaign", type: "Campaign Brief", date: "May 28, 2026", status: "Draft" },
];

function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Every research, localization and strategy document, in one place." />

      <div className="mb-5 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search reports…"
            className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
          />
        </div>
        <button className="h-9 rounded-md border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--muted)]">All types</button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
        <ul className="divide-y divide-[var(--border)]">
          {reports.map((r) => (
            <li key={r.name} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--muted)]/60">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--muted)]">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <Link to="/report" className="block truncate text-sm font-medium hover:underline">{r.name}</Link>
                <p className="truncate text-xs text-[var(--muted-foreground)]">{r.type} · {r.date}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  r.status === "Ready"
                    ? "bg-[oklch(0.96_0.04_150)] text-[oklch(0.42_0.12_150)]"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }`}
              >
                {r.status}
              </span>
              <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--background)]" aria-label="Share">
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--background)]" aria-label="Download">
                <Download className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
