## 老实说:现在能用,但"数据准确"达不到

先把现状说清楚,再说怎么改。

### 现在跑起来后实际发生了什么

1. **新建项目时**(`extract-knowledge.functions.ts`):✅ 真的去抓你填的官网 HTML(home + about/product 子页),然后丢给 `google/gemini-3-flash-preview` 让它提取品牌/产品/卖点。这一步是**真实的**——基于你网站上真实存在的内容。
2. **市场洞察 / 消费者洞察 / 本地化 / 上市清单 / 报告**(`generate.functions.ts`):⚠️ 全部是 LLM**凭训练知识"编"出来的**。
   - "数据来源:艾瑞咨询/QuestMobile/天猫国际"——是模型自己写的字符串,**没有真的查过**这些库。
   - KPI 数字、地域销量柱状图、月度增长指数、关键词热度分——都是模型**合理猜测**,不是从百度指数/小红书/Tmall 拉的真实数据。
   - 信心度百分比也是模型自评。
3. 也就是说:文字分析框架"看起来很专业"且符合品类逻辑,但**任何具体数字都不能直接给客户当决策依据**。

如果你的标准是"让客户百分百投入使用、数据准确",当前形态**不达标**,必须接真实数据源。

---

## 修复方案

分两层做:**底层接真数据源**(SEMrush + 实时网页搜索)+ **UI 诚实标注**(哪些是真数据、哪些是 AI 推断)。

### 1. 接入 SEMrush 作为关键词/竞品/SEO 真实数据源
本环境已经有 `semrush--*` 工具族(keyword_research、serp_analysis、competitive_analysis、domain_analysis、top_pages、backlink_analysis 等),这是**业内付费数据库**,数字真实。

新建 `src/lib/data/semrush.functions.ts`(`createServerFn` + `requireSupabaseAuth`),封装:
- `fetchKeywordData(keywords[], market)` → 真实月搜索量、CPC、竞争度、趋势
- `fetchCompetitorData(domain, market)` → 真实流量、关键词重叠、反链
- `fetchSerpData(keyword, market)` → 真实 SERP 前 10

市场洞察页生成时:
- 先用 KB 里的 `keywords[] + competitors[] + website` 调 SEMrush 拿**真实数字**
- 再把真实数字作为 `extra` 喂给 Gemini,让它**只负责解读**,不再编数字
- UI 上的"趋势关键词表/地域柱状图/竞品对比"全部换成 SEMrush 返回的字段,每行加 `Source: SEMrush · {date}` 角标

### 2. 实时网页搜索为 LLM 提供 grounding
新建 `src/lib/data/web-research.functions.ts`,用 `websearch--web_search` 工具风格的服务端实现(或直接调用 Brave/Tavily;若仅用现成的,先以服务端 `fetch` + Bing Web Search 公开 API 通过 `add_secret` 引导用户加 Key)。
- 在市场/消费者洞察生成前,自动跑 3–5 条针对性查询(品牌名+目标市场、品类+小红书/Tmall、竞品+评测)
- 摘要前 5 条结果(标题+片段+URL)拼进 `extra.webContext`
- system prompt 改成"严格基于 PROJECT CONTEXT + SEMrush DATA + WEB SEARCH RESULTS,如无证据则写 'Insufficient data',禁止编造数据"
- 报告里的"数据来源"列**只显示真正用到的 URL/SEMrush 报表**,不再让模型自由生成来源名

### 3. 让生成步骤"按顺序"且每步可验证
当前 china-market-insight / consumer / localization / launch / report 各自独立按钮,顺序靠用户记。改成在项目详情页加 **"开始市场进入分析"主流程**:
- 步骤 1 知识库就绪 → 2 市场洞察 → 3 消费者洞察 → 4 本地化 → 5 上市清单 → 6 报告
- 后一步自动把前一步的 `output_data` 通过 `extra` 透传(报告已经做了,扩展到 2→3→4→5)
- 每步完成后才解锁下一步按钮;失败不能跳过
- 顶部固定显示一条进度条,与 `project_checklist` 表同步

### 4. UI 诚实标注 + 数据溯源
- 每张卡片右上角加"数据等级"徽章:`Verified`(SEMrush/网页抓取)/`AI estimate`(模型推断)/`Manual`(用户输入)
- 每个 KPI / 关键词行 hover 弹出 popover 显示**真实来源 URL** 或 "AI inferred — no public dataset"
- 报告导出顶部加 disclaimer:"Numbers marked AI estimate are model inferences, not verified market data. Verified rows use SEMrush + cited web sources."

### 5. 后端数据持久化
- `ai_jobs.output_data` 已存,够用;再加一个新表 `data_snapshots(project_id, source, payload jsonb, fetched_at)` 缓存 SEMrush 结果 24h,避免重复消耗 API quota
- 迁移文件含 GRANT + RLS(scoped to workspace member)

### 6. 必需密钥
- SEMrush 工具走 Lovable 内置(已可用,不需要用户密钥)
- Web search:如果选 Tavily/Brave,会触发 `add_secret` 流程问用户要 Key;Bing Web Search 也是
- 如果你不想让用户出 Key,可以仅用 SEMrush(已经能覆盖 60% 的"真实数据"诉求)

---

## 技术要点
- 所有外部数据调用都在 `createServerFn` + `requireSupabaseAuth` 里,Key 走 `process.env`,不暴露前端
- LLM 调用从"自由发挥"改成"strict grounding":system prompt 明确"missing data → write Insufficient data,don't fabricate"
- 失败降级:SEMrush 429 → UI 显示"数据源限流,2 分钟后重试",**不**让 LLM 编一份顶上(这是目前最大问题)
- i18n:新增字段(data badge、来源、disclaimer)按之前模式补 en/ko/zh

---

## 你需要先决定 2 件事

1. **数据源范围**:只接 SEMrush(免费、立即可用、覆盖关键词/竞品/SEO),还是再加 Web Search(需要你出一个 API Key)?
2. **接下来要不要保留"AI estimate"的卡片**?保留 = 信息全但要标注;只显示 verified = 干净但数据少很多。

确认后我开工。

