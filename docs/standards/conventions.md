# 开发约定（conventions）

> 用途：开发新功能时"**该怎么写**"的项目约定（前端 + 后端 + 动画合一）。这是项目所有"硬约定"的**唯一事实来源**——审查时"什么算 bug"见 `review-scope.md`，它引用本文档判级。
>
> 约定均**提炼自现有代码的既成做法**，不是凭空发明。标注「**硬约定**」的违反即 bug（按 `review-scope.md` 分级）；「建议」属偏好/技术债，不强制。
>
> **不在此复述命令**：`generate:bindings`、提交前自检（typecheck/lint/check:rust/precommit）等命令一律以 `CLAUDE.md`「关键命令」表为准，本文档只引用、不抄写。

---

## 通用

### 目录结构（前后端按模块自包含、一一对应）

前端 `src/features/<模块>/`：

| 目录 | 放什么 |
|---|---|
| `api/` | 与后端通信封装（含 `mock/`、`fallback/`、真实实现） |
| `config/` | 模块常量、配置 |
| `hooks/` | 模块内自定义 hook |
| `models/` | 业务模型转换（DTO ↔ 视图模型） |
| `queries/` | TanStack Query 的 query/mutation hook + queryKeys |
| `stores/` | 客户端本地状态（非服务端状态） |
| `ui/` | 组件；复杂模块按子页面分目录，模块内复用放 `ui/<模块>/_shared/` |
| `types.ts` | 模块对外类型 |

后端 `src-tauri/src/<模块>/`：`db.rs`（建表/迁移/seed）、`repository.rs`（SQL + 业务逻辑）、`commands.rs`（`#[tauri::command]`，前端唯一入口）、`dto.rs`（跨 IPC 结构，serde + specta）。

模块清单：`beliefs / emotion / events / finance / future / growth / legacy / memory / nutrition / overview / principles / reflection / relationships / shopping / socioeconomics`。

- **硬约定**：新功能放进对应模块、复用现有模式，**不在 `features` / `src-tauri/src` 之外另起炉灶**。

### 类型契约

- **硬约定**：改了 Tauri command（参数/返回结构）后必跑 `generate:bindings` 刷新 `src/bindings.ts`（命令见 CLAUDE.md）；前端**不得手写/修改 `bindings.ts`**。

---

## 前端

### F1. 组件复用三层

按"复用范围"决定组件放哪：

- **`src/components/ui/`**：跨模块通用基础组件（shadcn 体系，如 `button/dialog/form/table/multi-select/transfer-list` + 动画类 `animated-visibility`）。新基础组件优先 shadcn 风格放这。
- **`ui/<模块>/_shared/`**：单模块内多页面复用（如 `shopping-sortable-card.tsx`）。
- **就地写**：只一处用到的，不提前抽象。
- **建议**：第 2 个使用方出现才上提到 `_shared`，跨模块才上提到 `components/ui`。

### F2. 动画

- **硬约定**：统一 `motion/react`，用 `LazyMotion` + `m`（**不要** `motion.div`，bundle 体积）。
- **硬约定**：动画参数（easing/duration/spring/presence）复用 `src/lib/app-motion.ts` 语义常量（`APP_FADE_TRANSITION` 等），**不硬编码魔法数字**。模块专属动画放 `<模块>-motion.ts`，数值仍引用 `app-motion.ts`。
- **硬约定**：位移/缩放/旋转动画必须有 `useReducedMotion` 降级。优先用已封装的 `AnimatedVisibility`（`src/components/ui/animated-visibility.tsx`，内置 `AnimatePresence` + reduced-motion 兜底）。
- **硬约定**：`AnimatePresence` 列表项用**稳定唯一 key**（业务 id，不用数组 index）。
- **建议**：克制。缺动画不是错；优先清晰不卡顿而非炫技。

### F3. 表单与输入校验

- **硬约定**：表单校验统一用 **zod v4 schema** + `@hookform/resolvers` 的 `zodResolver` 接入 react-hook-form。规则集中在一处 schema，**不要**在组件里散落手写 `if (name.trim() && tags.length>=1)` 这类 `canSubmit`，也不要在 `handleSubmit` 里逐字段 `if/return`。
- **硬约定**：关键提交按钮在校验未通过时必须 `disabled`，不能只靠"点了再弹错"。
- **硬约定**：用户填了内容却被过滤/丢弃时（如空名子项），必须 `toast.warning` 提示，禁止静默丢弃。
- **硬约定（对存量同样生效）**：现有的散落手写校验（多条 `&&` 拼 `canSubmit`、`handleSubmit` 里逐字段 `if/return`）一律视为待迁移项——**审查时照报，开发期碰到含手写校验的表单必须就地改成 zod，不豁免**。

### F4. 服务端状态（TanStack Query）

