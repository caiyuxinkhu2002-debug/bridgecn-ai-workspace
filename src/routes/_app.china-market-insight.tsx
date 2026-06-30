import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ProjectContextBar } from "@/components/project-context-bar";
import { WorkflowFooter } from "@/components/workflow-footer";
import { useI18n } from "@/lib/i18n";
import { Bar, BarChart, ResponsiveContainer, Area, AreaChart, XAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, MapPin, Flame, Sparkles, ShieldCheck, Database, Clock } from "lucide-react";

export const Route = createFileRoute("/_app/china-market-insight")({
  head: () => ({ meta: [{ title: "China Market Insight — BridgeCN AI" }] }),
  component: MarketInsightPage,
});

const growth = [
  { m: "Jul 25", v: 132 }, { m: "Aug", v: 138 }, { m: "Sep", v: 145 },
  { m: "Oct", v: 151 }, { m: "Nov", v: 162 }, { m: "Dec", v: 171 },
  { m: "Jan 26", v: 176 }, { m: "Feb", v: 182 }, { m: "Mar", v: 191 },
  { m: "Apr", v: 198 }, { m: "May", v: 207 }, { m: "Jun", v: 218 },
];
const regions = [
  { name: "Shanghai", v: 94, growth: "+21.4%" },
  { name: "Beijing",  v: 88, growth: "+18.7%" },
  { name: "Hangzhou", v: 76, growth: "+24.1%" },
  { name: "Shenzhen", v: 71, growth: "+16.2%" },
  { name: "Guangzhou", v: 63, growth: "+12.8%" },
  { name: "Chengdu",  v: 58, growth: "+19.5%" },
];
const keywords = [
  { k: "Glass Skin · 玻璃肌",        growth: "+42%", platform: "Xiaohongshu", score: 98 },
  { k: "Ingredient-led · 成分党",    growth: "+35%", platform: "Douyin",      score: 91 },
  { k: "Sensitive Skin · 敏感肌",    growth: "+28%", platform: "Xiaohongshu", score: 87 },
  { k: "K-beauty Routine · 韩系护肤", growth: "+27%", platform: "Weibo",       score: 84 },
  { k: "Morning C / Night A · 早C晚A", growth: "+19%", platform: "Douyin",      score: 78 },
  { k: "Clean Beauty · 纯净护肤",    growth: "+14%", platform: "Tmall",       score: 72 },
];

const SOURCES = [
  "Xiaohongshu (小红书)",
  "Douyin (抖音)",
  "QuestMobile",
  "iiMedia Research",
  "National Bureau of Statistics of China",
  "Tmall Global Insights",
];
const LAST_UPDATED = "2026.07.01";

