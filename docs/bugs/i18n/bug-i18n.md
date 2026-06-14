# 文案审查报告：全项目 i18n / F5 违规

> 审查范围：`src/features/` 全模块 + `src/components/ui/dialog.tsx` + `src/i18n/locales/{zh,en}.json`
> 依据：`docs/standards/review-scope.md` 维度二 + `docs/standards/conventions.md` F5（国际化硬约定）
> 严重程度：🟡 第二档（影响真实使用 / i18n 缺失，批量处理优先）

---

## 汇总表

| ID | 严重程度 | 简述 | 文件数 | 处理优先级 |
|---|---|---|---|---|
| BUG-I18N-01 | 🟡 | `t("key","中文兜底")` 内联默认文案（key 已在 zh.json） | 1 文件 5 处 | 高 |
| BUG-I18N-02 | 🟡 | `t("key", confirmFallback)` 动态内联默认 | 1 文件 1 处 | 高 |
| BUG-I18N-03 | 🟡 | `defaultValue: "中文"` 内联默认 — key 已在 zh.json | 6 文件 15 处 | 中 |
| BUG-I18N-04 | 🟡 | `defaultValue: "中文"` 内联默认 — key **不在** zh.json | 5 文件 5 处 | 高 |
| BUG-I18N-05 | 🟡 | 模块私有通用动作 key（未用 `common.actions.*`） | 9 文件 36+ 处 | 中（归弹窗改造清单）|
| BUG-I18N-06 | 🟡 | `window.confirm` 硬编码确认弹窗（未用 `confirmUndoableDelete`） | 14 文件 24 处 | 中（归弹窗改造清单）|

---

## BUG-I18N-01: `t("key","中文兜底")` 内联默认文案（5 处）

**文件**: `src/features/bettertolive/ui/socioeconomics/socioeconomics-edit-dialog.tsx`

**严重程度**: 🟡 第二档（F5: 禁止内联默认文案）

**描述**: 5 处 `t(key, inlinedChineseString)` 调用，传递了内联中文作为第二参数（i18next 默认值）。所有这些 key 在 `zh.json` 中已有对应翻译，内联文案是**死代码**——i18next 永远使用 json 中的值。

**复现步骤**: 后端不可用时访问 socioeconomic 弹窗，会看到 json 值正常显示；内联中文永远不会出现。

**修复建议**: 删除第二参数，改为 `t("key")`（单参数调用），让缺失 key 时由 i18next 返回 key 字符串本身作为开发期信号。

| 行号 | 当前写法 | 应改为 |
|---|---|---|
| 270-272 | `t("socioeconomics.edit.validation.history", "掌握修订历史格式需要是：日期 \| 原等级 -> 新等级 \| 触发原因")` | `t("socioeconomics.edit.validation.history")` |
| 281-283 | `t("socioeconomics.edit.validation.sourceRefs", "来源格式需要是：来源名称 \| https://example.com")` | `t("socioeconomics.edit.validation.sourceRefs")` |
| 362-364 | `t("socioeconomics.edit.entryDescription", "每条认知都需要完整标注领域、层次、掌握程度、来源和决策距离。")` | `t("socioeconomics.edit.entryDescription")` |
| 481-483 | `t("socioeconomics.edit.sourceRefsPlaceholder", "OpenStax: Principles of Economics \| https://openstax.org/details/books/principles-economics-3e")` | `t("socioeconomics.edit.sourceRefsPlaceholder")` |
| 503-505 | `t("socioeconomics.edit.historyPlaceholder", "2026-03-04 \| 听过名词 -> 知道大致逻辑 \| 看完一组材料")` | `t("socioeconomics.edit.historyPlaceholder")` |

**zh.json 已含对应 key** (行 2637-2639, 2629, 2634-2635)，无需新增翻译。

---

## BUG-I18N-02: `t(confirmKey, confirmFallback)` 动态内联默认（1 处）

**文件**: `src/features/bettertolive/ui/journey/journey-edit-dialog.tsx`

**严重程度**: 🟡 第二档（F5: 禁止内联默认文案）

**描述**: 行 1014-1016，删除线程/提示时的确认对话使用了动态内联 fallback：

```ts
const confirmKey = isThread ? "journey.confirm.deleteThread" : "journey.confirm.deletePrompt"
const confirmFallback = isThread ? "确定删除这条影响线索吗？" : "确定删除这条回看问题吗？"
if (!window.confirm(t(confirmKey, confirmFallback))) { return }
```

**修复建议**: 两步修复：
1. 确认 `journey.confirm.deleteThread` 和 `journey.confirm.deletePrompt` 是否已在 zh.json 中（**需排查**，当前搜索结果未发现这两个 key）
2. 若不在：先补 zh.json + en.json，再删 fallback；若已在：直接删 fallback
3. 同时将 `window.confirm` 替换为 `confirmUndoableDelete`（见 BUG-I18N-06）