- **硬约定**：queryKey 统一走工厂 `queries/workspace-query-keys.ts`（`workspaceQueryKeys.<模块>()`），不手写字符串数组当 key。
- **硬约定**：mutation `onSuccess` 里 `invalidateQueries`，标准是同时失效 **`snapshot()` + 该模块 key**（参考 `use-save-finance-mutation.ts`）。漏掉会显示旧数据——第一档 bug。
- **硬约定**：mutation `onError` 里必须给用户反馈（`toast.error`，文案走 i18n）；需要额外恢复的（如重置表单、回滚本地草稿）在 `onError` 一并做。**禁止 mutation 失败后静默无提示**。
- **硬约定（状态归属）**：服务端数据归 Query；纯客户端 UI 状态（弹窗开关、草稿、选中项、本地偏好）归 zustand 或组件 state。**不要把服务端数据塞进 zustand 维护副本**。
- **现状**：客户端状态用 zustand（`stores/`，如 `locale-store.ts`，可配 `subscribeWithSelector`）；跨模块共享才进 `stores/`，单组件用 `useState`。
- **乐观更新（默认不用）**：当前统一"成功 → invalidate 重拉"，简单可靠，**优先保持**。若确需乐观更新，**必须完整四步**：`onMutate`（cancelQueries → 快照 → 改缓存 → 返回回滚上下文）+ `onError` 用快照回滚 + invalidate 放 `onSettled`。**半吊子乐观更新（改了缓存不回滚）算第一档 bug**——要么完整做，要么别做。
- **约定**：query hook 命名 `use-<x>-query.ts`，mutation 命名 `use-save-<x>-mutation.ts`，放 `queries/`。

### F5. 国际化 i18n

- **硬约定**：所有用户可见文案必须走 `t(...)`，禁止硬编码中/英文到 JSX（toast 文案同此）。
- **现状结构**：单一 `translation` 命名空间，文案按模块拆分为 `src/i18n/locales/{zh,en}/*.json`（19 个模块文件），`config.ts` 合并加载。key 点分层级（`shopping.tabs.overview`），默认/兜底语言 `zh`。
- **硬约定（译文单一来源，禁止内联兜底）**：调用点只写 `t("模块.分类.具体")`，**不传第二个参数的内联默认文案**（`t("x", "可能限制我的观念")` / `t("x", { defaultValue: "..." })` 一律禁止）。译文**唯一存在于 `src/i18n/locales/zh.json`**。
  - 原因：内联默认值与 json 重复且会漂移——key 一旦在 json 里（现状 98% 都在），i18next 用的是 json 值，那句内联中文是被忽略的死代码，只会误导。
  - **缺 key 的统一处理**：不用每处写兜底。key 缺失时 i18next 默认返回 key 字符串本身（如 `beliefs.signals.limiting`），这是开发期"该补翻译了"的可见信号，比散落一堆内联中文更好。
- **写法**：新增 key 用 `模块名.` 前缀归类（通用动作走 `common.actions.*`，见下条），**同时补 `zh.json` 与 `en.json`**（en 缺失会 fallback 到 zh，但应补齐）。
- **硬约定（缺失 key 先查 common）**：审查或新增 key 时，**先扫描下一条「通用已覆盖」表**，确认 `common.*` 中是否已有语义等价的 key。如果 `common.filter.label` 已经是"筛选"，就不要再为某个模块新增 `nutrition.logs.filterTitle` 之类冗余 key —— 这比"新增一个缺失 key"更优先。**新增模块私有 key 的前提是：`common.*` 中确实没有等价文案**。
- **硬约定（通用动作文案全局收口）**：跨模块复用的通用动作/状态文案**统一用 `common.actions.*` 一处定义**，不再各模块各起 key。覆盖：`save`(保存) / `saving`(保存中) / `cancel`(取消) / `delete`(删除) / `deleting`(删除中) / `confirm`(确定) / `close`(关闭) / `edit`(编辑) / `add`(添加) / `create`(新建) / `deleted`(已删除) / `undo`(撤销) / `retry`(重试) 等。新代码一律 `t("common.actions.save")`，**禁止再写 `shopping.save` / `nutrition.common.save` / `xxx.editor.save` 这类模块私有的通用动作 key**。只有**带模块语境的特定文案**（如"保存这餐记录""删除该关系"）才放模块命名空间。
  - 现状：同一个"保存"散落成 10+ 个 key、"删除"30+ 次（`relationships.common.delete` / `shopping.delete` / `journey.actions.delete` …），属存量重复，待向 `common.actions.*` 收敛（见文末改造清单）。`common` 命名空间已存在（现有 `common.filter.*`）。
- **硬约定（校验文案分层组织）**：校验/错误提示文案按以下三层放置，**不混放**：
  - **`common.validation.*`**：带参数的通用校验模板，可跨模块复用。例如 `required`（"请填写{{field}}"）、`maxLength`（"{{field}}最多 {{count}} 个字符"）、`maxItems`、`invalidOption`、`nonNegative`、`integer`、`maxNumber`、`invalidJson`、`jsonArray`、`invalidForm` 等。调用方传参数渲染：`t("common.validation.required", { field: "标题" })`。
  - **`<模块>.validation.*`**：该模块专属的、有具体业务语义的校验文案。例如 `finance.edit.validation.amountPositive`（"金额需要大于 0"）、`nutrition.recipes.validation.stepsRequired`（"请至少填写一个步骤"）。
  - **`<模块>.error.*`**（可选）**：更偏向系统级/格式错误的提示（如 `shopping.error.codeEmpty`、`shopping.error.rankInvalid`），与用户输入校验区分。
  - **禁止**：把通用模板放具体模块下（如曾将 `required`/`maxLength` 放在 `shopping.validation`）、把模块专属校验塞进 `common.validation`、在各模块重复定义同质通用校验 key。

#### F5.1 模块 key 按业务层分离的层级结构

> 以下是全项目 zh.json 提炼的**事实标准**——每个模块命名空间下的 key 按"业务职责"分到固定子层级。新增模块 key 时遵循此结构，不另造组织方式。

每个模块 `Xxx` 的 key 结构如下（按出现频率从高到低）：

