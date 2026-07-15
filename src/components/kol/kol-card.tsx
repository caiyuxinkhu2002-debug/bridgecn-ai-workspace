import { Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Users, Mail } from "lucide-react";
import type { KolRow } from "@/lib/kol/kols.functions";

const PLATFORM_LABEL: Record<KolRow["platform"], string> = {
  xiaohongshu: "小红书",
  douyin: "抖音",
  bilibili: "B站",
  wechat: "微信",
};

const PLATFORM_COLOR: Record<KolRow["platform"], string> = {
  xiaohongshu: "bg-rose-100 text-rose-700 border-rose-200",
  douyin: "bg-neutral-900 text-white border-neutral-800",
  bilibili: "bg-sky-100 text-sky-700 border-sky-200",
  wechat: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function fmt(n?: number | null): string {
  if (!n && n !== 0) return "—";
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  return String(n);
}

export function KolCard({
  kol,
  score,
  breakdown,
  onAddToShortlist,
  inShortlist,
}: {
  kol: KolRow;
  score?: number;
  breakdown?: { category: number; audience: number; platform: number; price: number };
  onAddToShortlist?: () => void;
  inShortlist?: boolean;
}) {
  const isMeasured = kol.verified_source === "crawl" && kol.last_crawled_at;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-medium border rounded px-1.5 py-0.5 ${PLATFORM_COLOR[kol.platform]}`}
            >
              {PLATFORM_LABEL[kol.platform]}
            </span>
            {isMeasured ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700">
                <ShieldCheck className="h-3 w-3" /> 실측
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700">
                <Sparkles className="h-3 w-3" /> AI 추정
              </span>
            )}
          </div>
          <Link
            to="/kol-discovery/$kolId"
            params={{ kolId: kol.id }}
            className="text-sm font-semibold hover:underline block truncate"
          >
            {kol.display_name || kol.handle}
          </Link>
          <div className="text-xs text-[var(--muted-foreground)] truncate">@{kol.handle}</div>
        </div>
        {typeof score === "number" && (
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-[oklch(0.55_0.18_260)]">
              {Math.round(score * 100)}
            </div>
            <div className="text-[10px] text-[var(--muted-foreground)]">매칭 점수</div>
          </div>
        )}
      </div>

      {kol.bio && <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{kol.bio}</p>}

      <div className="flex flex-wrap gap-1">
        {(kol.primary_categories || []).slice(0, 4).map((c) => (
          <span
            key={c}
            className="text-[10px] rounded-full bg-[var(--muted)] px-2 py-0.5"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-[10px] text-[var(--muted-foreground)]">팔로워</div>
          <div className="font-medium inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {fmt(kol.followers)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--muted-foreground)]">단가(추정)</div>
          <div className="font-medium">
            {kol.price_band?.max
              ? `≤ ¥${kol.price_band.max.toLocaleString()}`
              : "—"}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--muted-foreground)]">연락처</div>
          <div className="font-medium truncate inline-flex items-center gap-1">
            {kol.contact_public_email ? (
              <>
                <Mail className="h-3 w-3" /> 공개
              </>
            ) : (
              "DM"
            )}
          </div>
        </div>
      </div>

      {breakdown && (
        <div className="text-[10px] text-[var(--muted-foreground)] border-t border-[var(--border)] pt-2 flex flex-wrap gap-x-3">
          <span>카테고리 {Math.round(breakdown.category * 100)}</span>
          <span>오디언스 {Math.round(breakdown.audience * 100)}</span>
          <span>단가 {Math.round(breakdown.price * 100)}</span>
        </div>
      )}

      <div className="flex gap-2">
        <a
          href={kol.profile_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs font-medium rounded-md border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--muted)]"
        >
          원본 프로필
        </a>
        {onAddToShortlist && (
          <button
            type="button"
            onClick={onAddToShortlist}
            disabled={inShortlist}
            className="flex-1 text-xs font-medium rounded-md bg-[oklch(0.55_0.18_260)] px-3 py-1.5 text-white disabled:opacity-50"
          >
            {inShortlist ? "저장됨" : "숏리스트 추가"}
          </button>
        )}
      </div>
    </div>
  );
}