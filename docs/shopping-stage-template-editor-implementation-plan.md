# 阶段模板编辑器重构实现计划

## Summary

当前阶段模板编辑器只有一层“阶段物品”列表，保存结构也只有：

- `stageTemplate`
- `stageItems[]`
- `stageItemTiers[]`

这能支撑“阶段详情页按系统/空间分组展示”，但**不能支撑编辑器里的按视角选维度、在维度下增删物品、切换视角继续补充**。

这次重构目标是：

1. 阶段模板编辑弹窗改成稳定的双栏布局：
   - 左侧：基本属性
   - 右侧：阶段物品编辑器
2. 右侧编辑器支持两种视角：
   - 系统视角
   - 空间视角
3. 每种视角下都能先添加“维度”，再在维度下添加物品。
4. 物品的 `最低 / 基础 / 升级` 三档子级改用多选选择框编辑。
5. 切换视角时，本地草稿不丢。
6. 保存后前后端都能持久化，并且再次打开时能还原编辑状态。

## Core Design

### 1. 物品档位仍然全局唯一

一个阶段里的物品档位配置继续保持：

- 每个物品只保存一份 `tiers`
- 不因为它出现在多个系统或多个空间下而复制配置

原因：

1. 这和现有“阶段详情页”的语义一致。
2. 避免同一个物品在系统视角和空间视角出现两份互相冲突的数据。
3. 切换视角时，只是换一个分组观察和编辑入口，不是换一套独立数据。

因此保留现有：

- `ShoppingStageItem { itemId, tiers }`

## 2. 新增“已选维度”持久化

为了支持“先加系统 / 空间维度，再在维度下加物品”，阶段模板需要新增两组持久化字段：

- `systemDimensionIds: string[]`
- `spaceDimensionIds: string[]`

含义：

1. **系统视角**下，编辑器只展示这些系统维度。
2. **空间视角**下，编辑器只展示这些空间维度。
3. 物品依旧根据自身 `systemTags` / `spaceTags` 自动落入对应维度。

这意味着：

- “维度”是阶段模板显式选择的。
- “物品属于哪个维度”仍然由物品标签决定。
- “物品三档配置”仍然是全局唯一。

## 3. 维度与物品关系不单独建 placement 表

本次实现**不新增“维度-物品 placement”表**，原因：

1. 现有物品本身已经有系统 / 空间标签。
2. 阶段详情页已经基于标签做 group-by。
3. 如果再引入 placement，会让“标签归属”和“阶段手动归属”产生两套来源。

推荐规则：

1. 在某个系统维度下添加物品时，只允许选择 `systemTags` 包含该系统的物品。
2. 在某个空间维度下添加物品时，只允许选择 `spaceTags` 包含该空间的物品。
3. 物品一旦加入阶段，就会在所有匹配的已选维度下出现。

这样编辑器行为和详情页行为保持一致。

## Frontend Plan

### 1. 类型扩展

扩展前端模型：

```ts
type ShoppingStageTemplate = {
  id: string
  name: string
  description: string
  focus: string
  systemDimensionIds: string[]
  spaceDimensionIds: string[]
  items: ShoppingStageItem[]
}
```

同时扩展表单类型：

```ts
type ShoppingStageTemplateForm = {
  id?: string | null
  name: string
  description: string
  focus: string
  systemDimensionIds: string[]
  spaceDimensionIds: string[]
  items: ShoppingStageItem[]
}
```

### 2. 编辑弹窗布局

阶段模板编辑弹窗右侧改成：

- 顶部：视角切换 Tabs
- 中部：当前视角的维度列表
- 底部：保持弹窗页脚按钮

布局要求：

1. 左右两栏都固定在弹窗内部，不随内容整体一起滚动。
2. 左栏自身 `overflow-y-auto`
3. 右栏自身 `overflow-hidden`
4. 右栏内部“维度列表区”单独 `overflow-y-auto`

建议骨架：

```tsx
DialogContent
  DialogHeader (sticky)
  body: grid
    leftPane: flex flex-col min-h-0
      leftScroll: overflow-y-auto
    rightPane: flex flex-col min-h-0
      tabsHeader: shrink-0
      dimensionToolbar: shrink-0
      dimensionScroll: flex-1 min-h-0 overflow-y-auto
  DialogFooter (sticky)
```

### 3. 本地草稿状态

编辑器不直接操作 `seed.items`，而是建立 draft：

```ts
type StageEditorDraft = {
  name: string
  description: string
  focus: string
  systemDimensionIds: string[]
  spaceDimensionIds: string[]
  items: ShoppingStageItem[]
}
```

要求：

1. 切换系统/空间视角时不重建草稿。
2. 添加维度、删除维度、添加物品、删除物品、修改 tiers 都直接写入 draft。
3. 保存时一次性转成后端表单。

### 4. 维度操作

#### 系统视角

支持：

- 添加系统维度
- 删除系统维度

添加逻辑：

1. 只显示还未选中的 `systemDefinitions`
2. 选中后写入 `draft.systemDimensionIds`

#### 空间视角

支持：

- 添加空间维度
- 删除空间维度

添加逻辑：

1. 只显示还未选中的 `spaceDefinitions`
2. 选中后写入 `draft.spaceDimensionIds`

### 5. 维度下添加物品

每个维度 section 内提供一个“添加物品”选择器。

