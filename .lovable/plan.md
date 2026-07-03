## 目标

1. **端到端全流程实测**：用 Playwright 跑一遍 新建项目 → 市场洞察(SEMrush) → 消费者 → 本地化 → 清单 → 报告，每步截图核对数据真实性和 UI 正确性，把发现的问题列成一张表。
2. **新增功能：竞品对比页 (Competitor Comparison)**——用 SEMrush 真实数据做 2-3 个域名的并排对比。

---

## Part 1 · 端到端实测（先做）

跑一个 Playwright 脚本，扮演真实用户：

1. 登录 → `/start` 用 AI 新建一个项目（品牌：某韩妆，目标市场：中国香港，含 website）
2. 进项目详情 → 确认 KB 字段中文正确
3. 进 `China Market Insight` → 点 **Refresh with SEMrush** → 等绿卡出现 → 截图
4. 触发 AI Generate → 等完成 → 截图 → 核对：
   - 顶部 banner 是绿色 verified 而不是橙色
   - KPI 数字是否引用 SEMrush · HK
   - Sources 里是否还有 QuestMobile / Euromonitor 等假源
5. 进 `Consumer Insight` → 截图（已知无真数据，只查显示是否 OK）
6. 进 `Localization Studio` → 截图
7. 进 `Launch Checklist` → 勾选 2 项 → 刷新看是否持久化
8. 进 `Reports` → Generate → 等完成 → 截图 → 核对 executive summary 是否引用 SEMrush

产出：`/tmp/browser/e2e-2026-07-03/` 一组截图 + 一张问题清单（分 P0/P1/P2）。**发现的 bug 会在实测报告里列出，但本次不修**——留给你审批后单独立计划。

---

## Part 2 · 新增「竞品对比」页 (Competitor Comparison)

### 路由 & 入口

- 新文件 `src/routes/_app.competitors.tsx`，URL `/competitors`
- 侧边栏在市场洞察下方加一个新导航项「竞品对比 / Competitors / 경쟁사 비교」

### 页面功能

顶部输入区：
- 你的域名（默认自动填当前项目的 website）
- 竞品域名 1、2、3（可选，最多 3 个）
- 数据库/市场（自动从 targetMarket 映射，可手动改）
- 「拉取真实数据」按钮

数据区（点按钮后）：
- **概览对比表**：每个域名一列，行 = Authority Score / 关键词数 / 月自然流量 / 反链数 / 引荐域名数
- **Top 5 关键词交集/差异**：SEMrush `keyword gap` 逻辑——你没排名但对手排名的词（机会词）
- **每家 Top 3 页面**：`domain_organic` 前 3
- 顶部 verified banner（`Verified · SEMrush · <db> · <timestamp>`）
- 数据 24h 缓存到 `data_snapshots` 表（如无则新建），避免刷爆免费额度

### 技术实现

新增服务端函数 `src/lib/data/semrush-compare.functions.ts`：
- `fetchDomainOverview(domain, db)` → `domain_ranks`
- `fetchTopKeywords(domain, db, n=10)` → `domain_organic`
- `fetchTopPages(domain, db, n=3)`
- `fetchKeywordGap(you, competitors, db)` → 用 `domain_organic` 差集
- 统一走 gateway：`Authorization: Bearer ${LOVABLE_API_KEY}` + `X-Connection-Api-Key: ${SEMRUSH_API_KEY}`
- 免费额度耗尽（`ERROR 134`）→ 返回结构化错误，UI 显示明确提示
- 用 `requireSupabaseAuth` 中间件保护

前端：
- shadcn `Table` + `Card` 展示
- 加载态用 skeleton
- 无数据时显示引导 CTA
- i18n 三语（zh-CN / zh-HK / en / ko）
- 顶部诚实模式 banner 复用 `DataIntegrityBanner`

### 不做的事（避免范围膨胀）

- 不做导出 PDF（如你想要，之后单独立计划）
- 不做历史趋势对比（SEMrush 历史数据要 Business 套餐）
- 不动 Report 生成逻辑

---

## 输出顺序

1. 先跑 E2E 实测，把截图和问题清单交给你
2. 你决定是否要先修 bug 再做竞品页，还是直接做竞品页
3. 竞品页实现（新文件 3 个 + 侧边栏 1 处改动 + i18n keys）

要我按这个计划开工吗？