| 子层级 | 职责 | 示例 |
|--------|------|------|
| `Xxx.page.*` | 页面级元信息（标题、描述、eyebrow） | `shopping.page.title`："生活物品分类工作台" |
| `Xxx.tabs.*` | Tab 名称 | `beliefs.tabs.entries`："观念清单" |
| `Xxx.actions.*` | **模块专属操作**（有别于通用 `common.actions.*`） | `journey.actions.addMemory`："新增记忆" |
| `Xxx.fields.*` | 表单字段标签 | `finance.edit.fields.date`："日期" |
| `Xxx.empty.*` | 空状态文案 | `emotion.empty.checkIns`："还没有情绪记录。" |
| `Xxx.toast.*` | 操作反馈提示（toast） | `beliefs.toast.deletePending`："已加入删除队列..." |
| `Xxx.edit.*` | 编辑弹窗专用文案（标题、描述、字段、校验） | `legacy.edit.createTitle`："新增生命整理条目" |
| `Xxx.validation.*` | 模块专属校验文案 | `nutrition.recipes.validation.stepsRequired` |
| `Xxx.error.*` | 模块专属错误/格式提示 | `shopping.error.codeEmpty`："代码不能为空" |
| `Xxx.enum.*` / `Xxx.enumNames.*` | 枚举/选项的中文映射 | `finance.enum.direction.expense`："支出" |
| `Xxx.classification.*` | 分类维度说明 | `beliefs.classification.domain.title`："领域" |
| `Xxx.confirm.*` | 模块专属确认/删除确认弹窗文案 | `journey.confirm.deleteMemory`："确定删除..." |
| `Xxx.overview.*` | 总览页面/区块文案 | `shopping.overview.currentFocus`："当前该先看什么" |
| `Xxx.filter.*` | 筛选器文案 | `shopping.filter.all`："全部" |
| `Xxx.sections.*` | 页面分区标题/描述 | `reflection.sections.draft.title`："写作起点" |
| `Xxx.placeholders.*` | 输入占位提示 | `events.placeholders.title`："例如：和朋友聊未来城市选择" |
| `Xxx.form.*` | 表单区域分组/辅助文案 | `beliefs.form.basic`："基本内容" |
| `Xxx.search.*` | 搜索相关文案 | `events.search.active`："当前筛选：{{query}}" |
| `Xxx.metrics.*` | 统计/度量指标标签 | `legacy.metrics.total`："条目总数" |

**判断某文案放通用还是模块命名空间的决策树：**

```
该文案是否只服务于这一业务模块？
├── 是 → 放 <模块>.<子层级>.<具体>
├── 否 → 多个模块会用到吗？
│   ├── 是 → 放 common.<子层级>.<具体>
│   └── 否 → 放 <模块>.<子层级>.<具体>（仍是此模块专属）
│       └── 但如果它是纯通用动作（保存/取消/删除/编辑…）→ common.actions.*
```

**通用（`common.*`）已覆盖的能力：**

| 子层级 | 职责 | 已覆盖 |
|--------|------|--------|
| `common.actions.*` | 通用动作按钮文案 | save, saving, cancel, delete, deleting, confirm, close, edit, add, create, deleted, undo, retry |
| `common.validation.*` | 通用校验模板 | required, maxLength, maxItems, invalidOption, nonNegative, integer, maxNumber, invalidJson, jsonArray, invalidForm |
| `common.toast.*` | 通用 toast 文案 | saved, saveFailed, deleted, deleteFailed, deletePending, deleteUndone |
| `common.confirm.*` | 通用确认弹窗 | deleteItem, unsavedChanges |
| `common.filter.*` | 通用筛选 | label, clearAll |
| `common.multiSelect.*` | 多选组件 | placeholder, searchPlaceholder, emptyMessage |
| `common.sortable.*` | 排序控件 | dragHandle, sortOrder |
| `common.ui.*` | 通用 UI 操作 | collapse, expand |
| `common.controlMode.*` | 管理模式开关 | on, off |
| `common.form.*` | 通用表单辅助 | tagsPlaceholder |
| `common.empty.*` | 通用空状态 | noData |

**各模块当前 key 结构（现状对照，2026-06-14 快照）：**

