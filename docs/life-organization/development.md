# 生命整理模块开发文档
> 汇总生命整理模块的前端计划、后端计划、Mock 迁移、国际化和 Done Criteria。

---

## 生命整理模块开发文档

### 生命整理模块开发文档

#### 1. 目标

把现有生命整理页从“静态说明型看板”升级成一个和购物模块类似的可维护工作台：

- 总览
- 条目库
- 交付地图
- 关系表达
- 边界与信任

本开发文档对应 [生命整理模块设计文档](./design.md)。

#### 2. 当前代码现状

当前生命整理模块主要由这些文件支撑：

| 文件 | 现状 |
|---|---|
| `src/features/bettertolive/ui/legacy/legacy-page.tsx` | 顶层 Tab 和编辑弹窗状态壳 |
| `src/features/bettertolive/ui/legacy/legacy-*.tsx` | 总览、条目库、交付地图、关系表达、边界与信任等拆分视图 |
| `src/features/bettertolive/models/workspace.ts` | 已更新 `LegacyItem / LegacyItemForm / LegacyModuleData` 等类型 |
| `src-tauri/src/legacy/*` | 已新增 SQLite schema、seed、repository 和 Tauri commands |
| `src-tauri/src/legacy/seed.json` | 后端 seed 数据覆盖 5 维分类、情感负荷、交付条件和锁定状态 |
| `src/features/bettertolive/api/mock/data/workspace-snapshot.mock.ts` | legacy 使用空 fallback，不再维护前端手写样例 |
| `src/features/bettertolive/hooks/use-workspace-view-model.ts` | 已补充搜索过滤 legacy 新字段 |
| `src-tauri/src/shopping/commands.rs` | `get_workspace_snapshot` 已可聚合后端 legacy 数据 |

本轮实现已补齐原先缺口：

- 顶层 Tab 信息架构。
- 条目新增 / 编辑 / 删除。
- 交付地图视图。
- 关系表达视图。
- 明确的信任边界配置页。
- SQLite 表和 Tauri 命令。

#### 3. 新目录结构

建议参考购物模块拆分方式：

```text
src/features/bettertolive/ui/legacy/
  legacy-page.tsx
  legacy-overview-tab.tsx
  legacy-items-tab.tsx
  legacy-delivery-map-tab.tsx
  legacy-relationship-expression-tab.tsx
  legacy-trust-boundaries-tab.tsx
  legacy-item-edit-dialog.tsx
  legacy-page-shared.tsx
  legacy-page-data.ts
  legacy-types.ts
```

对应关系：

| 购物模块 | 生命整理模块 |
|---|---|
| `shopping-page.tsx` | `legacy-page.tsx` |
| `shopping-overview-tab.tsx` | `legacy-overview-tab.tsx` |
| `shopping-planning-tab.tsx` | `legacy-items-tab.tsx` |
| `shopping-stages-tab.tsx` | `legacy-delivery-map-tab.tsx` |
| `shopping-page-shared.tsx` | `legacy-page-shared.tsx` |
| `shopping-item-edit-dialog.tsx` | `legacy-item-edit-dialog.tsx` |

#### 4. 前端数据模型

##### 4.1 扩展现有类型

在 `src/features/bettertolive/models/workspace.ts` 中扩展 `LegacyItem`：

```ts
export type LegacyItem = {
  id: string
  title: string
  category: LegacyCategory
  recipient: LegacyRecipient
  recipientName?: string
  relatedRelationshipId?: string
  urgency: LegacyUrgency
  visibility: LegacyVisibility
  deliveryCondition?: string
  status: LegacyStatus
  emotionalLoad?: EmotionalLoad
  summary: string
  content: string
  contentPreview: string
  isLocked: boolean
  requiresSecondConfirm: boolean
  excludeFromAi: boolean
  createdAt: string
  updatedAt: string
  finalizedAt?: string
  reviewCue: string
  tags: string[]
}
```

兼容迁移：

| 新字段 | 旧数据默认值 |
|---|---|
| `content` | 使用 `contentPreview` |
| `requiresSecondConfirm` | `emotionalLoad === "很重"` |
| `excludeFromAi` | `recipient === "仅自己" || emotionalLoad === "很重" || visibility === "我离世后"` |
| `createdAt` | 使用 `updatedAt` |
| `finalizedAt` | `status === "最终版" ? updatedAt : undefined` |

##### 4.2 表单类型

新增表单类型，避免页面直接编辑完整条目：

```ts
export type LegacyItemForm = {
  id?: string | null
  title: string
  category: LegacyCategory
  recipient: LegacyRecipient
  recipientName?: string
  relatedRelationshipId?: string
  urgency: LegacyUrgency
  visibility: LegacyVisibility
  deliveryCondition?: string
  status: LegacyStatus
  emotionalLoad?: EmotionalLoad
  summary: string
  content: string
  isLocked: boolean
  requiresSecondConfirm: boolean
  excludeFromAi: boolean
  reviewCue: string
  tags: string[]
}
```

