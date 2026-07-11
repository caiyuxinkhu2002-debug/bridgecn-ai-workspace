import { useEffect, useState, useCallback } from "react";
import { Database as DatabaseIcon, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { getUsageStatus, type UsageStatus } from "@/lib/billing/usage.functions";

/**
 * Shows how many SEMrush real-data refreshes remain this billing period.
 * Reads server-side counters via getUsageStatus so it reflects reality
 * (not just the current tab). Auto-refreshes when the window regains
 * focus so the user sees the counter tick after a fetch.
 */
export function SemrushQuotaBadge({ refreshKey = 0 }: { refreshKey?: number }) {
  const { activeWorkspace } = useWorkspace();
  const [status, setStatus] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    setLoading(true);
    try {
      const s = await getUsageStatus({ data: { workspaceId: activeWorkspace.id } });
      setStatus(s);
    } catch {
      /* silent — quota UI is informational only */
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
        <DatabaseIcon className="h-3 w-3" /> SEMrush
      </span>
    );
  }
  const remaining = Math.max(0, status.semrushLimit - status.semrushUsed);
  const exhausted = remaining <= 0;
  const low = remaining > 0 && remaining <= Math.max(1, Math.floor(status.semrushLimit * 0.2));
  const color = exhausted
    ? "border-[oklch(0.75_0.15_25)]/50 bg-[oklch(0.97_0.04_25)] text-[oklch(0.45_0.15_25)]"
    : low
      ? "border-[oklch(0.85_0.15_80)]/50 bg-[oklch(0.98_0.04_85)] text-[oklch(0.45_0.15_60)]"
      : "border-[oklch(0.55_0.14_150)]/40 bg-[oklch(0.55_0.14_150)]/10 text-[oklch(0.4_0.14_150)]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium tabular-nums ${color}`}
      title={`SEMrush 실측 호출 사용량 · 이번 청구 기간 (${status.plan} 플랜) · 매월 초기화`}
    >
      <DatabaseIcon className="h-3 w-3" />
      SEMrush {status.semrushUsed}/{status.semrushLimit}
      {loading ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : null}
      {exhausted ? " · 소진" : low ? ` · ${remaining} 남음` : ""}
    </span>
  );
}