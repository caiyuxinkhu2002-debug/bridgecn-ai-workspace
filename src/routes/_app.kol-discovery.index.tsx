import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Loader2, Plus, Search, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useWorkspace } from "@/lib/workspace-context";
import { listKols, addToShortlist, listShortlist } from "@/lib/kol/kols.functions";
import { crawlKol } from "@/lib/kol/crawl.functions";
import { matchKols, type Scored } from "@/lib/kol/match.functions";
import { KolCard } from "@/components/kol/kol-card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/kol-discovery/")({
  head: () => ({
    meta: [
      { title: "KOL 발굴 — BridgeCN AI" },
      {
        name: "description",
        content:
          "小红书 / 抖音 / B站 / 微信 KOL 실측 데이터베이스와 브랜드 매칭 엔진. 실제 공개 프로필에서 크롤링한 진짜 데이터 기반.",
      },
    ],
  }),
  component: KolDiscoveryPage,
});

const PLATFORMS: { key: "xiaohongshu" | "douyin" | "bilibili" | "wechat"; label: string }[] = [
  { key: "xiaohongshu", label: "小红书" },
  { key: "douyin", label: "抖音" },
  { key: "bilibili", label: "B站" },
  { key: "wechat", label: "微信" },
];

function KolDiscoveryPage() {
  const { workspaceId, activeProject } = useWorkspace();
  const qc = useQueryClient();
  const listFn = useServerFn(listKols);
  const matchFn = useServerFn(matchKols);
  const crawlFn = useServerFn(crawlKol);
  const addFn = useServerFn(addToShortlist);
  const shortlistFn = useServerFn(listShortlist);

  const [addUrl, setAddUrl] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState<number | undefined>(undefined);

  const kolsQuery = useQuery({
    queryKey: ["kols", workspaceId],
    queryFn: () => listFn({ data: { workspaceId } }),
    enabled: !!workspaceId,
  });

  const shortlistQuery = useQuery({
    queryKey: ["kol-shortlist", activeProject?.id],
    queryFn: () => shortlistFn({ data: { projectId: activeProject!.id } }),
    enabled: !!activeProject?.id,
  });

  const targetCategories = useMemo(() => {
    const kb = activeProject?.knowledgeBase;
    return [kb?.category, kb?.industry, ...(kb?.keywords || [])].filter(Boolean) as string[];
  }, [activeProject]);

  const matchQuery = useQuery({
    queryKey: ["kol-match", workspaceId, targetCategories.join(","), selectedPlatforms.join(","), budget],
    queryFn: () =>
      matchFn({
        data: {
          workspaceId,
          targetCategories,
          targetAudience: activeProject?.knowledgeBase?.targetAudience,
          platforms: selectedPlatforms.length
            ? (selectedPlatforms as ("xiaohongshu" | "douyin" | "bilibili" | "wechat")[])
            : undefined,
          maxBudgetCny: budget,
        },
      }),
    enabled: !!workspaceId && (kolsQuery.data?.length || 0) > 0,
  });

  const shortlistIds = useMemo(
    () => new Set((shortlistQuery.data || []).map((s) => s.kol_id)),
    [shortlistQuery.data],
  );

  const addMut = useMutation({
    mutationFn: (input: { kolId: string; score?: number; breakdown?: Record<string, number> }) =>
      addFn({
        data: {
          projectId: activeProject!.id,
          kolId: input.kolId,
          matchScore: input.score,
          matchBreakdown: input.breakdown,
        },
      }),
    onSuccess: () => {
      toast.success("숏리스트에 추가되었습니다");
      qc.invalidateQueries({ queryKey: ["kol-shortlist"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  async function handleCrawl() {
    if (!addUrl.trim() || !workspaceId) return;
    setCrawling(true);
    try {
      const res = await crawlFn({ data: { workspaceId, profileUrl: addUrl.trim() } });
      if (res.ok) {
        toast.success("KOL 프로필이 크롤되었습니다");
        setAddUrl("");
        qc.invalidateQueries({ queryKey: ["kols"] });
        qc.invalidateQueries({ queryKey: ["kol-match"] });
      } else {
        toast.error(res.error || "크롤 실패");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCrawling(false);
    }
  }

  const displayList: Scored[] = useMemo(() => {
    const src = matchQuery.data || [];
    if (!query) return src;
    const q = query.toLowerCase();
    return src.filter(
      (k) =>
        (k.display_name || "").toLowerCase().includes(q) ||
        k.handle.toLowerCase().includes(q) ||
        (k.primary_categories || []).some((c) => c.toLowerCase().includes(q)),
    );
  }, [matchQuery.data, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="KOL 정밀 매칭"
        description="小红书 / 抖音 / B站 / 微信 공개 프로필에서 실측 크롤 → AI 정규화 → 브랜드 매칭. 실측과 AI 추정을 필드 단위로 정직하게 구분합니다."
      />

      {/* Add-by-URL crawl bar */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="text-sm font-medium mb-2 flex items-center gap-2">
          <Plus className="h-4 w-4" /> KOL 추가 (공개 프로필 URL)
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            placeholder="https://www.xiaohongshu.com/user/profile/... 또는 抖音/B站/微信"
            className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={crawling || !addUrl.trim()}
            onClick={handleCrawl}
            className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.55_0.18_260)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {crawling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {crawling ? "크롤 중…" : "실측 크롤"}
          </button>
        </div>
        <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
          공개 프로필만 지원 · 팔로워 · 카테고리 · 최근 콘텐츠 톤 · 공개 이메일을 실측. 단가(¥) 및 오디언스 프로필은 AI 추정으로 명확히 구분됩니다.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const active = selectedPlatforms.includes(p.key);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() =>
                  setSelectedPlatforms((cur) =>
                    active ? cur.filter((x) => x !== p.key) : [...cur, p.key],
                  )
                }
                className={`text-xs rounded-full px-3 py-1 border ${
                  active
                    ? "bg-[oklch(0.55_0.18_260)] text-white border-transparent"
                    : "border-[var(--border)]"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름 / 핸들 / 카테고리 검색"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] pl-7 pr-2 py-2 text-sm"
            />
          </div>
          <input
            value={budget ?? ""}
            onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)}
            type="number"
            placeholder="최대 예산 (¥, 1건당)"
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
          <div className="text-xs text-[var(--muted-foreground)] self-center">
            매칭 기준: {targetCategories.slice(0, 4).join(", ") || "프로젝트 KB가 비어있습니다"}
          </div>
        </div>
      </div>

      {/* Results */}
      {kolsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : (kolsQuery.data?.length || 0) === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
          아직 크롤된 KOL이 없습니다. 위 입력창에 공개 프로필 URL을 붙여넣어 첫 번째 KOL을 추가하세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayList.map((k) => (
            <KolCard
              key={k.id}
              kol={k}
              score={k.match_score}
              breakdown={k.match_breakdown}
              onAddToShortlist={
                activeProject
                  ? () =>
                      addMut.mutate({
                        kolId: k.id,
                        score: k.match_score,
                        breakdown: k.match_breakdown,
                      })
                  : undefined
              }
              inShortlist={shortlistIds.has(k.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// silence unused import warning for useEffect in some builds
void useEffect;