##### 4.3 模块数据

当前可继续保持：

```ts
export type LegacyModuleData = {
  items: LegacyItem[]
  trustBoundaries: LegacyTrustBoundary[]
  reviewPrompts: string[]
}
```

后续如果要让回看问题可维护，再升级为：

```ts
export type LegacyReviewPrompt = {
  id: string
  prompt: string
  category?: LegacyCategory
  sortOrder: number
}
```

#### 5. 前端页面计划

#### 5.1 `legacy-page.tsx`

职责：

- 管理顶层 Tabs。
- 接收 `LegacyModuleData`。
- 把搜索后的数据传给各 Tab。
- 管理编辑弹窗打开状态。
- 不直接写复杂分组和统计逻辑。

Tab：

- `overview`
- `items`
- `deliveryMap`
- `relationshipExpression`
- `trustBoundaries`

建议文案：

| Tab key | 中文 |
|---|---|
| `overview` | 总览 |
| `items` | 条目库 |
| `deliveryMap` | 交付地图 |
| `relationshipExpression` | 关系表达 |
| `trustBoundaries` | 边界与信任 |

#### 5.2 `legacy-overview-tab.tsx`

从当前 `LegacyPage` 中拆出：

- 5 维分类分布。
- 情感负荷分布。
- 关键统计卡片。
- 最近更新条目。
- 回看问题。

新增统计：

- `criticalDraftCount`：`urgency=关键信息` 且未完成。
- `missingDeliveryConditionCount`：需要交付条件但未填写。
- `finalLockedCount`：最终版或已锁定。
- `aiExcludedCount`：排除 AI 汇总。

#### 5.3 `legacy-items-tab.tsx`

条目库是主 CRUD 入口。

布局：

```text
左侧：条目列表 + 搜索结果 + 轻筛选
右侧：条目详情 + 编辑 / 删除 / 锁定状态
```

轻筛选建议：

- `category`
- `status`
- `visibility`
- 是否缺交付条件
- 是否锁定

详情页展示：

- 标题、摘要、正文预览。
- 5 维分类。
- 情感负荷。
- 交付条件。
- 关系引用。
- 保护策略。
- 标签和回看提示。

#### 5.4 `legacy-item-edit-dialog.tsx`

编辑弹窗建议双栏固定布局，参考购物编辑弹窗：

```text
左栏：内容
- 标题
- 摘要
- 正文
- 标签
- 回看提示

右栏：分类与保护
- category
- recipient
- recipientName
- relatedRelationshipId
- urgency
- visibility
- deliveryCondition
- status
- emotionalLoad
- isLocked
- requiresSecondConfirm
- excludeFromAi
```

保存规则：

- `status=最终版` 时自动 `isLocked=true`。
- `emotionalLoad=很重` 时默认 `requiresSecondConfirm=true`。
- `recipient=仅自己` 时默认 `excludeFromAi=true`。
- `visibility=我离世后 / 条件触发` 时展示 `deliveryCondition`。
- `urgency=关键信息` 且 `status=最终版` 时必须填写 `deliveryCondition`。

如果条目已锁定：

- 默认表单只读。
- 点击“解锁编辑”后才能修改。
- V1 解锁后可直接把 `status` 回退为 `基本完成`。

#### 5.5 `legacy-delivery-map-tab.tsx`

按 `recipient -> visibility -> urgency` 分组展示。

需要计算：

- 每个接收者下的条目数。
- 每个可见时机下的条目数。
- 缺少交付条件的条目。
- 特定的人但没有具体接收者的条目。
- 关键信息但未完成的条目。

建议抽出工具函数：

```ts
export function buildLegacyDeliveryGroups(items: LegacyItem[]): LegacyDeliveryGroup[]
```

类型：

```ts
export type LegacyDeliveryGroup = {
  recipient: LegacyRecipient
  recipientName?: string
  sections: Array<{
    visibility: LegacyVisibility
    items: LegacyItem[]
    warnings: LegacyDeliveryWarning[]
  }>
}
```

#### 5.6 `legacy-relationship-expression-tab.tsx`

展示范围：

- `category=留给某人的话`
- `category=未完成的事` 且有 `relatedRelationshipId` 或 `recipientName`
- `visibility=现在` 的表达内容

页面块：

- 现在可以说的话。
- 离世后或未来交付的话。
- 仅自己整理的未完成牵挂。
- 未关联关系条目的表达。

V1 只展示关联信息，不强制实现跨模块写入。

后续可选动作：

- 从关系模块“想说的话”创建生命整理条目。
- 把生命整理条目复制到关系模块草稿。

