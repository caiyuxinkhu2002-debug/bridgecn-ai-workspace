import { Info, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useVerifiedSnapshot } from "@/lib/data/verified-snapshot";
import { useWorkspace } from "@/lib/workspace-context";

/**
 * Honest data-source banner. Shown on every analysis page so the user knows
 * that, without a connected real-data source (SEMrush, Tmall, etc.), every
 * number on the page is an AI strategic estimate — not measured data.
 *
 * This is intentionally non-dismissible: the project's core promise to its
 * customers is "real numbers", and pretending the data is verified when it is
 * not would be a worse failure than a permanent banner.
 */
export function DataIntegrityBanner({
  verified = false,
  verifiedLabel,
  autoDetect = true,
}: { verified?: boolean; verifiedLabel?: string; autoDetect?: boolean } = {}) {
  const { t } = useI18n();
  const { activeProject } = useWorkspace();
  const snapshot = useVerifiedSnapshot(autoDetect ? activeProject?.id : null);
  const isVerified = verified || Boolean(snapshot);
  const label =
    verifiedLabel ||
    (snapshot
      ? `Live SEMrush 데이터 (${snapshot.market.toUpperCase()}, ${new Date(
          snapshot.fetchedAt,
        ).toLocaleString()})가 현재 프로젝트의 분석에 연결되어 있습니다. 다음 단계의 인사이트/현지화/체크리스트/리포트도 이 스냅샷과 프로젝트 지식베이스를 기반으로 생성됩니다.`
      : undefined);
  if (isVerified) {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-[oklch(0.85_0.08_150)] bg-[oklch(0.97_0.04_150)] p-3 text-xs leading-relaxed text-[oklch(0.35_0.08_150)] dark:border-[oklch(0.35_0.08_150)] dark:bg-[oklch(0.20_0.04_150)] dark:text-[oklch(0.80_0.06_150)]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Verified data source connected</p>
          <p className="mt-0.5 opacity-90">
            {label ||
              "Live SEMrush data is grounding this page. KPIs marked Verified are measurements; remaining figures stay as AI inference based on category benchmarks."}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-[oklch(0.85_0.08_70)] bg-[oklch(0.98_0.04_85)] p-3 text-xs leading-relaxed text-[oklch(0.35_0.08_60)] dark:border-[oklch(0.35_0.08_70)] dark:bg-[oklch(0.20_0.04_85)] dark:text-[oklch(0.80_0.06_85)]">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{t("data.banner.title")}</p>
        <p className="mt-0.5 opacity-90">{t("data.banner.body")}</p>
      </div>
    </div>
  );
}
