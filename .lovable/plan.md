## 目标

在现有导航中新增一个 **Competitors / 竞品对比 / 경쟁사 비교** 页面，用 SEMrush 真实数据做 2–3 个域名的并排 SEO 对比。所有数据带 verified 徽章 + 时间戳，绝不虚构。

---

## 页面 UX

路由 `/competitors`（新文件 `src/routes/_app.competitors.tsx`），侧边栏在「China Market Insight」下方加入口。

**顶部输入区**
- 你的域名（默认从当前项目 `knowledgeBase.website` 自动填入）
- 竞品域名 1、2（必填），竞品 3（可选）
- 数据库（下拉：`us / uk / hk / cn / kr / jp`，从 `targetMarket` 自动映射，可手改）
- 「拉取真实数据」按钮
- 顶部复用 `DataIntegrityBanner`：有数据 → 绿色 `Verified · SEMrush · <db> · <timestamp>`；无 → 灰色引导

**数据展示区**（三张卡）
1. **概览对比表**：每个域名一列，行 = Authority Score / Organic Keywords / Est. Monthly Traffic / Backlinks / Referring Domains
2. **各家 Top 5 关键词**：三列并排，每列一张小表（keyword、position、volume）
3. **机会关键词 (Keyword Gap)**：对手排名前 20 但你没排名的词，Top 10 展示，标注是哪个对手贡献的

**加载态**用 shadcn Skeleton；错误态区分两种：
- `ERROR 134 :: TOTAL LIMIT EXCEEDED` → 明确提示「SEMrush 免费额度已用完，请等 24h 或升级」
- 其它错误 → 通用错误 + 重试按钮

---

## 技术实现

**新文件 `src/lib/data/semrush-compare.functions.ts`**（服务端函数，`requireSupabaseAuth` 保护）
- `fetchCompareSnapshot({ you, competitors[], db })` 一个入口，内部并发调用：
  - `domain_ranks`（每个域名一次）→ Authority Score / 关键词数 / 流量 / 反链
  - `domain_organic`（每个域名一次，limit=5）→ Top 关键词
  - Keyword gap：拉每家 `domain_organic` limit=20，做差集
- 统一 gateway header：`Authorization: Bearer ${LOVABLE_API_KEY}` + `X-Connection-Api-Key: ${SEMRUSH_API_KEY}`
- 检测 `ERROR 134` → 返回 `{ error: "quota_exceeded" }`
- 结果结构化返回 DTO，24h 缓存到 `projects.competitor_snapshot` JSONB（避免刷爆额度）

**Schema 变更**（单独一次 migration）
- `ALTER TABLE public.projects ADD COLUMN competitor_snapshot jsonb`
- 无新表，无新 GRANT / RLS 变更

**新文件 `src/routes/_app.competitors.tsx`**
- shadcn `Card / Table / Input / Button / Skeleton`
- 复用 `useWorkspace()` 拿当前 project + `knowledgeBase.website`
- 复用 `DataIntegrityBanner`

**i18n**
- 在 `src/lib/i18n.tsx` 加 `competitors.*` keys（英/中/韩三语）

**导航入口**
- `src/components/app-shell.tsx` 侧边栏加一项（如已在结构中）

---

## 不做的事

- 不做 PDF 导出（另立计划）
- 不做历史趋势（SEMrush 历史数据要 Business 套餐）
- 不改 Reports / China Market Insight 现有逻辑
- 不加新表、不改 RLS

---

## 交付清单

| 文件 | 动作 |
|---|---|
| `src/lib/data/semrush-compare.functions.ts` | 新建 |
| `src/routes/_app.competitors.tsx` | 新建 |
| `src/components/app-shell.tsx` | 加导航项 |
| `src/lib/i18n.tsx` | 加 `competitors.*` keys |
| DB migration | `projects.competitor_snapshot jsonb` |

完工后跑一次 `bun run lint` + typecheck，无误即可。