规则：

#### 在系统维度下

候选物品必须满足：

1. `item.systemTags.includes(systemId)`
2. 当前阶段里还没有这个 `itemId`

#### 在空间维度下

候选物品必须满足：

1. `item.spaceTags.includes(spaceId)`
2. 当前阶段里还没有这个 `itemId`

添加后：

```ts
{
  itemId,
  tiers: { low: [], base: [], up: [] }
}
```

### 6. 维度下编辑 tiers

维度 section 中的每个物品卡片需要：

- 显示物品名
- 提供“从阶段移除”按钮
- 提供三个多选选择框：
  - 最低
  - 基础
  - 升级

候选值来自：

- `item.children`

交互规则：

1. 三个档位都允许多选。
2. 同一子级本次先允许出现在多个档位中，保持当前后端兼容。
3. 如果后续要限制“一个子级只能属于一个档位”，再单独加规则，不并入这次重构。

### 7. 删除维度时的处理

删除维度后需要清理“孤儿物品”：

如果一个阶段物品在删除该维度后，已经不再匹配任何已选系统维度，也不再匹配任何已选空间维度，则自动从 `draft.items` 删除。

这样能避免保存出“阶段里有物品，但两个视角都看不见”的状态。

### 8. 阶段详情页同步

阶段模板详情页也要读取：

- `systemDimensionIds`
- `spaceDimensionIds`

优先规则：

1. 如果阶段模板带有显式维度列表，则只渲染这些维度。
2. 如果是历史数据，维度列表为空，则回退到现有逻辑：
   - 根据已选物品的标签动态推导分组

这样可以兼容旧数据。

## Backend Plan

### 1. DTO 扩展

扩展 Rust DTO：

```rust
pub struct ShoppingStageTemplateDto {
    pub id: String,
    pub name: String,
    pub description: String,
    pub focus: String,
    pub system_dimension_ids: Vec<String>,
    pub space_dimension_ids: Vec<String>,
    pub items: Vec<ShoppingStageItemDto>,
}
```

扩展 `StageTemplateFormDto`：

```rust
pub struct StageTemplateFormDto {
    pub id: Option<String>,
    pub name: String,
    pub description: String,
    pub focus: String,
    pub system_dimension_ids: Vec<String>,
    pub space_dimension_ids: Vec<String>,
    pub items: Vec<StageItemFormDto>,
}
```

### 2. 数据库表

新增两张表：

```sql
shopping_stage_template_system_dimensions (
  id TEXT PRIMARY KEY,
  stage_template_id TEXT NOT NULL,
  system_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
)

shopping_stage_template_space_dimensions (
  id TEXT PRIMARY KEY,
  stage_template_id TEXT NOT NULL,
  space_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
)
```

约束：

- `stage_template_id` 外键级联删除

不改已有：

- `shopping_stage_templates`
- `shopping_stage_items`
- `shopping_stage_item_tiers`

### 3. Repository 改造

#### 读取

为 `list_stage_templates_dto` / `get_stage_template_by_id` 增加：

- `list_system_dimensions_for_stage_template`
- `list_space_dimensions_for_stage_template`

#### 写入

在 `upsert_stage_template` 中：

1. 更新模板主表
2. 清空旧的：
   - `shopping_stage_template_system_dimensions`
   - `shopping_stage_template_space_dimensions`
   - `shopping_stage_items`
3. 重插入：
   - 维度列表
   - 阶段物品
   - 阶段物品 tiers

### 4. Tauri 命令链

需要同步更新：

- `commands.rs`
- `dto.rs`
- `repository.rs`
- `db.rs`
- `bindings.ts`

以及前端调用类型：

- `bettertolive-api.ts`
- `shopping-crud-api.ts`
- `workspace.ts`

## Compatibility Strategy

### 1. 历史数据兼容

旧数据没有维度表时：

- 读取结果返回：
  - `systemDimensionIds: []`
  - `spaceDimensionIds: []`

详情页和编辑器初始化时：

1. 如果显式维度为空
2. 从 `stage.items` 对应物品的标签中推导默认维度

这样旧数据能直接编辑，不需要额外迁移脚本。

### 2. 保存后的新数据

新保存数据会写入显式维度表。

之后：

- 编辑器优先按显式维度恢复
- 详情页优先按显式维度分组

## Implementation Order

1. 扩展前端 / 后端类型
2. 新增两张维度表
3. 改 repository 读取与保存链路
4. 更新阶段详情页，支持显式维度优先
5. 重构阶段编辑弹窗草稿状态
6. 接入视角切换 + 添加维度
7. 接入维度下添加物品
8. 接入 tiers 多选选择框
9. 接入删除维度时的孤儿物品清理
10. 做一轮静态代码自查

## Done Criteria

以下条件全部满足才算完成：

1. 阶段模板编辑弹窗左栏和右栏都固定，内容各自滚动。
2. 右栏可切换系统视角 / 空间视角，切换不丢草稿。
3. 两个视角都能添加和删除维度。
4. 每个维度下都能添加符合标签条件的物品。
5. 每个物品都能用多选选择框编辑 `最低 / 基础 / 升级`。
6. 删除维度后不会残留不可见的孤儿阶段物品。
7. 保存后再次打开，维度和物品配置都能恢复。
8. 阶段详情页能按显式维度渲染；旧数据仍能回退显示。
