import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Bar, BarChart, ResponsiveContainer, Area, AreaChart, XAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, MapPin, Flame } from "lucide-react";

export const Route = createFileRoute("/_app/china-market-insight")({
  head: () => ({ meta: [{ title: "China Market Insight — BridgeCN AI" }] }),
  component: MarketInsightPage,
});

const growth = Array.from({ length: 12 }, (_, i) => ({
  m: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"][i],
  v: Math.round(120 + Math.sin(i / 1.5) * 18 + i * 6),
}));

const regions = [
  { name: "Shanghai", v: 92 },
  { name: "Beijing", v: 78 },
  { name: "Shenzhen", v: 71 },
  { name: "Hangzhou", v: 64 },
  { name: "Chengdu", v: 51 },
  { name: "Guangzhou", v: 47 },
];

const keywords = [
  { k: "玻璃肌", v: "+42%" },
  { k: "成分党", v: "+38%" },
  { k: "韩系护肤", v: "+27%" },
  { k: "早C晚A", v: "+19%" },
  { k: "纯净护肤", v: "+14%" },
  { k: "敏感肌", v: "+11%" },
];

function MarketInsightPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="China Market Insight"
        description="Real-time market sizing, regional demand and competitive signals from across China."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Addressable market", value: "¥48.2B", sub: "K-beauty · 2026E" },
          { label: "YoY growth", value: "+18.4%", sub: "Tmall + Xiaohongshu" },
          { label: "Top tier cities", value: "62%", sub: "Share of demand" },
          { label: "Avg basket", value: "¥384", sub: "Premium tier" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Market growth · 12 months</h3>
              <p className="text-xs text-[var(--muted-foreground)]">K-beauty category GMV (¥B)</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[oklch(0.55_0.14_150)]"><TrendingUp className="h-3 w-3" />+18.4%</span>
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
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center gap-2">
            <Flame className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold">Trending keywords</h3>
          </div>
          <ul className="space-y-3">
            {keywords.map((k, i) => (
              <li key={k.k} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs tabular-nums text-[var(--muted-foreground)]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-sm font-medium">{k.k}</span>
                </div>
                <span className="text-xs font-medium text-[oklch(0.55_0.14_150)]">{k.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold">Regional demand</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regions} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
              <Bar dataKey="v" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