| 模块 | 顶层 key 数 | 已使用标准子层级 | 待清理的通用 key |
|------|------------|------------------|------------------|
| `shopping` | ~50 | page, tabs, cardGrid, toast, overview, dimensions, lifecycle, priceSignal, attributes, error, validation, enumNames, systems, spaces, stages, planning, shared, shuttle, admin, item, filter, system, space, stage, saving, undo | `shopping.undo`, `shopping.saving` |
| `beliefs` | ~25 | page, classification, filter, impact, tabs, entries, questions, relations, cards, signals, attachment, psych, field, form, actions, toast, error, revision, empty, enums, undo | `beliefs.undo` |
| `relationships` | ~25 | page, tabs, actions, common, overview, directory, filter, unsent, patterns, graph, labels, empty, edit, confirm, toast, enumNames | `relationships.common.add`, `relationships.common.undo` |
| `nutrition` | ~25 | page, tabs, status, units, enum, common, overview, profileEdit, dailyPlan, dailyPlanEdit, recipes, recipeFilters, recipeEdit, foods, categoryEdit, foodEdit, nutrients, logs, logEdit | `nutrition.common.*`（仅 `optional` 有业务语义，保留） |
| `overview` | ~8 | page, sections, logic, quickActions, currentFocus, empty | ✅ |
| `reflection` | ~12 | page, sections, actions, fields, placeholders, empty, edit, validation, tabs, prompts | ✅（`actions.create/edit` 含"反思"语境） |
| `events` | ~15 | page, actions, search, timeline, capture, themes, metrics, empty, edit, fields, placeholders, defaults, validation, tabs, review | ✅（`actions.create/edit` 含"事件"语境） |
| `finance` | ~15 | page, actions, summary, sections, target, empty, toast, edit, enum, tabs, rules | ✅（`actions.addEntry/editEntry/deleteEntry` 含"账目"语境） |
| `journey` | ~20 | page, hero, actions, filters, classification, sections, tabs, memory, growth, control, management, fields, edit, confirm, enum, compact, remaining, empty, library | `journey.actions.edit`（纯"编辑"→应迁 `common.actions.edit`） |
| `emotion` | ~18 | page, tabs, actions, overview, today, timeline, triggers, toolbox, common, empty, toast, editor, enum | `emotion.actions.add`（死 key） |
| `socioeconomics` | ~18 | page, actions, classification, relevance, heatmap, tabs, entries, gaps, prompts, review, empty, fields, edit, confirm, enum, discipline, graph | ✅ |
| `future` | ~12 | page, searching, refresh, addMilestone, addExperiment, sections, metrics, definition, edit, confirm, empty, tabs, alignment | ✅ |
| `legacy` | ~22 | pageEyebrow/pageTitle/pageDescription, tabs, actions, undo, toast, fields, labels, filters, warnings, metrics, overview, items, edit, validation, deliveryMap, relationship, boundaries, empty, enum | `legacy.actions.add`（纯"新增"），`legacy.undo` |
| `principles` | ~18 | page, controlMode, tabs, classification, sections, cost, meta, empty, edit, enumNames, practice, personal, others, perspective | ✅ |
| `worldhistory` | ~15 | title, subtitle, tabs, actions, narrative, nodeKind, nodeGlyph, dimension, event, preset, star, gantt, arena, civilization | `worldhistory.actions.saving` |
| `shell` | ~18 | brandSubtitle, search, quickRecord, apiError, language, utilities, themes, music, notifications, notificationCenter, views, nav, rhythm, rhythmPopup, sidebarCarousel, sidebarNotes, settings | ✅ |
| `splash` | ~2 | tagline, nodes | ✅ |

> **维护约定**：上表在每次 i18n 专项改造后更新。模块新增 key 时，先对上表确认子层级类别已存在再新增；如需新子层级类别，先在此表登记。

### F6. 用户反馈（sonner toast）

- **硬约定**：写操作要给结果反馈——成功 `toast.success`、失败 `toast.error`（与 F4 的 `onError` 对齐）。
- **硬约定**：静默处理了用户输入（忽略/去重/丢弃）必补 `toast.warning`——这是历史 bug 高发区。

### F7. 主题与配色

- **硬约定**：颜色走 CSS 变量（`src/styles/globals.css` 的 `--color-*` / `--background` / `--destructive` 等）+ Tailwind 语义类，**禁止硬编码 hex/rgb**（否则暗色模式 `next-themes` 失效）。
- **硬约定**：类名拼接用 `cn()`（`clsx` + `tailwind-merge`），不手写字符串拼 className。
- **约定**：字体走 `--font-sans` / `--font-heading` 变量。

#### F7.1 图谱可视化颜色

cytoscape / react-force-graph-3d 等库在运行时**程序化消费颜色值**（传入 JS 对象而非 className），无法直接走 Tailwind 语义类。此类场景的约定：

- **硬约定**：图谱着色令牌统一走 `--graph-*` CSS 自定义属性，在 `globals.css` 的 `:root` 和 `.dark` 中分别定义。**禁止在图谱组件内硬编码 hex 作为着色调色板**。
- **模式**：创建运行时读取器函数（如 `src/lib/graph-tokens.ts` 的 `readGraphPalette()` / `readGraphImpactMarks()` / `readGraphWeightMarks()`），通过 `getComputedStyle(document.documentElement).getPropertyValue(...)` 读取 CSS 变量。调用方在渲染时调用读取器获得当前主题的颜色值，传给图谱引擎。
- **SSR 安全网**：读取器函数应带 fallback 默认值（`readToken(name, fallback)`），当 `document` 不可用时返回 fallback。
- **适用范围**：关系图谱着色调色板、影响/未完成重量标记色、cytoscape 主题令牌（`--tone-*`）、启动屏动画色（`--splash-*`）等所有需要 JS 程序化消费的颜色。

### F8. 错误边界与崩溃兜底

桌面应用没有"刷新页面"逃生通道——组件抛错不拦截会**整应用白屏**。

- **硬约定**：至少在**路由级 / 模块页面级**包 React ErrorBoundary，提供兜底 UI（"出错了 + 重试/返回"，文案走 i18n）；"重试"应能重置该边界（重置 query / 重新挂载子树）。
- **硬约定（与 Query 分工）**：Query 的 `isError` 走**组件内**错误 UI + `toast.error`（F4/F6）；**渲染期抛出的意外错误**才交给 ErrorBoundary。两者不混。
- **建议**：高风险第三方重组件（`recharts` / `react-force-graph-3d` / `cytoscape`）单独包更细边界，避免一个可视化崩掉拖垮整页。

### F9. 弹窗（编辑/确认 Dialog）交互模式

基于全项目 20 个 `*-edit-dialog` 的事实标准固化。所有编辑类弹窗（基于 `src/components/ui/dialog.tsx`，底层 `@base-ui/react/dialog`）统一遵守。