#### 5.7 `legacy-trust-boundaries-tab.tsx`

从当前页面拆出 `trustBoundaries`，并补充条目级策略统计。

展示：

- 信任边界说明。
- 排除 AI 的条目。
- 需要二次确认的条目。
- 最终版锁定条目。
- 缺少交付条件的条目。
- 法律效力提示。

#### 6. 共享组件计划

新增 `legacy-page-shared.tsx`：

- `LegacyTabViewport`
- `LegacySidebarPane`
- `LegacyDetailPane`
- `LegacyMetricCard`
- `LegacyDistributionPanel`
- `LegacyItemCard`
- `LegacyMeta`
- `LegacyWarningCallout`

尽量从当前 `legacy-page.tsx` 里搬迁已有小组件，不重写视觉语言。

#### 7. 前端 API 计划

新增 API 方法：

```ts
export type BetterToLiveApi = {
  getLegacy: () => Promise<LegacyWorkspaceModuleData>
  listLegacyItems: () => Promise<LegacyItem[]>
  createLegacyItem: (form: LegacyItemForm) => Promise<LegacyItem>
  updateLegacyItem: (form: LegacyItemForm) => Promise<LegacyItem>
  deleteLegacyItem: (id: string) => Promise<void>
}
```

如果继续走 workspace snapshot，也至少需要：

- `getLegacy`
- `createLegacyItem`
- `updateLegacyItem`
- `deleteLegacyItem`

保存成功后：

- invalidate `workspaceQueryKeys.legacy()`
- 如果总览用 workspace snapshot，也 invalidate snapshot query

#### 8. 后端计划

生命整理模块可以采用比购物模块更轻的结构：

- 条目表拆关系表，支持 CRUD、筛选、锁定。
- 边界说明和回看问题可以先用 JSON seed 或静态 mock，后续再做 CRUD。

##### 8.1 新增 Rust 模块

建议目录：

```text
src-tauri/src/legacy/
  mod.rs
  dto.rs
  db.rs
  repository.rs
  commands.rs
  seed.json
```

`src-tauri/src/lib.rs` 中注册 commands。

##### 8.2 数据库表

```sql
CREATE TABLE IF NOT EXISTS legacy_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  recipient TEXT NOT NULL,
  recipient_name TEXT,
  related_relationship_id TEXT,
  urgency TEXT NOT NULL,
  visibility TEXT NOT NULL,
  delivery_condition TEXT,
  status TEXT NOT NULL,
  emotional_load TEXT,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  is_locked INTEGER NOT NULL DEFAULT 0,
  requires_second_confirm INTEGER NOT NULL DEFAULT 0,
  exclude_from_ai INTEGER NOT NULL DEFAULT 0,
  review_cue TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  finalized_at TEXT
);
```

```sql
CREATE TABLE IF NOT EXISTS legacy_item_tags (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (item_id) REFERENCES legacy_items(id) ON DELETE CASCADE
);
```

可选：

```sql
CREATE TABLE IF NOT EXISTS legacy_trust_boundaries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS legacy_review_prompts (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
```

V1 如果不想做边界说明 CRUD，可以不建后两张表，直接从 seed 或前端静态数据返回。

##### 8.3 DTO

```rust
#[derive(Debug, serde::Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LegacyItemDto {
    pub id: String,
    pub title: String,
    pub category: String,
    pub recipient: String,
    pub recipient_name: Option<String>,
    pub related_relationship_id: Option<String>,
    pub urgency: String,
    pub visibility: String,
    pub delivery_condition: Option<String>,
    pub status: String,
    pub emotional_load: Option<String>,
    pub summary: String,
    pub content: String,
    pub content_preview: String,
    pub is_locked: bool,
    pub requires_second_confirm: bool,
    pub exclude_from_ai: bool,
    pub created_at: String,
    pub updated_at: String,
    pub finalized_at: Option<String>,
    pub review_cue: String,
    pub tags: Vec<String>,
}
```

```rust
#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LegacyItemFormDto {
    pub id: Option<String>,
    pub title: String,
    pub category: String,
    pub recipient: String,
    pub recipient_name: Option<String>,
    pub related_relationship_id: Option<String>,
    pub urgency: String,
    pub visibility: String,
    pub delivery_condition: Option<String>,
    pub status: String,
    pub emotional_load: Option<String>,
    pub summary: String,
    pub content: String,
    pub is_locked: bool,
    pub requires_second_confirm: bool,
    pub exclude_from_ai: bool,
    pub review_cue: String,
    pub tags: Vec<String>,
}
```

##### 8.4 Tauri commands

