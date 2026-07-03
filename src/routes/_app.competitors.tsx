import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Swords, Loader2, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { DataIntegrityBanner } from "@/components/data-integrity-banner";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { fetchCompareSnapshot, type CompareSnapshot } from "@/lib/data/semrush-compare.functions";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/competitors")({
  head: () => ({ meta: [{ title: "Competitors — BridgeCN AI" }] }),
  component: CompetitorsPage,
});

const DB_OPTIONS = ["us", "uk", "hk", "cn", "kr", "jp", "tw", "sg", "de", "fr", "au"];

function marketDefault(market: string): string {
  const m = (market || "").toLowerCase();
  if (/hong\s*kong|香港/.test(m)) return "hk";
  if (/china|中国|大陆/.test(m)) return "cn";
  if (/korea|한국|韩国/.test(m)) return "kr";
  if (/japan|日本/.test(m)) return "jp";
  if (/taiwan|台湾|台灣/.test(m)) return "tw";
  if (/singapore|新加坡/.test(m)) return "sg";
  if (/united kingdom|britain|英国/.test(m)) return "uk";
  return "us";
}

function fmt(n: number): string {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function CompetitorsPage() {
  const { t } = useI18n();
  const { activeProject } = useWorkspace();
  const kb = activeProject?.knowledgeBase || {};

  const [you, setYou] = useState("");
  const [c1, setC1] = useState("");
  const [c2, setC2] = useState("");
  const [c3, setC3] = useState("");
  const [db, setDb] = useState("us");
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<CompareSnapshot | null>(null);

  // Prefill from active project.
  useEffect(() => {
    setYou((prev) => prev || kb.website || activeProject?.website || "");
    setDb(
      (prev) => prev || marketDefault(activeProject?.targetMarket || activeProject?.region || ""),
    );
    const cs = kb.competitors || [];
    if (cs[0]) setC1((p) => p || cs[0]);
    if (cs[1]) setC2((p) => p || cs[1]);
    if (cs[2]) setC3((p) => p || cs[2]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);

  const competitors = useMemo(
    () => [c1, c2, c3].map((s) => s.trim()).filter(Boolean),
    [c1, c2, c3],
  );

  const canRun = you.trim().length > 0 && competitors.length >= 1;

  async function run() {
    if (!canRun) {
      toast.error(t("competitors.toast.needInput"));
      return;
    }
    setLoading(true);
    try {
      const snap = await fetchCompareSnapshot({
        data: {
          yourDomain: you,
          competitors,
          targetMarket: db,
        },
      });
      setSnapshot(snap);
      if (snap.quotaExceeded) {
        toast.error(t("competitors.toast.quota"));
      } else if (snap.errors.length && snap.overview.every((o) => !o.organicKeywords)) {
        toast.error(snap.errors[0]);
      } else {
        toast.success(t("competitors.toast.done", { db: snap.market }));
      }
    } catch (e) {
      toast.error((e as Error).message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  }

  const verified = Boolean(
    snapshot && !snapshot.quotaExceeded && snapshot.overview.some((o) => o.organicKeywords > 0),
  );
  const verifiedLabel = snapshot
    ? t("competitors.verified.body", {
        db: snapshot.market.toUpperCase(),
        time: new Date(snapshot.fetchedAt).toLocaleString(),
      })
    : undefined;

  return (
    <div>
      <PageHeader
        title={t("competitors.title")}
        description={t("competitors.sub")}
        action={
          <button
            onClick={run}
            disabled={!canRun || loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 text-xs font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {t("competitors.action.fetch")}
          </button>
        }
      />

      <DataIntegrityBanner verified={verified} verifiedLabel={verifiedLabel} />

      {/* Input card */}
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field
            label={t("competitors.input.you")}
            value={you}
            onChange={setYou}
            placeholder="yourbrand.com"
          />
          <Field
            label={t("competitors.input.c1")}
            value={c1}
            onChange={setC1}
            placeholder="competitor1.com"
          />
          <Field
            label={t("competitors.input.c2")}
            value={c2}
            onChange={setC2}
            placeholder="competitor2.com"
          />
          <Field
            label={t("competitors.input.c3")}
            value={c3}
            onChange={setC3}
            placeholder="competitor3.com"
          />
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
              {t("competitors.input.db")}
            </label>
            <select
              value={db}
              onChange={(e) => setDb(e.target.value)}
              className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
            >
              {DB_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && !snapshot && (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      )}

      {snapshot && snapshot.quotaExceeded && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[oklch(0.85_0.12_30)] bg-[oklch(0.98_0.05_40)] p-4 text-sm text-[oklch(0.4_0.15_30)] dark:border-[oklch(0.4_0.15_30)] dark:bg-[oklch(0.22_0.05_40)] dark:text-[oklch(0.85_0.1_50)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">{t("competitors.quota.title")}</p>
            <p className="mt-1 text-xs opacity-90">{t("competitors.quota.body")}</p>
          </div>
        </div>
      )}

      {snapshot && !snapshot.quotaExceeded && (
        <div className="space-y-6">
          {/* Overview compare table */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
            <header className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3">
              <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
              <h2 className="text-sm font-semibold">{t("competitors.card.overview")}</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40 text-left text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                    <th className="px-5 py-2.5 font-medium">{t("competitors.metric")}</th>
                    {snapshot.overview.map((o, i) => (
                      <th key={o.domain} className="px-4 py-2.5 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{o.domain}</span>
                          {i === 0 && (
                            <span className="rounded bg-[var(--primary-soft)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--primary)]">
                              {t("competitors.you")}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {[
                    { k: "authorityScore", labelKey: "competitors.row.authority" },
                    { k: "organicKeywords", labelKey: "competitors.row.keywords" },
                    { k: "organicTraffic", labelKey: "competitors.row.traffic" },
                    { k: "backlinks", labelKey: "competitors.row.backlinks" },
                    { k: "referringDomains", labelKey: "competitors.row.refDomains" },
                  ].map((row) => (
                    <tr key={row.k}>
                      <td className="px-5 py-2.5 text-[var(--muted-foreground)]">
                        {t(row.labelKey)}
                      </td>
                      {snapshot.overview.map((o) => (
                        <td key={o.domain} className="px-4 py-2.5 font-medium tabular-nums">
                          {fmt((o as unknown as Record<string, number>)[row.k])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top keywords per domain */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)]">
            <h2 className="mb-3 text-sm font-semibold">{t("competitors.card.topKw")}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {snapshot.topKeywords.map((dk, i) => (
                <div
                  key={dk.domain}
                  className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-3"
                >
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                    <span className="truncate">{dk.domain}</span>
                    {i === 0 && (
                      <span className="rounded bg-[var(--primary-soft)] px-1.5 py-0.5 text-[9px] text-[var(--primary)]">
                        {t("competitors.you")}
                      </span>
                    )}
                  </div>
                  {dk.keywords.length === 0 ? (
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {dk.error || t("competitors.empty.kw")}
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-xs">
                      {dk.keywords.map((k) => (
                        <li key={k.phrase} className="flex items-baseline gap-2">
                          <span className="w-6 shrink-0 text-[10px] font-semibold text-[var(--muted-foreground)]">
                            #{k.position}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{k.phrase}</span>
                          <span className="tabular-nums text-[10px] text-[var(--muted-foreground)]">
                            {fmt(k.volume)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Gap keywords */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
            <header className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3">
              <Swords className="h-4 w-4 text-[var(--primary)]" />
              <h2 className="text-sm font-semibold">{t("competitors.card.gap")}</h2>
              <span className="ml-auto text-[11px] text-[var(--muted-foreground)]">
                {t("competitors.gap.hint")}
              </span>
            </header>
            {snapshot.gap.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-[var(--muted-foreground)]">
                {t("competitors.gap.empty")}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40 text-left text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                    <th className="px-5 py-2.5 font-medium">{t("competitors.gap.keyword")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("competitors.gap.volume")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("competitors.gap.rankedBy")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {snapshot.gap.map((g) => (
                    <tr key={g.phrase}>
                      <td className="px-5 py-2.5 font-medium">{g.phrase}</td>
                      <td className="px-4 py-2.5 tabular-nums">{fmt(g.volume)}</td>
                      <td className="px-4 py-2.5 text-xs text-[var(--muted-foreground)]">
                        {g.rankedBy.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {snapshot.errors.length > 0 && (
            <details className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-3 text-[11px] text-[var(--muted-foreground)]">
              <summary className="cursor-pointer font-medium">
                {t("competitors.warnings")} ({snapshot.errors.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {snapshot.errors.map((e, i) => (
                  <li key={i} className="font-mono">
                    {e}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {!snapshot && !loading && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-12 text-center shadow-[var(--shadow-soft)]">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
            <Swords className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium">{t("competitors.empty.title")}</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-[var(--muted-foreground)]">
            {t("competitors.empty.body")}
          </p>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
      />
    </div>
  );
}