**关闭机制（base-ui 默认已具备，约定是"别关掉"，硬约定）**
- **硬约定**：弹窗必须保留三条关闭通道——**ESC 键**、**点击遮罩（backdrop）**、**右上角关闭按钮 X**。这些是 base-ui `Dialog` + `DialogContent`（`showCloseButton` 默认 `true`）的默认行为，**不得无故关闭它们**（不要传 `showCloseButton={false}`、不要禁用 `onOpenChange`/ESC）。唯一例外：提交进行中（`isPending`）可临时拦截关闭，防止半提交状态下弹窗消失。
- **硬约定**：关闭按钮的无障碍文本与 tooltip 走 i18n，**不硬编码英文**（现 `dialog.tsx` 的 `tooltip="Close"` + sr-only `"Close"` 是待修违规，见文末清单）。
- **硬约定（与脏数据确认协同）**：当表单已脏，ESC / 遮罩 / X **三条通道都要触发**下方的"未保存改动二次确认"，不能只拦其中一条。

**页脚按钮（已是多数事实标准，硬约定）**
- **硬约定**：按钮构成与顺序——编辑态 `[删除(左对齐 mr-auto) | 取消 | 保存]`，新建态 `[取消 | 保存]`。删除按钮**仅编辑态出现**（`!isNew`），新建态不渲染。
- **硬约定**：删除按钮统一 `variant="destructive"`（不再用 `outline`）；取消 `outline`、保存 primary（`default`）。

**提交流程（已是多数事实标准，硬约定）**
- **硬约定**：点保存 →（校验失败：`toast` 提示并 return，弹窗保持打开）→ 调 `mutateAsync` →**成功后才关闭弹窗**（`onClose`/`onSaved`，二者都要触发关闭语义，不允许只调其一导致关不掉）→ 失败 `toast.error` 且**弹窗保持打开**让用户重试。**禁止乐观关闭**（不等结果就关）。
- **硬约定**：保存按钮 `disabled` 绑定到 `mutation.isPending` **且** `canSubmit`（顶层声明的校验状态，见 F3）；提交期间**删除按钮也 disabled**，防重复提交/误删。**不允许把校验逻辑只塞在 `handleSubmit` 里**（存量 legacy / shopping-space / shopping-system 是反例，待改）。
- **硬约定**：提交期间保存按钮文本切到"保存中"（pending 文本），不是只 disabled 不给反馈。

**删除确认（撤销式，已是事实标准，硬约定）**
- **硬约定**：删除统一走 `confirmUndoableDelete`（定义于 `ui/shopping/_shared/shopping-delete.ts`，已被 16+ 处复用：shopping / legacy / beliefs / relationships / worldhistory）——先从列表移除 + `toast`「已删除 [撤销]」5 秒窗口，未撤销才真正落库。**不再用 `window.confirm` 原生弹窗**。理由：local-first 数据是唯一副本，撤销窗口是更好的安全网，且不打断操作流。少数仍用 `window.confirm` 的弹窗（emotion/finance/future/journey/principle/socioeconomics）待统一改造。

**输入体验（当前 20 个弹窗零实现，硬约定，待批量补齐）**
- **硬约定**：表单支持**回车提交**（`<form onSubmit>` + 保存为 `type="submit"`，受 `canSubmit` 约束）。
- **硬约定**：弹窗打开时**自动聚焦首个输入框**（输入密集型弹窗尤其必要）。
- **硬约定**：有**未保存改动**时通过 ESC/取消/遮罩/X 关闭，需二次确认（dirty 检测 + 确认提示），避免误丢输入。
  - 注意实现分寸：仅在表单**真的脏了**（与初始值有 diff）时才拦截；无改动直接关，否则每次关弹窗都弹确认会很烦。

### F10. 基础组件通用约定

适用于 `src/components/ui/`（base-ui/radix/shadcn 体系）所有基础组件及其使用方。

**层级（z-index）**
- **硬约定**：浮层 z-index **只用 `src/lib/ui-layers.ts` 的 `UI_LAYERS` 语义层级**（当前完整层级：`header:20 / canvas:4 / ganttMarker:50 / utilityPanel:90 / notifications:100 / dialogOverlay:140 / dialogContent:150 / floatingContent:160 / graphFullscreen:200`），**禁止在组件里硬编码 `z-[999]` 之类魔法数字**。新浮层归类到已有层级，确需新层级在 `ui-layers.ts` 增设。

**按钮（button.tsx）**
- **硬约定**：只用既有 `variant`（`default / outline / secondary / ghost / destructive / link`）与 `size`（`default / xs / sm / icon / icon-sm / icon-lg`），**不在调用处用 className 覆盖出新变体**。语义对应：主操作 `default`、次要 `outline`、危险 `destructive`、弱化/图标 `ghost`。
- **硬约定**：纯图标按钮（`size=icon*`）必须有无障碍名——`aria-label` 或 `tooltip`（走 i18n），不能只放一个图标无文本。

**表单控件（input / select / checkbox / textarea 等）**
- **硬约定**：用 `components/ui/` 的封装，不直接裸用 `@base-ui`/原生标签自己拼样式；需要新控件先在 `components/ui/` 补封装再用。
- **硬约定**：表单控件必须有关联 `label`（`Label` 组件 + `htmlFor`，或包裹关联）；占位符 `placeholder` 不能替代 label。
- **硬约定**：受控组件的 `disabled` / 错误态（`aria-invalid`）由表单状态驱动（配合 F3 的 zod），不手动散管。

**反馈类组件（tooltip / toast / dropdown 等）**
- **硬约定**：所有面向用户的文本（tooltip、菜单项、空状态文案）走 i18n（同 F5），基础组件封装里也不例外。
- **建议**：列表/表格的**空状态**给一致的占位（说明 + 可选操作入口），不要渲染空白让人以为坏了；当前项目无统一 EmptyState 组件，若空状态增多可在 `components/ui/` 抽一个。

