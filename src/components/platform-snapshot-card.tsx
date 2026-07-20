import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listPlatformSnapshots, type PlatformSnapshot } from "@/lib/data/platform-snapshots.functions";
import { toast } from "sonner";

/**
 * Renders the latest measured 小红书 · 抖음 snapshots for a given
 * category. Data is the raw crawl output — the pill says "실측" because
 * these come straight from the source platform, not from the LLM.
 */
export function PlatformSnapshotCard({ category }: { category?: string }) {
  const fetchSnapshots = useServerFn(listPlatformSnapshots);
  const [snaps, setSnaps] = useState<PlatformSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await fetchSnapshots({ data: category ? { category } : {} });
      setSnaps(rows);
    } catch (e) {
      // silent — the card just shows empty state
      console.warn("platform snapshots load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const triggerRefresh = async () => {
    setRefreshing(true);
    try {
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
      const res = await fetch("/api/public/hooks/refresh-platform-snapshots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key ?? "",
        },
        body: "{}",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { succeeded?: number; failed?: number };
      toast.success(`Snapshot refreshed · ${json.succeeded ?? 0} ok · ${json.failed ?? 0} failed`);
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Snapshot refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const byPlatform = {
    xiaohongshu: snaps.filter((s) => s.platform === "xiaohongshu"),
    douyin: snaps.filter((s) => s.platform === "douyin"),
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[oklch(0.55_0.14_150)]/10 text-[oklch(0.45_0.14_150)]">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold">小红书 · 抖음 실측 스냅샷</h3>
          <span className="rounded-full border border-[oklch(0.55_0.14_150)]/40 bg-[oklch(0.55_0.14_150)]/10 px-2 py-0.5 text-[10px] font-medium text-[oklch(0.4_0.14_150)]">
            Measured
          </span>
        </div>
        <button
          onClick={triggerRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--muted)]/60 disabled:opacity-50"
          title="Firecrawl로 공개 카테고리 페이지를 다시 크롤합니다"
        >
          {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {refreshing ? "Crawling…" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-[var(--muted-foreground)]">Loading snapshots…</p>
      ) : snaps.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-xs text-[var(--muted-foreground)]">
          아직 캡처된 스냅샷이 없습니다. 위의 <b>Refresh</b> 버튼을 눌러 첫 크롤을 실행하세요.
          <br />
          (Firecrawl 크레딧이 소모됩니다 · 카테고리당 1~2 페이지)
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(["xiaohongshu", "douyin"] as const).map((p) => (
            <div key={p} className="rounded-xl border border-[var(--border)] p-4">
              <p className="mb-2 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                {p === "xiaohongshu" ? "小红书 (XHS)" : "抖음 (Douyin)"}
              </p>
              {byPlatform[p].length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)]">No snapshot yet.</p>
              ) : (
                <ul className="space-y-3">
                  {byPlatform[p].slice(0, 4).map((s) => (
                    <li key={s.id} className="text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {s.query}
                          <span className="ml-1 text-[10px] text-[var(--muted-foreground)]">
                            · {s.category}
                          </span>
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {new Date(s.captured_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 tabular-nums">
                        {s.metrics?.notes_or_videos_count != null ? (
                          <span>
                            <b>{s.metrics.notes_or_videos_count.toLocaleString()}</b>{" "}
                            {p === "xiaohongshu" ? "notes" : "videos"}
                          </span>
                        ) : null}
                        {s.metrics?.total_views != null ? (
                          <span>
                            · <b>{s.metrics.total_views.toLocaleString()}</b> views
                          </span>
                        ) : null}
                      </div>
                      {s.metrics?.top_hashtags && s.metrics.top_hashtags.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {s.metrics.top_hashtags.slice(0, 5).map((h) => (
                            <span
                              key={h}
                              className="rounded-full bg-[var(--muted)]/60 px-1.5 py-0.5 text-[9px]"
                            >
                              #{h}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[10px] text-[var(--muted-foreground)]">
        출처: 小红书·抖음 공개 검색 페이지 · Firecrawl 스크레이핑 · 캡처 시점 기준.
      </p>
    </div>
  );
}