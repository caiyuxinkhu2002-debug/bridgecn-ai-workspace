## 数据真实性审核结论

**结论：现在页面上 95% 的数字都不是真实数据。** SEMrush 虽然连上了，但只成功拉到一条"域名总览"的空数据，剩下所有 KPI、关键词、城市、增长曲线、来源引用全部仍是 AI 编的。

### 具体问题

1. **市场代码映射错了**
   - 项目目标市场是"Hong Kong / 中国香港"，但 SEMrush 实际查的是 **US 数据库**（绿色卡里写着 `SEMrush · US`）
   - `marketToDatabase()` 里没有 Hong Kong / HK 的正则，香港落入了默认 `us`
   - 域名 `3cecosmetics.co.kr` 在 US 库里当然查不到 → "0 keywords · 0 monthly traffic" + `domain_domains: Bad request`

2. **真数据没流进 KPI / 图表**
   - 即便 SEMrush 返回了 organicTraffic，UI 上的 4 个 KPI（+22.5%、HK$480、4.8%、12%）、12 个月增长曲线、6 个 trending keywords、5 个城市 demand 全是 AI 凭空写的
   - 顶部仍标"AI estimate · Beauty category benchmark" → 说明 prompt 里 `extra.semrush` 即使有数据，模型也没被强制使用

3. **来源引用是假的（最严重）**
   - "Euromonitor"、"HKRMA"、"QuestMobile"、"Tmall Global Insights"、"Xiaohongshu Red Trend Report"、"Sasa & Sephora Performance Data" —— 这些 BridgeCN 一个都没真的查过
   - 系统提示词里其实写了"不许引用没查过的机构"，但模型还是编了 → 约束没生效

4. **Report 页 provenance 错乱**
   - 报告第一段还写着"Click 'Refresh with SEMrush' above to ground numbers" —— 但 Report 页根本没这个按钮，按钮在 China Market Insight 页
   - 而且 market job 的 output_data 没真的把 SEMrush 快照带进 report 的 extra

5. **Consumer Insight / Localization / Launch Checklist 完全没接真数据**
   - 三个页面顶部都还挂着橙色"AI strategic estimate"横幅，但根本没有"Refresh with real data"按钮 → 用户没有任何途径让这些页面用上真数据
   - Launch Checklist 里出现 `Market_localization_compliance` 这种 raw key 当成阶段名显示 → i18n / fallback bug

6. **小 UI bug**
   - Regional demand 柱状图 x 轴少了第一根柱（Causeway Bay）的标签
   - Localization Studio 上方步骤条永远显示"Completed"灰色态，不区分当前进度

---

## 优化计划（按优先级）

### P0 · 真把数据接进去（最关键）

**a. 修复市场代码映射**
- 在 `src/lib/data/semrush.functions.ts` 的 `marketToDatabase()` 里加：
  - `hong kong / 香港 / hk` → `hk`
  - `taiwan / 台湾 / 台灣 / tw` → `tw`
  - `singapore / 新加坡 / sg` → `sg`
- 当 targetMarket 含"Hong Kong"时优先匹配 `hk` 而不是被 `china` 抢走

**b. domain_domains Bad request 兜底**
- 部分 SEMrush 免费档不开放 `domain_domains`（竞品接口）—— 收到 Bad request 时跳过竞品调用、只保留 domain_ranks + 关键词，避免一个接口失败带崩整个快照

**c. 把真数据 hard-wire 进 UI，不再依赖 AI "选择性使用"**
- China Market Insight 页加一个 `useVerifiedSnapshot` hook：
  - 当 SEMrush 快照存在时，直接用真值覆盖：
    - "Brand Search Interest" KPI → SEMrush organic traffic 月环比
    - "Trending keywords" 表 → SEMrush phrase_this 返回的 volume/cpc
    - 顶部 chip 标签从橙色"AI estimate"变绿色"Verified · SEMrush · HK"
  - AI 只负责写文字 summary，不再负责造数字
- 把 AI 生成的"虚 KPI"和真 KPI 视觉上分开（绿勾 vs 黄三角）

**d. 砍掉假来源**
- 强化系统提示词：`sources` 数组只允许两类值
  1. `Verified · SEMrush (<database>)` —— 当且仅当有 SEMrush 快照
  2. `AI inference · category benchmark` —— 兜底
- 任何机构名（Euromonitor、QuestMobile、HKRMA、Tmall Insights 等）一律禁止出现
- 在 server 端 post-process：用正则把已知机构名从 sources 里直接删掉，模型再调皮也兜得住

### P1 · Report 页真的引用 market job 的真数据

- Report 生成时检查 latest market job 的 `output_data.semrush` 字段是否存在
  - 有 → executive summary 第一段改为"Verified data from SEMrush HK as of {date}; AI 解读基于此"
  - 无 → 提示用户"先去 China Market Insight 页点 Refresh with SEMrush，否则报告里的数字仅供参考"
- Report 顶部加一个 `Data sources` 区块，列出真实用到的接口名 + 拉取时间

### P2 · 其他三个页面也接上 SEMrush（可选）

- Consumer Insight：把 SEMrush keyword volume 当作 "audience search interest" 真信号灌进 personas
- Localization Studio：用 SEMrush 关键词的 HK 中文 phrase_this 结果作为 SEO keywords，不要让 AI 自己造词
- Launch Checklist：去掉橙色 banner，因为这页本来就是流程清单不需要数据

### P3 · UI/i18n 小修

- Launch Checklist 阶段名 `Market_localization_compliance` 改成正常的 i18n key
- Regional demand 图 x 轴补全 Causeway Bay 标签
- 把"Refresh with SEMrush"按钮迁移成全局可见，4 个页面都能触发，统一一次拉、四处用

---

## 实施顺序建议

1. **本轮**：P0 全做完（市场映射 + 兜底 + 真数据 hard-wire + 砍假来源）
2. **下一轮**：P1（Report 页 provenance）
3. **再下一轮**：P2 + P3 按需

做完 P0 之后，你在 China Market Insight 页再点一次 Refresh with SEMrush，绿卡里应该会显示 `Verified · SEMrush · HK · 3cecosmetics.co.kr · X keywords · Y monthly traffic`，下方 4 个 KPI 至少有 1-2 个变绿勾，AI summary 第一句话会明确写"基于 SEMrush HK 实测数据"，而且 sources 里不会再出现 Euromonitor / QuestMobile 等编出来的名字。

要我现在就执行 P0 吗？还是先调整下优先级？
