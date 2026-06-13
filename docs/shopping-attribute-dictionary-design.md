# Shopping Attribute Dictionary Design

## 背景

当前购物模块同时存在两套相互拉扯的实现：

1. `systemDefinitions`、`spaceDefinitions`、`stageTemplates` 已经是后端可管理数据。
2. `status`、`lifecycle`、`depreciation`、默认渠道等属性仍然主要依赖前端硬编码枚举、样式映射和 i18n 文案。

这导致购物模块出现以下结构性问题：

- 前端组件直接依赖枚举常量，新增或调整属性值需要改多处代码。
- 后端实际用 `String` 持久化属性，但前端仍把它们视为强类型枚举，契约不一致。
- 某些属性同时承载“显示文案”和“业务语义”，后续一旦开放可编辑，极易把业务规则字符串化。

本设计文档的目标，是把“适合数据化管理的属性定义”从前端常量中抽出来，同时保留必要的稳定语义，避免把业务状态机做成任意文本。

## 现状审计

### 前端硬编码链路

- 枚举定义集中在 [workspace.ts](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/models/workspace.ts:123)
- 选项数组、样式映射、显示名函数集中在 [shopping-page-data.ts](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/ui/shopping/shopping-page-data.ts:19)
- 物品编辑器直接消费这些常量 [shopping-item-edit-dialog.tsx](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/ui/shopping/shopping-item-edit-dialog.tsx:37)
- 多语言展示名仍然依赖 `shopping.enumNames.*` [zh.json](/Users/apple/Documents/github/bettertolive/src/i18n/locales/zh.json:198)

### 后端现状

- 购物属性实际以 `String` / `Option<String>` 存储在 SQLite 中 [models.rs](/Users/apple/Documents/github/bettertolive/src-tauri/src/shopping/models.rs:35)
- 子级属性写入表 `shopping_item_children`，并没有外键约束到任何属性定义表 [db.rs](/Users/apple/Documents/github/bettertolive/src-tauri/src/shopping/db.rs:169)
- 购物聚合直接返回 `ShoppingModuleDto`，其中目前不包含“属性定义” [dto.rs](/Users/apple/Documents/github/bettertolive/src-tauri/src/shopping/dto.rs:173)

### 已存在的业务耦合

- `Owned/Wanted` 已用于空间和系统统计 [shopping-systems-tab.tsx](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/ui/shopping/shopping-systems-tab.tsx:57)
- 后端概览统计同样硬依赖 `"Wanted"` 字符串 [repository.rs](/Users/apple/Documents/github/bettertolive/src-tauri/src/shopping/repository.rs:293)
- `depreciation` 当前主要是展示属性，但已经存在 `FAST_DEPRECIATION` 这类潜在业务分层 [shopping-page-data.ts](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/ui/shopping/shopping-page-data.ts:81)

## 结论

可以做专门的管理界面，但不能把所有枚举都变成完全自由文本。

### 适合管理界面的属性

- `depreciation`
- `lifecycle`
- `health_status`
- 默认渠道模板

这些属性的主要职责是：

- 供用户选择
- 供界面显示
- 供过滤器展示
- 允许后期调整中文/英文文案、排序、启用状态、颜色风格

### 不应完全自由化的属性

- `status`
- `lane`

原因是它们已经参与业务判断、统计和聚合。它们可以开放“显示名、排序、启用状态、样式”，但必须保留稳定语义键。

## 设计原则

1. 业务规则绑定稳定语义，不绑定可编辑文案。
2. 可国际化文本跟着属性定义走，不再散落到前端 i18n 静态枚举字典。
3. 历史数据优先保留，属性删除默认做软删除。
4. 写入时必须做后端校验，前端不能单独担保合法性。
5. 第一阶段先补只读字典能力，再上管理 UI 和写入校验，降低回归面。

## 目标模型

### 属性分类

```ts
export type ShoppingAttributeKind =
  | "status"
  | "lane"
  | "lifecycle"
  | "depreciation"
  | "health_status"
  | "channel"
```

### 属性选项

```ts
export type ShoppingAttributeSemanticKey =
  | "owned"
  | "wanted"
  | "now"
  | "wait"
  | "hold"
  | "very_fast"
  | "fast"
  | "medium"
  | "slow"
  | "no_depreciation"
  | "consumable"
  | "durable"
  | "tool"
  | "emotional"
  | "stable_use"
  | "consider_upgrade"
  | "need_restock"
  | "missing_parts"
  | "need_complete"
  | "channel"
```

```ts
export type ShoppingAttributeDefinition = {
  id: string
  kind: ShoppingAttributeKind
  code: string
  semanticKey?: ShoppingAttributeSemanticKey | null
  label: string
  labelEn?: string | null
  description?: string | null
  styleToken?: string | null
  rank?: number | null
  sortOrder: number
  isEnabled: boolean
  isSystem: boolean
}
```

