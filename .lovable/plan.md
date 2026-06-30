## 问题
项目的「摘要 / 知识库 / 品牌故事 / 品类 / 行业 / 产品 / 品牌语调 / 关键词」在创建时由 AI 用英文写入数据库。切换 UI 语言只翻译外壳，数据库里存的字符串仍是英文，所以中文/韩文界面看到的卡片内容仍是英文。

之前的方案只翻外壳没翻数据，这次必须真正翻译已入库内容，并保证以后新建项目按当前 UI 语言入库。

## 实施计划

### 1. 新建翻译 server fn `src/lib/ai/translate.functions.ts`
- `translateProjectContent({ projectId, targetLocale })`：用 `requireSupabaseAuth` + Lovable AI Gateway (`google/gemini-3-flash-preview`)。
- 读取 `projects` 行的 `name / description / knowledge_base`(jsonb)。
- 构造严格 JSON schema，把以下字段翻译成 `targetLocale`：
  - `description`（摘要）
  - `knowledge_base.industry / category / brandStory / brandTone[] / keywords[] / products[].name & description / competitors[] / targetAudience / marketingCopy / socialChannels[]`（专有品牌名如 "Jeju Samdasoo" 保留原文，但行业/品类/产品描述/标语/关键词翻译）。
- 写回 `projects.description` + `knowledge_base`（增加 `_locale: "zh"|"ko"|"en"` 标记当前语言；保留 `_originalEn` 备份首次抽取的英文版本，便于以后切回）。
- 返回更新后的 project。

### 2. 项目详情页 (`src/routes/_app.projects.$projectId.tsx`)
- 顶部摘要卡和知识库卡片右上加按钮 `t("pd.translateToCurrent")`（如「翻译为中文」/「한국어로 번역」/「Translate to English」）。
- 当 `knowledge_base._locale !== locale` 时按钮高亮提示「内容仍为英文，点此翻译」。
- 点击 → `useMutation` 调 `translateProjectContent({ projectId, targetLocale: locale })` → 成功后 `queryClient.invalidateQueries` + toast。
- 加 loading 态（按钮禁用 + spinner）。

### 3. 项目列表 (`src/routes/_app.projects.index.tsx`)
- 卡片 description 同样依赖 DB 字段；不直接翻译，但当 `_locale !== locale` 时在角标显示「EN」徽章提示用户进入详情翻译。

### 4. 新建项目时按 UI 语言抽取
- `src/lib/ai/extract-knowledge.functions.ts` 增加 `uiLocale` 入参，prompt 里追加「输出字段使用 ${语言}，品牌/产品专有名词保留原文」。
- `src/lib/ai/project-builder.ts` 和创建流程把 `useI18n().locale` 透传到该 server fn。
- 写入 `knowledge_base._locale = uiLocale`。

### 5. 一键全工作区翻译（可选小入口）
- 设置页加按钮「将所有项目翻译为当前界面语言」→ 调批量版本（循环上面的 server fn，限流，前端进度提示）。本期先实现单项目按钮，批量预留接口。

### 6. 切换语言时的提示
- `src/lib/i18n.tsx` 语言切换后，如果当前项目的 `_locale !== 新 locale`，自动 toast「内容仍为 X，请前往项目详情翻译」。

### 技术要点
- 复用 `generateAIOutput` 里的 `callGateway` 调用模式（429/402 错误处理 + JSON 模式）。
- Schema 用 zod 严格定义，AI 必须返回相同结构。
- 数据库无需新列；`_locale` / `_originalEn` 写在 `knowledge_base` jsonb 里。
- 翻译只覆盖文本字段，不动 `companyName`、产品 SKU、URL、社交账号等。
- 失败回退：报错时不写回数据库，toast 显示错误信息。

### 验证
1. 当前韩文界面打开 Jeju Samdasoo → 点击「한국어로 번역」→ 摘要 / 行业(음료) / 品类(천연 미네랄 워터) / 品牌故事 / 标签全部变韩文，品牌名仍为 Jeju Samdasoo。
2. 切到中文 → 按钮变「翻译为中文」→ 点击后变中文。
3. 新建项目时若 UI 为中文，抽取出的 KB 直接是中文，无需再点翻译。
4. 项目列表卡片：未翻译的旧项目右上显示「EN」徽章。