---

## BUG-I18N-03: `defaultValue` 内联默认 — key 已在 zh.json（15 处）

**严重程度**: 🟡 第二档（F5: 禁止 inline defaultValue）

**描述**: 多处 `t("key", { defaultValue: "中文", ... })` 调用的 key 在 zh.json 中**已有定义**，`defaultValue` 是死代码。

**修复建议**: 删除 `defaultValue` 属性，仅保留 `t("key", { ...interpolationVars })`。

| 文件 | 行号 | key | zh.json 行 |
|---|---|---|---|
| `principles/principles-page.tsx` | 1006 | `principles.controlMode.summary` | 3921 |
| `principles/principle-edit-dialog.tsx` | 509 | `principles.edit.revision.summary` | 4034 |
| `finance/finance-page.tsx` | 546 | `finance.summary.dailyAverage` | 2098 |
| `legacy/legacy-trust-boundaries-tab.tsx` | 155 | `legacy.boundaries.itemCount` | 3326 |
| `legacy/legacy-delivery-map-tab.tsx` | 63 | `legacy.deliveryMap.itemCount` | 3297 |
| `legacy/legacy-delivery-map-tab.tsx` | 98 | `legacy.deliveryMap.sectionCount` | 3299 |
| `shopping/systems/shopping-systems-tab.tsx` | 74 | `shopping.systems.ownedInlineCount` | 360 |
| `shopping/systems/shopping-systems-tab.tsx` | 80 | `shopping.systems.wantedInlineCount` | 361 |
| `shopping/systems/shopping-systems-tab.tsx` | 129 | `shopping.systems.itemCount` | 354 |
| `shopping/spaces/shopping-spaces-tab.tsx` | 76 | `shopping.spaces.ownedInlineCount` | 402 |
| `shopping/spaces/shopping-spaces-tab.tsx` | 82 | `shopping.spaces.wantedInlineCount` | 403 |
| `shopping/stages/shopping-stages-tab.tsx` | 210 | `shopping.stages.itemInlineCount` | 457 |
| `shopping/planning/shopping-planning-tab.tsx` | 87 | `shopping.item.childCount` | 672 |
| `shopping/planning/shopping-item-edit-dialog.tsx` | 538 | `shopping.item.childLabel` | 673 |
| `shopping/overview/shopping-overview-tab.tsx` | 476 | `shopping.overview.moreAttentionItems` / `moreRelatedItems` | 117-118 |

---

## BUG-I18N-04: `defaultValue` 内联默认 — key **不在** zh.json（5 处）

**严重程度**: 🟡 第二档（F5: 禁止 inline defaultValue，key 缺失需先补翻译）

**描述**: 以下 key 只存在于 `defaultValue` 内联中，**未写入 zh.json 或 en.json**。i18next 会回退到 defaultValue，但这些文案仍违反"翻译单一来源"约定。

**修复建议**: 分两步：
1. 先把 `defaultValue` 文案**迁入 zh.json + en.json** 对应位置
2. 然后删除代码中的 `defaultValue` 属性

| 文件 | 行号 | key | 当前 defaultValue |
|---|---|---|---|
| `shopping/systems/shopping-system-edit-dialog.tsx` | 168 | `shopping.confirm.unsavedChanges` | `当前有未保存的修改，确定要关闭吗？` |
| `shopping/spaces/shopping-space-edit-dialog.tsx` | 147 | `shopping.confirm.unsavedChanges` | 同上 |
| `shopping/stages/shopping-stage-edit-dialog.tsx` | 236 | `shopping.confirm.unsavedChanges` | 同上 |
| `shopping/attributes/shopping-attribute-edit-dialog.tsx` | 251 | `shopping.confirm.unsavedChanges` | 同上 |
| `shopping/planning/shopping-item-edit-dialog.tsx` | 279 | `shopping.confirm.unsavedChanges` | 同上 |

> 注意：`shopping.confirm.unsavedChanges` 出现 5 次，属同一 key 的重复使用，只需在 zh.json 定义一次并配 en.json 翻译。

---

## BUG-I18N-05: 模块私有通用动作 key（未用 `common.actions.*`）

**严重程度**: 🟡 第二档（F5: 通用动作文案全局收口至 `common.actions.*`）

**描述**: 多个模块使用自己的命名空间定义 save/cancel/delete/saving/edit/add 等通用动作文案，违反 "禁止再写模块私有的通用动作 key" 约定。这些应统一使用 `common.actions.*`（已在 zh.json 行 7-20 定义）。

> per `conventions.md` F9 弹窗改造清单第 9 项，这属于**一次性 i18n 重构**，不逐个弹窗当新 bug 报，统一跟踪即可。

### 模块级私有的通用动作 key 分布：

