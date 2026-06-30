## 目标
让所有界面在中文/韩文模式下真正完整本地化，并修复几个明显的功能/体验缺陷。

## 问题诊断
1. **项目详情页 (`/projects/$projectId`)** 大量硬编码英文：`Edit / Duplicate / Archive / Delete / Cancel / Save / Knowledge Base / Company / Industry / Category / Products / Brand Story / Brand Tone / Keywords / Competitors / Target Audience / Korean Marketing Copy / Website / Social Channels / Edit project / Brand name / Target market / Status / Description / Restore` 等都不走 `t()`。
2. **报告 / 报告详情 / 上市清单 / AI 工作台 / 本地化工作室 / 消费者洞察 / 市场洞察 / 项目列表** 也仍有硬编码英文按钮和标题（`Generate report` / `Generate with AI` / `Generate report with AI` / 默认 phase 名 / 默认 channel & tone 标签 等）。
3. **AI 生成内容**（Market / Consumer / Localization / Report / Launch）目前总是用英文输出，因为 prompt 没有声明 UI 语言。中文用户看到的「摘要 / KPI / 关键词 / 报告」自然全是英文。
4. **项目摘要 / Knowledge Base 字段**是入库时由 AI 用英文写入的纯数据；切换语言不会改变数据库里的字符串。
5. **删除/归档确认**仍用浏览器原生 `confirm()`，与产品风格不符且无法本地化。
6. Toast 文案（`Project updated / Could not save / Project deleted ...`）也是英文硬编码。

## 实施计划

### 1. i18n 字典扩充 (`src/lib/i18n.tsx`)
为以下命名空间补齐 `en / ko / zh` 三套键：
- `pd.*`（项目详情：actions、edit form、KB 面板、字段名、确认提示、toast）
- `kb.field.*`（Company / Industry / Category / Products / Brand Story / Brand Tone / Keywords / Competitors / Target Audience / Local Marketing Copy / Website / Social Channels）
- `report.*`（生成按钮、空状态、分享、导出、章节标题）
- `launch.*`（默认 phase / item 标签、Generate with AI）
- `loc.channel.* / loc.tone.* / loc.audience.*`（已有 key 但渲染时仍直接显示 `id`，要改为 `t(key)`）
- `workspace.*`（AI 工作台空态、phase 名）
- `common.*`（Cancel / Save / Edit / Restore / Archive / Duplicate / Delete / Generating… / Confirm / Loading…）

### 2. 路由页 i18n 改造
- `src/routes/_app.projects.$projectId.tsx`：所有按钮、标题、`Field label`、`KV label`、`confirm()` 文案、`toast.*` 全部替换为 `t()`；`confirm()` 改用 shadcn `AlertDialog`。
- `src/routes/_app.launch-checklist.tsx`：默认 phases/items 改成 `{ key, labelKey }`，渲染用 `t(item.labelKey)`；"Generate with AI" → `t("launch.generate")`。
- `src/routes/_app.reports.tsx` & `src/routes/_app.report.tsx`：标题、生成按钮、空态、分享提示、`navigator.share` title 走 `t()`；导出 PDF 按钮文案本地化。
- `src/routes/_app.localization-studio.tsx`：渲染 channel/tone/audience chip 时显示 `t(opt.key)` 而非 `opt.id`。
- `src/routes/_app.china-market-insight.tsx` / `_app.consumer-insight.tsx` / `_app.ai-workspace.tsx` / `_app.projects.index.tsx`：剩余硬编码英文按钮、占位文案、phase 标签统一接 `t()`。

### 3. AI 输出语言本地化
- 在 `src/lib/ai/generate.functions.ts` 的 `GenerateInput` 加 `uiLocale: "en" | "zh" | "ko"`。
- `schemaFor()` 的 system prompt 追加："Respond in {locale}. All free-text fields (summary, sections, notes, labels) MUST be in that language. Keep JSON keys in English."
- `lovableProvider.run()` 从 `input.projectContext` 或新参数读 locale 并透传。
- `src/lib/ai/use-ai-job.ts`（或调用点）读取 `useI18n().locale` 注入。
- `src/lib/ai/extract-knowledge.functions.ts` 的抽取也改成按当前 UI 语言输出 KB 字段（同时保留原文 raw 字段，便于后续切换语言时重抽取）。

### 4. 历史数据兼容
- 项目详情页 / 摘要 / KB：若发现某字段语言与当前 UI locale 不一致，在 KB 面板和摘要卡片右上角加 "用 AI 翻译为中文 / 韩文 / 英文" 按钮，调用一次新的 `translateProjectText` server fn（同样走 Lovable AI Gateway），把结果写回 `projects.description / summary / knowledge_base`。
- 对 AI 生成的 Market / Consumer / Localization / Report job 不重写历史结果；用户可点 "重新生成" 让新输出用当前语言。

### 5. 其它顺手修复
- 顶部下拉里语言切换后，调用 `router.invalidate()`，让仍用 loader 数据的页面立刻刷新。
- `_app.projects.$projectId.tsx` 中 `useEffect(..., [project?.id])` 缺依赖告警：补齐 `project` 引用或忽略 lint 注释。
- `navigator.share` 不可用时已经回落到 clipboard，但要本地化提示文案。

### 技术说明
- 不新增数据库列；KB 翻译直接覆盖 `knowledge_base` jsonb。
- AlertDialog 已在 `src/components/ui/alert-dialog.tsx`，可直接复用。
- AI prompt 语言指令仅影响 free-text，schema key 保留英文以免破坏前端字段解析。
- 翻译 server fn 与 `generateAIOutput` 共用 `callGateway` 调用方式 + 429/402 处理。

### 验证
- 切换 ZH / KO / EN：侧栏、顶栏、项目详情、KB 面板、Launch Checklist、Reports、AI Workspace、Localization Studio 全部文字跟随切换。
- 新建项目后用中文 UI 生成 Market Insight：摘要、KPI 描述、关键词解释为中文，JSON 字段仍可解析。
- 旧项目英文摘要，点 "翻译为中文" 后页面立即显示中文摘要并入库。
- 删除/归档弹出 AlertDialog 而非浏览器原生窗口。