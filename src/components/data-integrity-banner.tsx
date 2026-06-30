import { Info, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * Honest data-source banner. Shown on every analysis page so the user knows
 * that, without a connected real-data source (SEMrush, Tmall, etc.), every
 * number on the page is an AI strategic estimate — not measured data.
 *
 * This is intentionally non-dismissible: the project's core promise to its
 * customers is "real numbers", and pretending the data is verified when it is
 * not would be a worse failure than a permanent banner.
 */
export function DataIntegrityBanner({ verified = false, verifiedLabel }: { verified?: boolean; verifiedLabel?: string } = {}) {
  const { t } = useI18n();
  if (verified) {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-[oklch(0.85_0.08_150)] bg-[oklch(0.97_0.04_150)] p-3 text-xs leading-relaxed text-[oklch(0.35_0.08_150)] dark:border-[oklch(0.35_0.08_150)] dark:bg-[oklch(0.20_0.04_150)] dark:text-[oklch(0.80_0.06_150)]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Verified data source connected</p>
          <p className="mt-0.5 opacity-90">
            {verifiedLabel || "Live SEMrush data is grounding this page. KPIs marked Verified are measurements; remaining figures stay as AI inference based on category benchmarks."}
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