```rust
#[tauri::command]
pub fn get_legacy(state: State<AppState>) -> Result<LegacyModuleDto, String>

#[tauri::command]
pub fn list_legacy_items(state: State<AppState>) -> Result<Vec<LegacyItemDto>, String>

#[tauri::command]
pub fn create_legacy_item(
    state: State<AppState>,
    form: LegacyItemFormDto,
) -> Result<LegacyItemDto, String>

#[tauri::command]
pub fn update_legacy_item(
    state: State<AppState>,
    form: LegacyItemFormDto,
) -> Result<LegacyItemDto, String>

#[tauri::command]
pub fn delete_legacy_item(state: State<AppState>, id: String) -> Result<(), String>
```

##### 8.5 Repository 规则

创建 / 更新时统一做业务规则：

- `status == "最终版"` 时 `is_locked = true`。
- `status == "最终版"` 且 `finalized_at` 为空时写入当前时间。
- `status != "最终版"` 时 `finalized_at` 可保留历史值，也可置空。V1 建议置空。
- `emotional_load == "很重"` 时 `requires_second_confirm = true`。
- `recipient == "仅自己"` 时 `exclude_from_ai = true`。
- 保存 tags 时先删除旧 tag，再按顺序插入。
- 删除条目使用软删除：`is_archived=1`。

查询时：

- 默认过滤 `is_archived=0`。
- `content_preview` 从 `content` 截断生成，前端不必自己截。

#### 9. 数据迁移

生命整理不再维护前端手写样例数据。前端 workspace mock 中 legacy 使用空 fallback，真实样例集中在 `src-tauri/src/legacy/seed.json`，并需要包含这些字段：

- `content`
- `requiresSecondConfirm`
- `excludeFromAi`
- `createdAt`
- `finalizedAt`

`contentPreview` 由后端根据 `content` 生成，用于卡片摘要；前端不再维护第二份生命整理样例。

#### 10. 搜索与 View Model

`use-workspace-view-model.ts` 中 legacy 搜索需要补充：

- `content`
- `requiresSecondConfirm ? "二次确认" : ""`
- `excludeFromAi ? "不参与AI" : ""`
- `createdAt`
- `finalizedAt`

如果拆 query：

- `useLegacyQuery`
- `legacyQueryKeys.items()`
- `legacyQueryKeys.detail(id)`

V1 可以先继续用 workspace snapshot，等 CRUD 接入后再拆。

#### 11. 国际化

需要补充 `src/i18n/locales/zh.json` 和 `src/i18n/locales/en.json`：

- Tab 名称。
- 编辑弹窗字段。
- 保存 / 删除 / 解锁提示。
- 交付条件 warning。
- AI 边界说明。
- 法律效力提示。
- 空状态文案。

建议 i18n key：

```text
legacy.tabs.overview
legacy.tabs.items
legacy.tabs.deliveryMap
legacy.tabs.relationshipExpression
legacy.tabs.trustBoundaries
legacy.fields.category
legacy.fields.recipient
legacy.fields.urgency
legacy.fields.visibility
legacy.fields.status
legacy.fields.emotionalLoad
legacy.fields.deliveryCondition
legacy.fields.excludeFromAi
legacy.fields.requiresSecondConfirm
legacy.actions.unlock
legacy.actions.finalize
legacy.warnings.missingDeliveryCondition
legacy.warnings.legalBoundary
```

#### 12. 实施顺序

1. 生成本设计文档与开发文档。
2. 扩展前端 `LegacyItem` 类型和后端 seed 数据。
3. 把 `legacy-page.tsx` 拆成 5 个 Tab 文件，保持现有展示能力不丢。
4. 新增条目库详情和编辑弹窗。
5. 新增交付地图分组工具和页面。
6. 新增关系表达页面。
7. 新增边界与信任页面。
8. 接入前端 API 方法，前端 mock 仅保留空 fallback 和接口形状。
9. 新增 Rust `legacy` 模块、SQLite 表和 Tauri commands。
10. live API 接入 Tauri commands。
11. 静态通读同模块文件，修掉命名、字段和类似遗漏问题。

#### 13. Done Criteria

以下条件都满足才算完成：

- 新生命整理设计文档存在，并明确 5 个 Tab 和条目库唯一数据源。
- 开发文档存在，并明确前端拆分、模型、API、后端表和实施顺序。
- 旧“告别与托付分类建议”不再作为唯一设计文档。
- 前端页面可以按总览、条目库、交付地图、关系表达、边界与信任拆分。
- 条目新增 / 编辑 / 删除有明确 API、Tauri commands 和 SQLite repository。
- `status=最终版`、`emotionalLoad=很重`、`visibility=我离世后 / 条件触发` 的保护规则清楚。
- 不运行测试、不启动本地，只做代码和文档静态检查。

#### 14. 本次不做

- 不接浏览器。
- 不运行测试或 lint。
- 不启动本地应用。
- 不做真实自动交付。
- 不做云同步和账号授权。
- 不做法律遗嘱生成。
- 不做加密方案落地。
