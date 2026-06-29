import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Wand2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_app/localization-studio")({
  head: () => ({ meta: [{ title: "Localization Studio — BridgeCN AI" }] }),
  component: LocalizationStudioPage,
});

const pairs = [
  {
    kr: "촉촉하고 깨끗한 한방 스킨케어, 조선미녀.",
    cn: "源自韩方的清润护肤 — Beauty of Joseon。",
    note: "Tone: premium, gentle. Channel: Xiaohongshu.",
  },
  {
    kr: "민감한 피부를 위한 순한 클렌징 밤.",
    cn: "为敏感肌打造的温和洁颜膏。",
    note: "Tone: caring, expert. Channel: Tmall PDP.",
  },
  {
    kr: "비건 처방, 99% 자연유래 성분.",
    cn: "纯素配方，99% 天然来源成分。",
    note: "Tone: factual, transparent. Channel: Douyin caption.",
  },
];

function LocalizationStudioPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Localization Studio" description="Translate, adapt and culturally tune Korean content for Chinese channels." />

      <div className="flex flex-wrap items-center gap-2">
        {["Premium", "Warm", "Expert", "Playful", "Concise"].map((p, i) => (
          <button
            key={p}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium ${
              i === 0 ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]" : "border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            {p}
          </button>
        ))}
        <div className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 text-xs">
          <span className="font-medium">한국어</span>
          <ArrowRight className="h-3 w-3 text-[var(--muted-foreground)]" />
          <span className="font-medium">简体中文</span>
        </div>
      </div>

      <div className="space-y-4">
        {pairs.map((p, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
            <div className="grid divide-y divide-[var(--border)] md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="p-5">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">한국어 · Source</div>
                <p className="text-base leading-relaxed">{p.kr}</p>
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">简体中文 · AI translation</div>
                  <button className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)]"><Wand2 className="h-3 w-3" />Regenerate</button>
                </div>
                <p className="text-base leading-relaxed">{p.cn}</p>
              </div>
            </div>
            <div className="border-t border-[var(--border)] bg-[var(--muted)]/50 px-5 py-2 text-[11px] text-[var(--muted-foreground)]">
              {p.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
