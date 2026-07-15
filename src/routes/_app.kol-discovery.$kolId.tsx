import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck, Sparkles, ExternalLink, Mail } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { getKol } from "@/lib/kol/kols.functions";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/kol-discovery/$kolId")({
  head: () => ({ meta: [{ title: "KOL 상세 — BridgeCN AI" }] }),
  component: KolDetailPage,
});

function Field({
  label,
  value,
  measured,
}: {
  label: string;
  value: React.ReactNode;
  measured: boolean;
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
          {label}
        </div>
        {measured ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700">
            <ShieldCheck className="h-3 w-3" /> 실측
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700">
            <Sparkles className="h-3 w-3" /> AI 추정
          </span>
        )}
      </div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}

function KolDetailPage() {
  const { kolId } = Route.useParams();
  const getFn = useServerFn(getKol);
  const { data: kol, isLoading } = useQuery({
    queryKey: ["kol", kolId],
    queryFn: () => getFn({ data: { kolId } }),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  if (!kol) {
    return (
      <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
        KOL을 찾을 수 없습니다.
      </div>
    );
  }

  const platformLabel: Record<typeof kol.platform, string> = {
    xiaohongshu: "小红书",
    douyin: "抖音",
    bilibili: "B站",
    wechat: "微信",
  };

  return (
    <div className="space-y-6">
      <Link
        to="/kol-discovery"
        className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-3 w-3" /> KOL 목록으로
      </Link>
      <PageHeader
        title={kol.display_name || kol.handle}
        description={`${platformLabel[kol.platform]} · @${kol.handle}`}
        action={
          <a
            href={kol.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs rounded-md border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--muted)]"
          >
            원본 프로필 <ExternalLink className="h-3 w-3" />
          </a>
        }
      />

      {kol.bio && (
        <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-line">{kol.bio}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="플랫폼" value={platformLabel[kol.platform]} measured />
        <Field
          label="팔로워"
          value={kol.followers ? kol.followers.toLocaleString() : "—"}
          measured={!!kol.followers}
        />
        <Field
          label="최근 크롤"
          value={kol.last_crawled_at ? new Date(kol.last_crawled_at).toLocaleString() : "—"}
          measured
        />
        <Field
          label="주요 카테고리"
          value={(kol.primary_categories || []).join(", ")}
          measured={false}
        />
        <Field
          label="콘텐츠 타입"
          value={(kol.content_types || []).join(", ")}
          measured={false}
        />
        <Field label="톤" value={(kol.tone || []).join(", ")} measured={false} />
        <Field
          label="주요 언급 브랜드"
          value={(kol.mentioned_brands || []).join(", ")}
          measured
        />
        <Field
          label="공개 이메일"
          value={
            kol.contact_public_email ? (
              <a
                href={`mailto:${kol.contact_public_email}`}
                className="inline-flex items-center gap-1 text-[oklch(0.55_0.18_260)] hover:underline"
              >
                <Mail className="h-3 w-3" /> {kol.contact_public_email}
              </a>
            ) : (
              "— (플랫폼 DM 필요)"
            )
          }
          measured
        />
        <Field
          label="협업 메모 (원문)"
          value={kol.contact_note || "—"}
          measured
        />
        <Field
          label="단가 (¥, 1건 추정)"
          value={
            kol.price_band?.max
              ? `¥${kol.price_band.min?.toLocaleString() || 0} – ¥${kol.price_band.max.toLocaleString()}`
              : "—"
          }
          measured={false}
        />
        <Field
          label="오디언스 프로필"
          value={
            Object.entries(kol.audience_profile || {}).length
              ? Object.entries(kol.audience_profile || {})
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join("/") : v}`)
                  .join(" · ")
              : "—"
          }
          measured={false}
        />
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <strong>정직성 안내:</strong> 팔로워 · 카테고리 · 최근 콘텐츠 · 공개 이메일은 공개
        프로필에서 실측한 값입니다. 단가(¥) · 오디언스 프로필은 카테고리 벤치마크 기반 AI
        추정치이며, 실제 협업 시에는 KOL/MCN에 직접 문의 후 확정하시기 바랍니다.
      </div>
    </div>
  );
}