**通用**
- **硬约定**：颜色/圆角/间距走 CSS 变量与 Tailwind 语义类（同 F7），基础组件不硬编码 hex 或像素魔法数字（圆角已用 `--radius-*`）。
- **建议**：新基础组件遵循现有封装范式——`data-slot` 标记、`cn()` 合并 className、`variant`/`size` 用 `class-variance-authority`、props 透传底层 primitive。


> 以上 F9 硬约定中"删除确认统一"与"输入体验三项"属于**存量批量改造项**——见文末「弹窗改造清单」。审查时按 `review-scope.md` 维度二判级。

### F11. 共享工具函数（`src/lib/`）

> `src/lib/` 存放跨模块复用的**纯函数型工具**。与 `src/components/ui/`（UI 组件）分工不同——`lib/` 是逻辑封装，不输出 JSX。

#### F11.1 已有共享工具清单

| 文件 | 导出 | 用途 |
|------|------|------|
| `lib/utils.ts` | `cn()` | CSS 类名合并（`clsx` + `tailwind-merge`），**F7 已约定必须用** |
| `lib/ui-layers.ts` | `UI_LAYERS` | z-index 语义层级常量，**F10 已约定必须用** |
| `lib/app-motion.ts` | 动画预设常量 | 动画 easing/duration/spring/presence，**F2 已约定必须复用** |
| `lib/query-client.ts` | `createAppQueryClient()` | TanStack Query 的 `QueryClient` 工厂 |
| `lib/id-utils.ts` | `generateId(prefix)` | 统一 ID 生成，基于 `nanoid` |
| `lib/list-utils.ts` | `splitListText` / `joinListText` / `uniqueList` | 字符串列表的拆分/合并/去重 |
| `lib/graph-tokens.ts` | `readGraphPalette()` / `readGraphImpactMarks()` / `readGraphWeightMarks()` | 图谱着色令牌运行时读取器，从 CSS 变量读取颜色（F7.1 规范） |

#### F11.2 使用约定

- **硬约定**：**禁止在模块内重复定义已有共享工具**。以下函数禁止在 `features/` 下本地定义：
  - `splitListText` / `joinListText` / `uniqueList` → 从 `@/lib/list-utils` 导入
  - `generateId` 或手写 `crypto.randomUUID()` + `Date.now()` 回退 → 从 `@/lib/id-utils` 导入
  - `cn()` → 从 `@/lib/utils` 导入（F7 已覆盖）
- **硬约定**：`joinListText` 使用场合不同时**传分隔符参数**，不要另写一个"换行版 joinListText"（如 `joinListText(values, "\n")`）。同理 `splitListText` 传自定义分隔正则：`splitListText(text, /\n\|,\|，/)`。
- **硬约定**：ID 生成**唯一出口是 `generateId(prefix)`**（基于 `nanoid`），不再各模块手写 `crypto.randomUUID()`/`Date.now()+Math.random()` 拼接逻辑。
- **硬约定**：深度克隆用原生 `structuredClone()`（mock/fixture 数据场景），不再用 `JSON.parse(JSON.stringify())`（会静默丢失 `undefined`/`Date`/`Function`）。

### F12. Lint Suppress 注释规范

> React 19 的 Compiler 和 ESLint 规则会标记一些库的不兼容使用。以下约定规定何时 suppress、怎样把 suppress 作用域降到最小、以及什么时候该用架构手段消除 suppress 而非注释掉。

#### F12.1 React Hook Form 的 `incompatible-library`（已知必要 suppress）

**背景**：React Hook Form 的 `useForm()` 返回可变的引用函数（`watch`/`setValue`/`getValues` 等），这些函数的闭包引用破坏了 React Compiler 的 memoization 安全保证。这是两个库之间的语义级冲突，React 官方尚未解决。

- **硬约定**：使用 react-hook-form 的文件必须加 `/* eslint-disable react-hooks/incompatible-library */`，**紧贴在 `import ... from "react-hook-form"` 之前**，不放在文件顶部。项目已有先例：`shopping/*-edit-dialog.tsx`、`belief-edit-dialog.tsx`。
- **硬约定**：RHF 表单组件必须放在**独立文件**中（dialog 级），不与纯展示组件混在同一文件。这样 suppress 自然限定在最小范围。
- **禁止**：在模块主页面文件（如 `beliefs-page.tsx`）中 suppress 此规则——说明表单逻辑未分离。见到主页面有此注释，必须提取 dialog。

#### F12.2 其他 suppress 注释

- **硬约定**：任何 `eslint-disable` / `eslint-disable-next-line` 都必须附带注释说明原因（格式 `-- reason`）。
- **硬约定**：能用架构重构消除的 suppress（如 `set-state-in-effect`）必须重构，不用注释绕过。参考 F2.1「动画状态重置」模式。
- **硬约定**：禁止 `@ts-ignore` / `@ts-expect-error` / `as any` 屏蔽类型错误。类型不匹配时修正类型定义或接口，不正当地强制转换。

### F13. 组件文件导出与 Fast Refresh

- **硬约定**：包含用户可见组件的文件**只导出组件**（含 `export type`）——不混入 `export const` 常量或 `export function` 工具函数。React Fast Refresh 要求"only export components"，违反会导致 HMR 降级为整页刷新。
- **模式**：跨组件共享的常量/枚举/工具函数提取到独立文件，命名 `<module>-constants.ts`。文件归属遵循 F1 复用三层（模块内共享放模块目录下，跨模块放 `lib/`）。
- **示例**：`beliefs-constants.ts` 集中了 `BELIEF_DOMAINS`、`labelFor`、`toggleValue` 等，供 `beliefs-page.tsx` 和 `belief-edit-dialog.tsx` 共同引用。