| 模块 | 使用的私有 key | 当前 zh.json 定义位置 | 应改为 |
|---|---|---|---|
| `socioeconomics` | `socioeconomics.actions.save/cancel/delete` | 行 2531-2533 | `common.actions.save/cancel/delete` |
| `journey` | `journey.actions.save/cancel/delete/saving` | 行 2233-2237 | `common.actions.*` |
| `emotion` | `emotion.editor.save/cancel/delete` | 行 2876-2878 | `common.actions.*` |
| `future` | `future.edit.save/cancel/delete` | （见下） | `common.actions.*` |
| `finance` | `finance.edit.save/cancel/delete/saving` | 行 2133-2136 | `common.actions.*` |
| `nutrition` | `nutrition.common.save/cancel/saving` | 行 1421-1423 | `common.actions.*` |
| `nutrition` | `nutrition.logEdit.delete` / `dailyPlanEdit.delete` / `categoryEdit.delete` / `recipeEdit.delete` / `foodEdit.delete` | （散落各子节点） | 带语境的特定删除文案保留；通用 `删除` → `common.actions.delete` |
| `principles` | `principles.edit.save/cancel/delete` | （需排查） | `common.actions.*` |
| `worldhistory` | `worldhistory.actions.saving` | （需排查） | `common.actions.saving` |

### 已符合 `common.actions.*` 的模块（✅ 已改完）：
- `reflection` 使用 `common.actions.delete/cancel/save`
- `events` 使用 `common.actions.delete/cancel/save`
- `beliefs` 使用 `common.actions.delete/cancel/save`
- `legacy` 使用 `common.actions.delete/cancel/save`
- `shopping`（全子模块）使用 `common.actions.delete/cancel/save/saving`

---

## BUG-I18N-06: `window.confirm` 硬编码确认弹窗（24 处）

**严重程度**: 🟡 第二档（F9: 删除统一走 `confirmUndoableDelete`，不用 `window.confirm`）

**描述**: 14 个文件中 24 处使用 `window.confirm()` 做删除确认，违反 F9 "删除统一走撤销式删除"约定。

> per `conventions.md` F9 弹窗改造清单第 1 项，属于**存量批量改造项**，统一跟踪即可。

| 模块 | 文件 | 行号 |
|---|---|---|
| reflection | `reflection-page.tsx` | 151 |
| emotion | `emotion-edit-dialog.tsx` | 527 |
| principles | `principle-edit-dialog.tsx` | 143 |
| future | `future-edit-dialog.tsx` | 232, 356 |
| finance | `finance-page.tsx` | 106 |
| finance | `finance-entry-edit-dialog.tsx` | 153 |
| journey | `journey-edit-dialog.tsx` | 499, 703, 888, 1016 |
| socioeconomics | `socioeconomics-edit-dialog.tsx` | 326, 583, 708 |
| events | `events-page.tsx` | 688 |
| shopping/systems | `shopping-system-edit-dialog.tsx` | 166 |
| shopping/spaces | `shopping-space-edit-dialog.tsx` | 145 |
| shopping/stages | `shopping-stage-edit-dialog.tsx` | 234 |
| shopping/attributes | `shopping-attribute-edit-dialog.tsx` | 249 |
| shopping/planning | `shopping-item-edit-dialog.tsx` | 277 |
| shopping/_shared | `shopping-delete.ts` | 24 |

---

## 附：已符合 F5 通过项

以下项已对齐约定，无需修复：

1. **`components/ui/dialog.tsx`** 关闭按钮已使用 `t("common.actions.close")`（行 72, 77, 112），不再硬编码英文 "Close"。✅
2. **`components/ui/multi-select.tsx`** staged changes 中已修改为 i18n。✅
3. `reflection`、`events`、`beliefs`、`legacy`、`shopping` 全系弹窗已使用 `common.actions.*`。✅
4. `common.actions` 在 zh.json 中已定义全部 12 个通用动作文案（行 7-20）。✅
5. `confirmUndoableDelete` 已在 `shopping-delete.ts` 中定义，已被 16+ 处复用（legacy/beliefs/relationships/shopping/worldhistory）。✅

---

## 修复优先级建议

**立即修复**（每处改动 < 5 行，纯删除操作）：
1. BUG-I18N-01（删除 5 个内联第二参数）
2. BUG-I18N-03（删除 15 个 defaultValue）

**短期修复**（需先补 json）：
3. BUG-I18N-04（补 1 个 key × zh+en json → 删 5 个 defaultValue）
4. BUG-I18N-02（排查 key 是否存在 → 补或删 fallback）

**归入弹窗改造清单统一收口**（不做逐个修复）：
5. BUG-I18N-05（模块通用动作 key → `common.actions.*`）
6. BUG-I18N-06（`window.confirm` → `confirmUndoableDelete`）
