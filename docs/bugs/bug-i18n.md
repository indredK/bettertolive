# i18n 文案规范排查报告

> 排查日期：2026-06-14
> 规范依据：`docs/standards/conventions.md` F5 / F5.9 / F9.5

---

## 一、window.confirm 未迁移到 confirmUndoableDelete（F9.5）

删除操作仍使用原生 `window.confirm`，应迁移到撤销式删除 `confirmUndoableDelete`。

### 删除确认（15 处）

| 文件 | 行号 | 删除对象 |
|------|------|---------|
| `src/features/bettertolive/ui/emotion/emotion-edit-dialog.tsx` | 527 | 情绪记录 |
| `src/features/bettertolive/ui/future/future-edit-dialog.tsx` | 232 | 愿景 |
| `src/features/bettertolive/ui/future/future-edit-dialog.tsx` | 355 | 实验 |
| `src/features/bettertolive/ui/socioeconomics/socioeconomics-edit-dialog.tsx` | 316 | 认知条目 |
| `src/features/bettertolive/ui/socioeconomics/socioeconomics-edit-dialog.tsx` | 561 | 认知缺口 |
| `src/features/bettertolive/ui/socioeconomics/socioeconomics-edit-dialog.tsx` | 686 | 认知提问 |
| `src/features/bettertolive/ui/principles/principle-edit-dialog.tsx` | 143 | 原则 |
| `src/features/bettertolive/ui/finance/finance-entry-edit-dialog.tsx` | 153 | 账目编辑弹窗内 |
| `src/features/bettertolive/ui/finance/finance-page.tsx` | 106 | 账目列表页 |
| `src/features/bettertolive/ui/journey/journey-edit-dialog.tsx` | 499 | 记忆 |
| `src/features/bettertolive/ui/journey/journey-edit-dialog.tsx` | 703 | 成长节点 |
| `src/features/bettertolive/ui/journey/journey-edit-dialog.tsx` | 888 | 锚点 |
| `src/features/bettertolive/ui/journey/journey-edit-dialog.tsx` | 1015 | 线索 |
| `src/features/bettertolive/ui/events/events-page.tsx` | 688 | 事件 |
| `src/features/bettertolive/ui/reflection/reflection-page.tsx` | 151 | 反思 |

### 未保存改动确认（6 处，F9 脏数据检测项）

| 文件 | 行号 |
|------|------|
| `src/features/bettertolive/ui/shopping/systems/shopping-system-edit-dialog.tsx` | 165 |
| `src/features/bettertolive/ui/shopping/attributes/shopping-attribute-edit-dialog.tsx` | 249 |
| `src/features/bettertolive/ui/shopping/planning/shopping-item-edit-dialog.tsx` | 276 |
| `src/features/bettertolive/ui/shopping/spaces/shopping-space-edit-dialog.tsx` | 144 |
| `src/features/bettertolive/ui/shopping/stages/shopping-stage-edit-dialog.tsx` | 233 |
| `src/features/bettertolive/ui/shopping/_shared/shopping-delete.ts` | 24 |

---

## 二、通用动作文案未收敛到 common.actions.*（F5.9）

以下 zh.json 中定义的 key 属于纯通用文案，应迁移到 `common.actions.*`：

### zh.json 需删除的冗余 key

| zh.json Key | 文案 | 对应 common.actions |
|-------------|------|--------------------|
| `relationships.common.add` | 添加 | `common.actions.add` |
| `relationships.common.undo` | 撤销 | `common.actions.undo` |
| `journey.actions.edit` | 编辑 | `common.actions.edit` |
| `legacy.actions.add` | 新增 | `common.actions.add` |
| `legacy.undo` | 撤销 | `common.actions.undo` |
| `beliefs.undo` | 撤销 | `common.actions.undo` |
| `worldhistory.actions.saving` | 保存中… | `common.actions.saving` |
| `emotion.actions.add` | 新增 | `common.actions.add`（死 key，无调用点） |