#### F2.1 动画状态重置（补充 F2）

> 场景：组件根据 `isActive` 等布尔 prop 条件性播放动画，当 prop 从 true 变为 false 时需立即重置到静态态。

- **硬约定**：动画状态重置**用子组件提取 + `key` 驱动挂载/卸载**，不在 `useEffect` 中 `setState` 手动重置。
- **模式**：
  ```tsx
  // ✅ 正确：提取为子组件，key 变化自动销毁/重建
  function Parent({ isActive, label }: { isActive: boolean; label: string }) {
    if (!isActive) return <span>{label}</span>
    return <AnimatedLabel key={label} label={label} />
  }
  ```
- **反模式**：`useEffect(() => { if (!isActive) setState(label) }, [isActive, label])` —— 需 suppress `set-state-in-effect`，且效果等同于上述模式但多了 lint 负担。
- **原因**：React 的组件生命周期管理是内置的状态重置机制。当 `key` 变化时，旧实例销毁（cleanup 自动执行）、新实例挂载（状态全新）。这比手动在 effect 里重置更健壮（不会忘记清理 interval/timeout/listener），且零 suppress。

---

## 后端

### B1. 事务

- **硬约定**：任何"多步写"或"先 DELETE 再 INSERT/UPDATE"且中途失败会留下不一致状态的操作，必须用 `write_tx`（`src-tauri/src/shopping/db.rs` 定义）包裹。
- **硬约定**：要开事务，command 里必须 `let mut conn`（可变借用）；`let conn`（不可变）无法调用 `write_tx`——历史 bug 高发点（购物 BUG-09/12）。

  ```rust
  let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
  write_tx(&mut conn, |tx| ShoppingRepository::replace_xxx(tx, &id, &items))
  ```

- **硬约定**：repository 接收 `&Transaction`（或只读 `&Connection`），**不在内部自己 lock/open 连接**，事务边界由 command 层控制。

### B2. 错误处理

- **硬约定**：command **永不 panic 跨 IPC 边界**。禁止在 command/repository 路径用 `.unwrap()` / `.expect()` / 越界索引等——错误一律 `Result` 返回，让前端收 rejected promise 而非后端崩溃。（现状 commands 里 0 处 unwrap，保持。）
- **硬约定**：后端错误用**类型化错误**——`thiserror` 定义模块级 `Error` enum（`NotFound`/`Validation`/`Conflict`/`Db` 等 + `impl From` 链），跨 IPC 序列化成带错误码的结构给前端。**新代码不用 `Result<T, String>`**（String 无法分类处理、丢类型安全）。改错误形状要同步 `generate:bindings`。存量约 165 处 `Result<T,String>` 是待替换对象，不作为新代码依据。
- **错误文案**：enum 变体用 `#[error("...")]` 写小写英文短描述带值与原因（如 `invalid channel: {value} (disabled or not found)`），面向开发者排错，**不直接给用户看**（用户文案由前端 i18n 负责）。

### B3. 数据库迁移

现状基础设施（`db.rs` 的 `initialize_database`）：已开 `WAL` + `foreign_keys=ON` + `busy_timeout(5s)`，有 `schema_migrations(version, applied_at)` 表，迁移在事务内逐版本判断。新迁移：

- **硬约定**：每个迁移**在事务内执行**，schema 不能半应用。
- **硬约定**：版本号**顺序递增、不可回头改已发布的迁移**（已发到用户机器的视为冻结，要改只能追加新版本），应用后 `INSERT OR IGNORE INTO schema_migrations(...)` 记录。
- **硬约定**：**优先加列等向后兼容变更**；SQLite 不支持改名/删列，重构表走 `建新表 → INSERT…SELECT → 删旧表/换名`（同一事务内）。
- **建议**：迁移只做 schema 演进，不混大量数据回填；回填耗时则单独成步、可中断重试。

### B4. Tauri Command / IPC

- **硬约定**：command 把前端当**不可信输入**——所有前端来的数据在 Rust 侧重新校验（ID 存在、枚举合法、必填非空），**不能只靠前端 zod**。前端校验是体验，后端校验是防线。
- **建议**：DTO 用 serde + specta 派生，命名 `XxxDto`；写入中间结构命名 `XxxWriteModel`。

### B5. Capabilities / 权限

现状：`src-tauri/capabilities/default.json` 已做最小授权（`fs:scope` 限 `$APPDATA/**`、`opener` 限 `github.com`）。

- **硬约定**：坚持**最小权限**，文件系统限定 `$APPDATA` 等必要范围，不放开全盘；外链白名单按域名收敛；不给 window 授予用不到的 capability。
- **建议**：权限条目变多时按类别拆分 capability 文件（`filesystem.json` / `dialog.json` 等），在 `tauri.conf.json` 按 identifier 引用。

### B6. 数据备份与导出 —— 发布前门槛，开发期暂不做

> **当前判断（开发阶段）**：不做。开发数据坏了用开发命令重置即可，**不视为约定、审查时不算缺陷**。
> **价值拐点**：在"第一个真实用户存入第一份真实数据"那刻从 0 跳到最高（local-first 数据是唯一副本）。这是"推迟到发布前"，不是"不做"。

发布前必须补齐（届时升硬约定，作为独立 feature 立项）：破坏性迁移前自动备份 DB 文件、提供完整数据导出入口、导入/恢复前校验完整性并先备份当前库。

---

## 速查：硬约定清单（违反即 bug，按 review-scope.md 分级）

