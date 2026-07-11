import { ShieldCheck, Sparkles } from "lucide-react";

/**
 * Small inline pill shown next to a KPI number to tell the user whether
 * the value is measured (SEMrush/Baidu/Tmall) or AI inference. Keeps the
 * app's honesty promise granular — page-level "verified" is too coarse.
 */
export function DataSourcePill({
  verified,
  source,
  compact = false,
}: {
  verified: boolean;
  source?: string;
  compact?: boolean;
}) {
  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-[oklch(0.55_0.14_150)]/40 bg-[oklch(0.55_0.14_150)]/10 px-1.5 py-0.5 font-medium text-[oklch(0.4_0.14_150)] ${compact ? "text-[9px]" : "text-[10px]"}`}
        title={source ? `Measured · ${source}` : "Measured"}
      >
        <ShieldCheck className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
        {compact ? "실측" : `실측${source ? ` · ${source}` : ""}`}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-[oklch(0.85_0.08_70)]/60 bg-[oklch(0.98_0.04_85)] px-1.5 py-0.5 font-medium text-[oklch(0.45_0.1_60)] ${compact ? "text-[9px]" : "text-[10px]"}`}
      title={source ? `AI 추정 · ${source}` : "AI 추정 · 카테고리 벤치마크"}
    >
      <Sparkles className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
      AI 추정
    </span>
  );
}