### JSX 调用点需修改

| 文件:行号 | 当前调用 | 应改为 |
|-----------|---------|--------|
| `src/features/bettertolive/ui/relationships/relationship-edit-dialogs.tsx:1014` | `t("relationships.common.add")` | `t("common.actions.add")` |
| `src/features/bettertolive/ui/relationships/relationships-page.tsx:443` | `t("relationships.common.undo")` | `t("common.actions.undo")` |
| `src/features/bettertolive/ui/relationships/relationships-page.tsx:467` | `t("relationships.common.undo")` | `t("common.actions.undo")` |
| `src/features/bettertolive/ui/relationships/relationships-page.tsx:488` | `t("relationships.common.undo")` | `t("common.actions.undo")` |
| `src/features/bettertolive/ui/journey/journey-page.tsx:1150` | `t("journey.actions.edit")` | `t("common.actions.edit")` |
| `src/features/bettertolive/ui/legacy/legacy-items-tab.tsx:256` | `t("legacy.undo")` | `t("common.actions.undo")` |
| `src/features/bettertolive/ui/legacy/legacy-item-edit-dialog.tsx:166` | `t("legacy.undo")` | `t("common.actions.undo")` |
| `src/features/bettertolive/ui/beliefs/beliefs-page.tsx:1352` | `t("beliefs.undo")` | `t("common.actions.undo")` |
| `src/features/bettertolive/ui/worldhistory/world-history-page.tsx:335` | `t("worldhistory.actions.saving")` | `t("common.actions.saving")` |

---

## 三、缺失 i18n Key —— 运行时显示原始 key 字符串（F5.1）

`src/features/bettertolive/ui/relationships/relationships-page.tsx` 第 1655、2006 行调用了 `t("relationships.common.edit")`，但 **zh.json 中不存在此 key**：

```tsx
// relationships-page.tsx:1655
{t("relationships.common.edit")}

// relationships-page.tsx:2006
{t("relationships.common.edit")}
```

运行时 i18next 找不到 key 会直接展示原始字符串 `"relationships.common.edit"`，属用户可见 bug。

**修复**：直接改为 `t("common.actions.edit")`。

---

## 四、弹窗关闭按钮被禁用（F9.1）

`src/features/bettertolive/ui/shared/notification-layer.tsx:365`：

```tsx
<DialogContent className="max-w-[560px] p-0" showCloseButton={false}>
```

此处显式禁用了关闭按钮 X，违反 F9「弹窗必须保留三条关闭通道」硬约定。

---

## 五、已完成合规项（无需修改）

- `components/ui/dialog.tsx` 的 `"Close"` 硬编码英文 → 已改为 `t("common.actions.close")` ✅
- `emotion.actions.addCheckIn` / `editCheckIn` / `editTool` 等 → 均为模块专属有语境文案 ✅
- `finance.edit.*` / `principles.edit.*` / `socioeconomics.actions.editEntry` 等 → 均带模块语境 ✅
- `reflection.actions.create`（"新增反思"）/ `events.actions.edit`（"编辑事件"）→ 模块专属 ✅
- JSX 中无发现硬编码中文字符串（非 `t()` 内）✅

---

## 统计汇总

| 问题类别 | 数量 | 严重度 | 涉及模块 |
|----------|------|--------|---------|
| `window.confirm` → `confirmUndoableDelete` | 15 处 | 中 | emotion, future, socioeconomics, principles, finance, journey, events, reflection |
| 通用动作文案未收敛 | 8 个 zh.json key + 9 个 JSX 调用点 | 中 | relationships, journey, legacy, beliefs, worldhistory, emotion |
| 缺失 i18n key | 1 个 key + 2 个调用点 | **高** | relationships |
| 关闭按钮被禁用 | 1 处 | 低 | shared/notification-layer |
| 死 key | 1 个 | 微 | emotion |