**前端**
1. 文案不走 i18n / 传内联默认文案 `t("x","中文")` / 通用动作/文案有 `common.*` 等价项却另起模块私有 key / 颜色硬编码 hex（含图谱着色调色板不走 `--graph-*` CSS 变量）/ 手写 className 不用 `cn()`
2. 动画用 `motion.div`、硬编码动画参数、位移动画无 reduced-motion、`AnimatePresence` 用 index 当 key
3. 新表单不用 zod、提交按钮无 disabled、静默丢弃用户输入无 `toast.warning`
4. queryKey 手写字符串、mutation 漏 invalidate、mutation `onError` 无反馈、服务端数据塞进 zustand、半吊子乐观更新
5. 路由/页面级缺 ErrorBoundary
6. 手写/修改 `src/bindings.ts`
7. 弹窗违反 F9：关闭三通道（ESC/遮罩/X）被无故关掉、页脚按钮构成/顺序错、删除非 destructive 或新建态出现、乐观关闭、保存按钮未绑 isPending+canSubmit、删除用 window.confirm 而非撤销式、缺回车提交/自动聚焦/脏数据关闭确认
8. 违反 F10：z-index 硬编码不走 `UI_LAYERS`、自造 button variant、图标按钮无 aria-label/tooltip、表单控件缺关联 label、裸用 base-ui/原生标签而非 `components/ui/` 封装
9. 违反 F11：模块内重复定义已有共享工具（`splitListText`/`joinListText`/`uniqueList`/ID 生成）、深度克隆用 `JSON.parse(JSON.stringify())` 而非 `structuredClone()`、不用 `generateId()` 而手写 ID 拼接、图谱着色令牌不走 `graph-tokens.ts` 而本地硬编码 hex
10. 违反 F12：RHF suppress 放在主页面文件（应提取 dialog）、suppress 无原因注释、用 `@ts-ignore`/`@ts-expect-error`/`as any` 屏蔽类型错误、能用架构手段消除的 suppress 用注释绕过
11. 违反 F13：组件文件混入 `export const`/`export function` 非组件导出（→ 独立 `<模块>-constants.ts`），动画状态重置用 effect 内 setState 而非子组件+key（违反 F2.1）

**后端**
12. 多步写 / DELETE+INSERT 不包 `write_tx`（或用了 `let conn` 开不了事务）
13. command 路径用 unwrap/expect/可 panic 写法
14. 新代码用 `Result<T, String>` 而非 `thiserror` 类型化错误
15. 迁移不包事务、或改已发布的旧迁移版本
16. 改了 command 不跑 `generate:bindings`
17. command 不在 Rust 侧校验前端输入（只靠前端 zod）
18. capability 超出最小必要权限

> 数据备份/导出（B6）是发布前门槛，开发期豁免，不在本清单内。

---

## 弹窗改造清单（F9 存量批量收口）

> F9 的部分硬约定属于"全项目零实现/不一致"，需作为**一次专项改造**统一收口，而非每次 diff 审查重复报。改造未完成前，审查存量弹窗时这些项归入本清单跟踪，不逐个当新 bug 反复提；新写的弹窗则必须一开始就符合 F9。

待统一的存量项（20 个 `*-edit-dialog`）：

1. **删除确认**：`window.confirm` → `confirmUndoableDelete`（emotion / finance / future / journey / principle / socioeconomics / events / reflection 等，共 15 处，详见 `docs/bugs/bug-i18n.md`）。
2. **回车提交**：全部弹窗补 `<form onSubmit>` + 保存 `type="submit"`。
3. **自动聚焦首字段**：全部弹窗补打开时聚焦。
4. **脏数据关闭确认**：全部弹窗补 dirty 检测 + 二次确认（仅在真的脏了时拦截）。
5. **保存按钮 disabled/pending 文本**：补齐缺失的（legacy / shopping-space / shopping-system 无 `canSubmit`+isPending 绑定；emotion / future / legacy / socioeconomics / shopping 无"保存中"文本）。
6. **删除按钮 variant**：`outline` → `destructive`（finance / legacy / nutrition-recipe / principle / shopping 全系等）。
7. **疑似 bug**：`principle-edit-dialog.tsx` 保存成功只调 `onSaved()` 不调 `onClose()`，确认是否关不掉弹窗。
8. **~~关闭按钮 i18n~~** ✅ 已完成：`dialog.tsx` 已改为 `t("common.actions.close")`。
9. **通用动作文案收口**（进行中，2026-06-14 排查状态见 `docs/bugs/bug-i18n.md`）：剩余待迁 key —— `relationships.common.{add,undo}`、`journey.actions.edit`、`legacy.{actions.add,undo}`、`beliefs.undo`、`worldhistory.actions.saving`、`emotion.actions.add`（死 key）。对应 JSX 调用点 9 处。另发现 `relationships.common.edit` 缺失 key（运行时显示原始字符串，已属 bug）。
10. **清除内联默认文案**：全项目 ~1889 处 `t("key","中文")` / `t("key",{defaultValue})` 内联兜底，其中 1851 处 key 已在 zh.json，直接删第二参数即可；剩 ~38 处 key 只在内联兜底未进 json（如 `relationships.graph.markModes.*` / `nutrition.logs.filterTitle` / `principles.actions.edit` 等），**先把文案迁进 zh.json + en.json 再删**。一次性 i18n 重构，不逐处当新 bug 报。
11. **`notification-layer.tsx` 关闭按钮**：`showCloseButton={false}` 违反 F9.1 三通道原则。

> 完成后删除本节，相关项即并入常规 F9 硬约定按 diff 审查。