说明：

- `code` 是稳定持久化值，写入业务数据时引用它。
- `semanticKey` 是稳定业务语义，仅对参与业务判断的属性必填。
- `label` / `labelEn` 承担国际化展示。
- `rank` 用于类似折旧程度这类有序属性。
- `isSystem` 用于区分系统内置项和用户扩展项。

## 数据库方案

新增表：

```sql
CREATE TABLE shopping_attribute_definitions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  code TEXT NOT NULL,
  semantic_key TEXT,
  label TEXT NOT NULL,
  label_en TEXT,
  description TEXT NOT NULL DEFAULT '',
  style_token TEXT,
  rank INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  is_system INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(kind, code)
);
```

第一阶段不立刻改动 `shopping_item_children.status/lifecycle/depreciation` 的存储结构，继续保存 `code` 字符串。

这样做有两个好处：

1. 避免一次性迁移所有购物数据。
2. 保持现有 DTO 和 UI 兼容，先增加定义表，再逐步把消费方切过去。

## API 设计

第一阶段只增加只读输出：

- `ShoppingModuleDto.attributeDefinitions`
- `list_shopping_attribute_definitions`

后续再增加：

- `create_shopping_attribute_definition`
- `update_shopping_attribute_definition`
- `disable_shopping_attribute_definition`
- `reorder_shopping_attribute_definitions`

## 前端消费方案

### 现阶段

前端先继续保留原 `ShoppingStatus` / `ShoppingLifecycle` / `ShoppingDepreciation` 常量，不立即删除。

新增一层数据适配：

- 优先从后端 `attributeDefinitions` 读取标签和排序
- 若后端尚未返回对应定义，则 fallback 到旧的 `shopping.enumNames.*`

### 后续替换顺序

1. 替换 `depreciation` 选择器和展示 badge
2. 替换 `lifecycle`
3. 替换 `health_status`
4. 引入默认渠道字典
5. 最后才处理 `status/lane`

## 并发与一致性要求

### 风险

- 管理界面允许删除正在被引用的属性值，会造成历史数据变成“悬空 code”
- 多窗口或多线程同时编辑属性定义时，排序和启用状态可能互相覆盖
- 如果前端拿旧缓存提交，可能写入已经被禁用的属性值

### 约束

1. 所有属性定义写操作必须在事务中执行。
2. 删除默认实现为 `is_enabled = 0`，不做物理删除。
3. 创建和更新物品时，后端校验：
   - `status/lifecycle/depreciation/health_status` 必须存在且启用
   - `status/lane` 还必须满足预期语义集合
4. 重排接口按 `kind` 维度执行，避免跨类排序互相污染。

## 国际化策略

这是这次改造最值得做的部分之一。

现状中，枚举标签散落在 `zh.json` / `en.json` 中，前端还要手写 key 拼接。后续应改为：

- 系统级内置属性的中英文标签随 seed 初始化进数据库
- 前端根据当前 locale 选择 `label` / `labelEn`
- 保留旧 i18n key 仅作为过渡 fallback

这样可以避免：

- 文案变更必须发版
- 中文和英文字典不一致
- 新增属性但忘记加多语言 key

## UI 管理界面建议

不建议为每类属性各写一套页面。

建议复用你当前 `systemDefinitions/spaceDefinitions` 的管理模式，做一个统一的 `ShoppingAttributeDefinitionsTab`：

- 左侧：按 `kind` 分组列表
- 右侧：属性项明细与编辑表单
- 顶部：分类切换
- 支持：新增、编辑、启用/停用、拖拽排序

表单字段建议：

- 分类
- 代码
- 中文名
- 英文名
- 描述
- 样式 token
- rank
- semantic key
- 是否启用

其中 `semantic key` 对 `status/lane` 必填，对 `depreciation` 推荐填写，对纯展示类属性可为空。

## 分阶段落地计划

### Phase 1

- 新增 `shopping_attribute_definitions` 表
- seed 初始化内置属性
- 后端 DTO 聚合返回 `attributeDefinitions`
- 形成设计文档

### Phase 2

- 前端增加数据适配层
- `depreciation/lifecycle/health_status` 优先切到定义表驱动
- 保留旧枚举作为兼容 fallback

### Phase 3

- 增加属性管理界面
- 增加 CRUD / reorder / disable 接口

### Phase 4

- 物品写入时启用后端属性合法性校验
- 清理旧的前端硬编码枚举和 i18n 枚举文案

## 本次开始实现的范围

本轮开始实现以下内容：

1. 新增设计文档
2. 后端新增属性定义表及 seed
3. 后端聚合 DTO 返回 `attributeDefinitions`
4. 暂不改现有购物 UI 行为

这样可以先把数据模型和 API 基础铺平，再逐步替换前端消费链路。
