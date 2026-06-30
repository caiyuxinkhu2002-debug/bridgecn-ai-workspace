import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ProjectContextBar } from "@/components/project-context-bar";
import { WorkflowFooter } from "@/components/workflow-footer";
import { useI18n } from "@/lib/i18n";
import { Sparkles, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_app/consumer-insight")({
  head: () => ({ meta: [{ title: "Consumer Insight — BridgeCN AI" }] }),
  component: ConsumerInsightPage,
});

const personas = [
  { name: "Xiao Ya", age: "24–32", city: "Shanghai · Tier 1", income: "¥18k+/mo", tag: "Ingredient-led" },
  { name: "Wen Jing", age: "28–36", city: "Hangzhou · Tier 1.5", income: "¥12k+/mo", tag: "Premium gifting" },
  { name: "Lin Hao", age: "20–28", city: "Chengdu · Tier 2", income: "¥8k+/mo", tag: "Trend-curious" },
];
const signals = [
  { label: "Glass skin", sentiment: "+0.78", source: "Xiaohongshu · 12.4k posts" },
  { label: "Clean beauty", sentiment: "+0.71", source: "Douyin · 8.9k videos" },
  { label: "Hanbang heritage", sentiment: "+0.66", source: "Xiaohongshu · 6.2k posts" },
  { label: "Sustainable packaging", sentiment: "+0.48", source: "Weibo · 3.1k mentions" },
];

function ConsumerInsightPage() {
  const { t } = useI18n();
  return (
    <div>
      <ProjectContextBar />
      <PageHeader title={t("consumer.title")} description={t("consumer.sub")} />
      <div className="space-y-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {personas.map((p) => (
            <div key={p.name} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[var(--primary-soft)] to-[var(--muted)] text-sm font-semibold">{p.name.split(" ").map((s) => s[0]).join("")}</div>
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{p.age} · {p.city}</p>
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">{t("consumer.income")}</span><span>{p.income}</span></div>
                <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">{t("consumer.mindset")}</span><span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">{p.tag}</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--primary)]" /><h3 className="text-sm font-semibold">{t("consumer.signals")}</h3></div>
          <ul className="divide-y divide-[var(--border)]">
            {signals.map((s) => (
              <li key={s.label} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <div><p className="text-sm font-medium">{s.label}</p><p className="text-xs text-[var(--muted-foreground)]">{s.source}</p></div>
                </div>
                <span className="rounded-full bg-[oklch(0.96_0.04_150)] px-2.5 py-0.5 text-xs font-medium text-[oklch(0.42_0.12_150)]">{s.sentiment}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <WorkflowFooter current="consumer" />
    </div>
  );
}