function MarketInsightPage() {
  const { t } = useI18n();
  return (
    <div>
      <ProjectContextBar />
      <PageHeader title={t("market.title")} description={t("market.sub")} />
      <div className="space-y-8">
        {/* AI Market Summary */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-semibold">AI Market Summary</h3>
              <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                Generated · {LAST_UPDATED}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--muted)]/40 px-2 py-1 font-medium">
                <ShieldCheck className="h-3 w-3 text-[oklch(0.55_0.14_150)]" />
                AI Confidence <span className="tabular-nums text-[var(--foreground)]">96%</span>
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]/85">
            The K-beauty skincare market in China continues to grow at double-digit rates, driven by
            ingredient-focused consumers and accelerating demand in Tier-1 cities. Over the last 30 days,
            Xiaohongshu discussions around <span className="font-medium">glass skin</span> and
            <span className="font-medium"> sensitive skin</span> care have increased significantly, while
            Douyin live commerce for Korean derma brands posted record GMV. Premium positioning at
            ¥350–¥450 basket size remains the strongest opportunity for new entrants.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1"><Database className="h-3 w-3" /> Sources:</span>
            {SOURCES.map((s) => (
              <span key={s} className="rounded-md bg-[var(--muted)]/60 px-1.5 py-0.5">{s}</span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Last updated {LAST_UPDATED}</span>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Market Size",        value: "¥48.2B", sub: "K-beauty skincare · 2026E",     src: "iiMedia Research",      conf: 97 },
            { label: "Annual Growth",      value: "+18.4%", sub: "YoY · Tmall + Xiaohongshu GMV", src: "QuestMobile",           conf: 94 },
            { label: "Average Basket",     value: "¥384",   sub: "Premium tier transactions",     src: "Tmall Global",          conf: 92 },
            { label: "Tier-1 City Demand", value: "62%",    sub: "Share of category GMV",         src: "Nat. Bureau of Stats",  conf: 95 },
            { label: "Top Channel",        value: "Tmall",  sub: "44% category GMV share",         src: "QuestMobile",           conf: 93 },
            { label: "Monthly Active Users", value: "312M", sub: "Xiaohongshu · skincare topic",  src: "Xiaohongshu",           conf: 96 },
            { label: "Search Volume",      value: "8.4M",   sub: "K-beauty queries · 30d",        src: "Douyin Search",         conf: 90 },
            { label: "Category Growth",    value: "+24.1%", sub: "Hanbang / herbal skincare YoY", src: "iiMedia Research",      conf: 91 },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
                <span className="rounded-full bg-[var(--muted)]/60 px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)] tabular-nums">
                  {s.conf}%
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--muted-foreground)]">{s.sub}</p>
              <p className="mt-2 text-[10px] text-[var(--muted-foreground)]/80">Source: {s.src}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">{t("market.growth")}</h3>
                <p className="text-xs text-[var(--muted-foreground)]">{t("market.growth.sub")} · Indexed (Jul 2025 = 100)</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--muted)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                  AI Confidence 94%
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[oklch(0.55_0.14_150)]"><TrendingUp className="h-3 w-3" />+18.4%</span>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growth} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2} fill="url(#mg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-[10px] text-[var(--muted-foreground)]">
              Source: QuestMobile, Tmall Global Insights · Last updated {LAST_UPDATED}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-[var(--primary)]" />
                <h3 className="text-sm font-semibold">{t("market.keywords")}</h3>
              </div>
              <span className="rounded-full bg-[var(--muted)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                AI Confidence 93%
              </span>
            </div>
            <div className="grid grid-cols-[1.6rem_1fr_auto] gap-x-3 gap-y-3 text-xs">
              <span className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">#</span>
              <span className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Keyword · Platform</span>
              <span className="text-right text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Growth · Score</span>
              {keywords.map((k, i) => (
                <FragmentRow key={k.k} index={i} k={k} />
              ))}
            </div>
            <p className="mt-4 text-[10px] text-[var(--muted-foreground)]">
              Source: Xiaohongshu, Douyin, Weibo, Tmall · {LAST_UPDATED}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--primary)]" />
              <h3 className="text-sm font-semibold">{t("market.regions")}</h3>
            </div>
            <span className="rounded-full bg-[var(--muted)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
              AI Confidence 95%
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="h-64 lg:col-span-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regions} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                  <Bar dataKey="v" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 text-xs">
                <span className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">City</span>
                <span className="text-right text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Demand</span>
                <span className="text-right text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Growth</span>
                {regions.map((r) => (
                  <RegionRow key={r.name} r={r} />
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 text-[10px] text-[var(--muted-foreground)]">
            Source: National Bureau of Statistics of China, QuestMobile · {LAST_UPDATED}
          </p>
        </div>
      </div>
      <WorkflowFooter current="research" />
    </div>
  );
}

function FragmentRow({ index, k }: { index: number; k: { k: string; growth: string; platform: string; score: number } }) {
  return (
    <>
      <span className="self-center text-[11px] tabular-nums text-[var(--muted-foreground)]">{String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{k.k}</p>
        <p className="text-[11px] text-[var(--muted-foreground)]">{k.platform}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-[oklch(0.55_0.14_150)]">{k.growth}</p>
        <p className="text-[11px] tabular-nums text-[var(--muted-foreground)]">Score {k.score}</p>
      </div>
    </>
  );
}

function RegionRow({ r }: { r: { name: string; v: number; growth: string } }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{r.name}</span>
        <div className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--muted)]/60 sm:block">
          <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${r.v}%` }} />
        </div>
      </div>
      <span className="text-right text-xs tabular-nums">{r.v}</span>
      <span className="text-right text-xs font-medium text-[oklch(0.55_0.14_150)]">{r.growth}</span>
    </>
  );
}