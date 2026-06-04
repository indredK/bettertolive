# 购物模块 CRUD 设计与落地方案

## 1. 这份文档解决什么

这份文档回答的是：

1. 如果接下来要让购物模块支持**物件增删查改**
2. 如果还要让购物模块各个页面里的内容支持**增删查改**
3. 在当前 Tauri + Rust + SQLite 的项目里，后端应该怎么设计

这份文档默认范围只讨论**购物模块**，不扩展到其他模块。

## 2. 当前状态

当前购物模块已经具备：

- Tauri Rust 后端
- SQLite 本地数据库
- `shopping_module_content` 单表 JSON 快照
- `get_shopping` 读取接口

这套结构适合**只读展示**，但如果接下来要支持 CRUD，会遇到两个问题：

1. 改一个物件，需要整体读出整块 JSON，再改完整块写回
2. 页面里的内容和物件混在同一个大 JSON 里，不利于表单编辑、局部保存、校验和回滚

所以，下一步不要继续把 CRUD 建在单个 `content_json` 上，而应该升级成**混合结构**。

## 3. 推荐总方案

推荐采用：

> **基础字典表 + 物件表 + 页面内容表 + 少量 JSON 字段**

不要一步走到“完全高度范式化”，也不要继续全塞进一个 JSON。

最合适的平衡是：

- **高频要改的内容**：拆成关系表
- **结构复杂但改动不频繁的内容**：保留 JSON 字段
- **只读聚合接口**：继续返回前端熟悉的 `ShoppingModuleData`

## 4. 先明确两个 CRUD 目标

### 4.1 物件 CRUD

这里的“物件”包括两类：

1. **已有物件**
   - 例如：现有床垫、书桌台灯、猫砂盆
2. **计划物件**
   - 例如：除湿机、人体工学椅、床垫升级

这类内容的特点：

- 字段相对稳定
- 数量会越来越多
- 会被筛选、排序、搜索、编辑

所以它们应该拆表。

### 4.2 页面内容 CRUD

这里的“页面内容”主要指：

- `systemDefinitions`
- `spotlights`
- `stageChecklists`
- `priceReferences`
- `boundaryEntries`
- `lifestyleCollections`

这类内容的特点：

- 更像编辑型内容，而不是流水数据
- 有些适合拆表，有些保留 JSON 更省事

所以这部分建议按“内容块”来设计，不必全做成很多复杂关联表。

## 5. 目标数据库结构

## 5.1 表一览

推荐至少拆成下面 10 张：

1. `shopping_system_definitions`
2. `shopping_owned_items`
3. `shopping_owned_item_spaces`
4. `shopping_owned_item_stages`
5. `shopping_purchase_lanes`
6. `shopping_plan_items`
7. `shopping_plan_item_spaces`
8. `shopping_plan_item_stages`
9. `shopping_plan_item_tags`
10. `shopping_page_content`

## 5.2 为什么是这个拆法

### 高频编辑对象

这些表专门支持物件 CRUD：

- `shopping_owned_items`
- `shopping_plan_items`

### 多选字段拆关联表

因为这些字段本来就是数组：

- `spaces`
- `stages`
- `tags`
- `keywords`

所以拆成：

- `shopping_owned_item_spaces`
- `shopping_owned_item_stages`
- `shopping_plan_item_spaces`
- `shopping_plan_item_stages`
- `shopping_plan_item_tags`

其中 `shopping_plan_item_tags` 用一个 `tag_type` 区分 `tag` 和 `keyword`。

### 页面内容统一收口

页面内容不必一开始拆成很多张，可以先统一进：

- `shopping_page_content`

把不同内容块按 `content_type` 分开存。

## 6. 详细表设计

## 6.1 `shopping_system_definitions`

用途：

- 支撑“系统地图”页
- 支撑物件归属选择

建议字段：

```sql
CREATE TABLE shopping_system_definitions (
  id TEXT PRIMARY KEY,
  cluster TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_question TEXT NOT NULL,
  secondary_groups_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

说明：

- `secondary_groups_json` 先保留 JSON 数组，没必要再拆一张表

## 6.2 `shopping_owned_items`

用途：

- 已有物件 CRUD

建议字段：

```sql
CREATE TABLE shopping_owned_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  system_id TEXT NOT NULL,
  category TEXT NOT NULL,
  necessity TEXT NOT NULL,
  lifecycle TEXT NOT NULL,
  depreciation TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  replacement_cue TEXT NOT NULL,
  note TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (system_id) REFERENCES shopping_system_definitions(id)
);
```

## 6.3 `shopping_owned_item_spaces`

```sql
CREATE TABLE shopping_owned_item_spaces (
  id TEXT PRIMARY KEY,
  owned_item_id TEXT NOT NULL,
  space_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (owned_item_id) REFERENCES shopping_owned_items(id)
);
```

## 6.4 `shopping_owned_item_stages`

```sql
CREATE TABLE shopping_owned_item_stages (
  id TEXT PRIMARY KEY,
  owned_item_id TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (owned_item_id) REFERENCES shopping_owned_items(id)
);
```

## 6.5 `shopping_purchase_lanes`

用途：

- 采购决策页里的分栏

```sql
CREATE TABLE shopping_purchase_lanes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 6.6 `shopping_plan_items`

用途：

- 待评估 / 待购买物件 CRUD

```sql
CREATE TABLE shopping_plan_items (
  id TEXT PRIMARY KEY,
  lane_id TEXT NOT NULL,
  name TEXT NOT NULL,
  system_id TEXT NOT NULL,
  category TEXT NOT NULL,
  necessity TEXT NOT NULL,
  lifecycle TEXT NOT NULL,
  depreciation TEXT,
  reason TEXT NOT NULL,
  target_lifestyle TEXT NOT NULL,
  current_price REAL NOT NULL,
  buy_below_price REAL NOT NULL,
  overpay_price REAL NOT NULL,
  note TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (lane_id) REFERENCES shopping_purchase_lanes(id),
  FOREIGN KEY (system_id) REFERENCES shopping_system_definitions(id)
);
```

## 6.7 `shopping_plan_item_spaces`

```sql
CREATE TABLE shopping_plan_item_spaces (
  id TEXT PRIMARY KEY,
  plan_item_id TEXT NOT NULL,
  space_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (plan_item_id) REFERENCES shopping_plan_items(id)
);
```

## 6.8 `shopping_plan_item_stages`

```sql
CREATE TABLE shopping_plan_item_stages (
  id TEXT PRIMARY KEY,
  plan_item_id TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (plan_item_id) REFERENCES shopping_plan_items(id)
);
```

## 6.9 `shopping_plan_item_tags`

```sql
CREATE TABLE shopping_plan_item_tags (
  id TEXT PRIMARY KEY,
  plan_item_id TEXT NOT NULL,
  tag_value TEXT NOT NULL,
  tag_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (plan_item_id) REFERENCES shopping_plan_items(id)
);
```

约定：

- `tag_type = 'tag'`
- `tag_type = 'keyword'`

## 6.10 `shopping_page_content`

用途：

- 支撑 overview、stages、planning 里那些编辑频率不高的内容块

```sql
CREATE TABLE shopping_page_content (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  title TEXT,
  stage TEXT,
  system_id TEXT,
  summary TEXT,
  reason TEXT,
  body_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### `content_type` 建议取值

- `spotlight`
- `stage_checklist`
- `price_reference`
- `boundary_entry`
- `lifestyle_collection`

### 为什么这里保留 `body_json`

因为这几类内容结构不同：

- spotlight 有 `attention[]`
- stage checklist 有 `sections[]`
- lifestyle collection 有 `items[]`

如果一开始为它们各自拆 3 到 5 张表，开发量太大。  
所以页面内容用“统一主表 + JSON 内容体”更省事。

## 7. DTO 设计

## 7.1 为什么 DTO 还保留 `ShoppingModuleData`

因为前端购物页已经建立在这个结构上了。  
后端拆表以后，不应该让前端跟着重写一遍页面。

所以建议：

- **数据库**：拆表
- **后端 service 输出**：继续拼成 `ShoppingModuleData`
- **前端页面**：基本不用改

这就是最稳的路径。

## 7.2 新增后台管理 DTO

为了做 CRUD，后端不能只有“只读聚合 DTO”，还需要“编辑 DTO”。

### 已有物件 DTO

```ts
type ShoppingOwnedItemFormDto = {
  id?: string
  name: string
  system: string
  category: string
  spaces: string[]
  stages: string[]
  necessity: string
  lifecycle: string
  depreciation?: string
  quantity: number
  status: string
  replacementCue: string
  note: string
}
```

### 计划物件 DTO

```ts
type ShoppingPlanItemFormDto = {
  id?: string
  laneId: string
  name: string
  system: string
  category: string
  spaces: string[]
  stages: string[]
  necessity: string
  lifecycle: string
  depreciation?: string
  reason: string
  targetLifestyle: string
  currentPrice: number
  buyBelowPrice: number
  overpayPrice: number
  note: string
  tags: string[]
  keywords: string[]
}
```

### 页面内容 DTO

```ts
type ShoppingPageContentFormDto = {
  id?: string
  contentType: string
  title?: string
  stage?: string
  system?: string
  summary?: string
  reason?: string
  body: Record<string, unknown>
}
```

## 8. 接口 / Tauri 命令设计

因为你当前是 Tauri 桌面应用，建议优先走：

- `tauri::command`

而不是先补 HTTP 服务。

## 8.1 只读命令

保留：

- `get_shopping`

作用：

- 返回聚合后的 `ShoppingModuleData`

## 8.2 物件 CRUD 命令

建议新增：

### 已有物件

- `list_owned_items`
- `create_owned_item`
- `update_owned_item`
- `delete_owned_item`

### 计划物件

- `list_plan_items`
- `create_plan_item`
- `update_plan_item`
- `delete_plan_item`

## 8.3 页面内容 CRUD 命令

建议新增：

- `list_shopping_page_contents`
- `create_shopping_page_content`
- `update_shopping_page_content`
- `delete_shopping_page_content`

## 8.4 为什么还要保留 `get_shopping`

因为页面真正消费的仍然是聚合后的模块对象。

也就是说：

- 编辑页 / 管理页：走 CRUD 命令
- 展示页：走 `get_shopping`

这样前台展示逻辑最稳定。

## 8.5 命令与前端操作一一对应

为了避免前端做着做着乱掉，建议每个按钮都只对应一个明确命令。

### 物件管理

| 前端操作 | 命令 | 参数 DTO | 返回值 | 前端后续动作 |
|---|---|---|---|---|
| 打开“已有物件管理”页 | `list_owned_items` | 无或筛选参数 | `ShoppingOwnedItemFormDto[]` | 渲染列表 |
| 点击“新增已有物件” | `create_owned_item` | `ShoppingOwnedItemFormDto` | 新建后的 `id` 或完整对象 | 关闭弹窗，刷新 `get_shopping` |
| 点击“编辑已有物件”保存 | `update_owned_item` | `ShoppingOwnedItemFormDto` | 更新后的对象或 `ok` | 关闭弹窗，刷新 `get_shopping` |
| 点击“删除已有物件”确认 | `delete_owned_item` | `{ id: string }` | `ok` | 关闭确认框，刷新 `get_shopping` |
| 打开“计划物件管理”页 | `list_plan_items` | 无或筛选参数 | `ShoppingPlanItemFormDto[]` | 渲染列表 |
| 点击“新增计划物件” | `create_plan_item` | `ShoppingPlanItemFormDto` | 新建后的 `id` 或完整对象 | 关闭弹窗，刷新 `get_shopping` |
| 点击“编辑计划物件”保存 | `update_plan_item` | `ShoppingPlanItemFormDto` | 更新后的对象或 `ok` | 关闭弹窗，刷新 `get_shopping` |
| 点击“删除计划物件”确认 | `delete_plan_item` | `{ id: string }` | `ok` | 关闭确认框，刷新 `get_shopping` |

### 页面内容管理

| 前端操作 | 命令 | 参数 DTO | 返回值 | 前端后续动作 |
|---|---|---|---|---|
| 打开“spotlight 管理” | `list_shopping_page_contents` | `{ contentType: "spotlight" }` | `ShoppingPageContentFormDto[]` | 渲染列表 |
| 新增 spotlight | `create_shopping_page_content` | `ShoppingPageContentFormDto` | 新建后的 `id` 或完整对象 | 刷新 `get_shopping` |
| 编辑 spotlight | `update_shopping_page_content` | `ShoppingPageContentFormDto` | 更新后的对象或 `ok` | 刷新 `get_shopping` |
| 删除 spotlight | `delete_shopping_page_content` | `{ id: string }` | `ok` | 刷新 `get_shopping` |
| 打开“阶段模板管理” | `list_shopping_page_contents` | `{ contentType: "stage_checklist" }` | `ShoppingPageContentFormDto[]` | 渲染列表 |
| 打开“价格参考管理” | `list_shopping_page_contents` | `{ contentType: "price_reference" }` | `ShoppingPageContentFormDto[]` | 渲染列表 |
| 打开“边界约定管理” | `list_shopping_page_contents` | `{ contentType: "boundary_entry" }` | `ShoppingPageContentFormDto[]` | 渲染列表 |
| 打开“生活方式集合管理” | `list_shopping_page_contents` | `{ contentType: "lifestyle_collection" }` | `ShoppingPageContentFormDto[]` | 渲染列表 |

## 8.6 变更后的前端刷新规则

当前项目里购物模块最终是挂在工作区快照里的，所以每次增删改成功后，前端至少要刷新：

- `workspaceQueryKeys.snapshot()`
- 如果后面单独补了购物模块查询，再额外刷新 `workspaceQueryKeys.shopping()`

建议统一做法：

1. 提交 mutation
2. 成功后关闭弹窗
3. `invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() })`
4. 重新走 `get_shopping`

不要手动在前端本地拼 patched 数据，容易和后端聚合结果偏离。

## 9. Repository / Service 分层

后端建议拆成三层：

### 9.1 Repository

只负责数据库读写：

- `ShoppingOwnedItemRepository`
- `ShoppingPlanItemRepository`
- `ShoppingPageContentRepository`
- `ShoppingSystemRepository`

### 9.2 Service

负责业务规则和聚合：

- `ShoppingCrudService`
- `ShoppingQueryService`

其中：

- `ShoppingCrudService` 负责增删改
- `ShoppingQueryService` 负责把多张表拼成 `ShoppingModuleData`

### 9.3 Command

只负责：

- 接收参数
- 调用 service
- 返回结果

## 10. 推荐查询方式

## 10.1 详情页 / 管理页

直接按表查询。

例如：

- 查一个已有物件
- 查一个计划物件
- 查某个 spotlight

## 10.2 展示页

统一走：

- `get_shopping`

在 service 里一次聚合出：

- `systemDefinitions`
- `spotlights`
- `ownedItems`
- `purchaseLanes`
- `stageChecklists`
- `priceReferences`
- `boundaryEntries`
- `lifestyleCollections`

## 10.3 为什么不让前端自己拼

因为前端自己拼会导致：

- 逻辑分散
- 请求变多
- 页面更脆

聚合应该由后端做。

## 11. 事务设计

物件 CRUD 一定要加事务。

因为一个物件不止一张表：

- 主表 1 条
- spaces 多条
- stages 多条
- tags / keywords 多条

### 创建一个计划物件时

应该在一个事务里完成：

1. 插入 `shopping_plan_items`
2. 插入 `shopping_plan_item_spaces`
3. 插入 `shopping_plan_item_stages`
4. 插入 `shopping_plan_item_tags`

只要有一步失败，就整体回滚。

### 更新一个计划物件时

建议：

1. 更新主表
2. 删除旧的 spaces / stages / tags
3. 重建新的 spaces / stages / tags

这比做复杂 diff 更稳。

## 12. 校验规则

## 12.1 枚举校验

这些字段必须只允许合法值：

- `system`
- `necessity`
- `lifecycle`
- `depreciation`
- `stage`

## 12.2 数字校验

- `quantity >= 0`
- `currentPrice >= 0`
- `buyBelowPrice >= 0`
- `overpayPrice >= 0`

并且建议：

- `buyBelowPrice <= overpayPrice`

## 12.3 文本校验

- `name` 必填
- `category` 必填
- `reason` 必填
- `note` 可必填但允许空字符串

## 12.4 数组校验

- `spaces` 可以为空数组
- `stages` 不建议为空
- `tags` / `keywords` 可以为空数组

## 13. 页面层怎么接

如果你要做真正的编辑页，建议分两类页面：

## 13.1 展示页

就是现在已有这些：

- 总览
- 系统地图
- 空间巡检
- 阶段模板
- 采购决策

它们继续只读展示。

## 13.2 管理页

新增一组“后台式”的编辑页面，例如：

- `购物 > 物件管理 > 已有物件`
- `购物 > 物件管理 > 计划物件`
- `购物 > 内容管理 > spotlight`
- `购物 > 内容管理 > 阶段模板`

这样不要把编辑表单直接塞进现有只读页里，页面会清楚很多。

## 13.3 页面级按钮位置

基于你现在的页面结构，推荐把编辑入口放在**页面顶部工具区**，而不是散落到每张卡片上。

### 顶层入口

位置建议：

- 放在 `ShoppingPage` 里
- 具体位置在 `PageIntro` 下面、`TabsList` 上面
- 布局是一行工具栏：
  - 左边保持 tabs
  - 右边放管理按钮

推荐按钮：

- `物件管理`
- `内容管理`

说明：

- `物件管理` 打开一个管理弹窗，里面用 tabs 切 `已有物件 / 计划物件`
- `内容管理` 打开一个管理弹窗，里面用 tabs 切 `spotlight / 阶段模板 / 价格参考 / 边界约定 / 生活方式`

这样做的好处是：

- 现有 5 个只读 tab 不被打乱
- 编辑入口集中
- 不需要把“删除”这种高风险动作暴露在展示面板里

## 13.4 各个现有 tab 里的辅助按钮位置

展示页仍然以只读为主，但可以补少量“带上下文的编辑入口”。

### 总览 tab

位置：

- `当前该先看什么` 区块标题右侧

按钮：

- `管理 spotlight`
- `管理边界约定`

作用：

- 打开 `内容管理` 弹窗，并自动切到对应子 tab

### 系统地图 tab

位置：

- 右侧详情面板标题区域

按钮：

- `新增已有物件`
- `新增计划物件`
- `编辑系统说明`

行为：

- 点击 `新增已有物件` 时，表单里的 `system` 默认带上当前系统
- 点击 `新增计划物件` 时，表单里的 `system` 默认带上当前系统
- 点击 `编辑系统说明` 时，打开系统定义编辑弹窗

### 空间巡检 tab

位置：

- 右侧详情面板标题区域

按钮：

- `新增已有物件`
- `新增计划物件`

行为：

- 表单里的 `spaces` 默认带上当前空间

### 阶段模板 tab

位置：

- 右侧详情面板标题区域

按钮：

- `新增阶段模板`
- `编辑当前模板`
- `删除当前模板`

行为：

- `新增阶段模板` 打开空白模板表单
- `编辑当前模板` 预填当前 checklist
- `删除当前模板` 必须二次确认

### 采购决策 tab

位置：

- 左侧筛选面板顶部右侧
- 右侧详情面板标题区域

按钮：

- 左侧：`新增计划物件`
- 右侧：`编辑当前物件`、`删除当前物件`

行为：

- 当前选中了某个计划物件时，右侧按钮可用
- 未选中时，右侧按钮禁用

## 13.5 管理弹窗内部布局

建议统一使用现有的 `Dialog` 组件体系。

当前项目里已经有：

- [src/components/ui/dialog.tsx](/Users/apple/Documents/github/bettertolive/src/components/ui/dialog.tsx:1)

所以新管理 UI 推荐统一成下面这个形态：

### 物件管理弹窗

结构：

1. 顶部标题
2. 二级 tabs：`已有物件 / 计划物件`
3. 左侧列表
4. 右侧表单
5. 底部操作区

按钮位置：

- 左侧列表顶部右侧：`新增`
- 每条列表项右侧：`编辑` 图标按钮、`删除` 图标按钮
- 右侧表单底部：`取消`、`保存`

### 内容管理弹窗

结构：

1. 顶部标题
2. 二级 tabs：`spotlight / 阶段模板 / 价格参考 / 边界约定 / 生活方式`
3. 左侧列表
4. 右侧表单
5. 底部操作区

按钮位置：

- 左侧列表顶部右侧：`新增`
- 每条列表项右侧：`编辑`、`删除`
- 右侧表单底部：`取消`、`保存`

## 13.6 前端按钮与命令映射

这一张表是最值得照着做的。

| 页面位置 | 按钮 | 打开/触发 | 对应命令 |
|---|---|---|---|
| 页面顶部工具栏 | `物件管理` | 打开物件管理弹窗 | `list_owned_items` / `list_plan_items` |
| 页面顶部工具栏 | `内容管理` | 打开内容管理弹窗 | `list_shopping_page_contents` |
| 系统地图详情面板 | `新增已有物件` | 打开已有物件表单并预填 `system` | `create_owned_item` |
| 系统地图详情面板 | `新增计划物件` | 打开计划物件表单并预填 `system` | `create_plan_item` |
| 空间巡检详情面板 | `新增已有物件` | 打开已有物件表单并预填 `spaces` | `create_owned_item` |
| 空间巡检详情面板 | `新增计划物件` | 打开计划物件表单并预填 `spaces` | `create_plan_item` |
| 阶段模板详情面板 | `编辑当前模板` | 打开模板表单并预填当前模板 | `update_shopping_page_content` |
| 阶段模板详情面板 | `删除当前模板` | 打开确认框 | `delete_shopping_page_content` |
| 采购决策左栏 | `新增计划物件` | 打开计划物件表单 | `create_plan_item` |
| 采购决策右栏 | `编辑当前物件` | 打开计划物件表单并预填当前物件 | `update_plan_item` |
| 采购决策右栏 | `删除当前物件` | 打开确认框 | `delete_plan_item` |
| 物件管理列表 | `新增` | 打开空白表单 | `create_owned_item` / `create_plan_item` |
| 物件管理列表行 | `编辑` | 打开预填表单 | `update_owned_item` / `update_plan_item` |
| 物件管理列表行 | `删除` | 打开确认框 | `delete_owned_item` / `delete_plan_item` |
| 内容管理列表 | `新增` | 打开空白表单 | `create_shopping_page_content` |
| 内容管理列表行 | `编辑` | 打开预填表单 | `update_shopping_page_content` |
| 内容管理列表行 | `删除` | 打开确认框 | `delete_shopping_page_content` |

## 13.7 表单保存与删除交互规范

### 保存

保存按钮位置统一：

- 表单底部右侧

按钮顺序统一：

- 左边 `取消`
- 右边 `保存`

保存成功后动作统一：

1. 关闭弹窗
2. 刷新 `workspace snapshot`
3. 保留当前 tab
4. 如果是编辑当前选中项，尽量保持当前选中状态

### 删除

删除按钮不要直接执行删除。

统一流程：

1. 点击 `删除`
2. 打开二次确认框
3. 文案明确写出物件或内容标题
4. 确认后调用删除命令
5. 删除成功后刷新 `workspace snapshot`

## 13.8 当前最适合先做的前端顺序

推荐顺序：

1. 先做页面顶部工具栏
2. 先做 `物件管理` 弹窗
3. 先打通 `已有物件` CRUD
4. 再打通 `计划物件` CRUD
5. 再做 `内容管理` 弹窗
6. 最后给现有只读 tab 补少量上下文按钮

## 14. 推荐开发顺序

最稳的顺序是：

### 第 1 步

保留当前 `get_shopping`

### 第 2 步

新增关系表：

- `shopping_owned_items`
- `shopping_plan_items`
- 各自的 spaces / stages / tags 关联表

### 第 3 步

先打通**物件 CRUD**

优先顺序：

1. `create_owned_item`
2. `update_owned_item`
3. `delete_owned_item`
4. `create_plan_item`
5. `update_plan_item`
6. `delete_plan_item`

### 第 4 步

让 `get_shopping` 改成从这些表聚合，而不是再从 JSON 快照读

### 第 5 步

再补页面内容 CRUD：

- spotlight
- stage checklist
- price reference
- boundary entry
- lifestyle collection

### 第 6 步

最后再考虑：

- 排序拖拽
- 批量编辑
- 导入导出

## 15. 不建议这样做

以下方案不建议：

### 方案 A：继续只改 `content_json`

问题：

- 修改粒度太粗
- 容易并发覆盖
- 不适合表单保存

### 方案 B：一次把所有内容拆成二十几张表

问题：

- 开发成本高
- 页面内容的关系复杂度不值这个价

### 方案 C：前端自己拼页面数据

问题：

- 页面负担太重
- 后端价值被削弱

## 16. 最终建议

一句话总结：

> 如果你下一步要做购物模块的增删查改，最合适的方案不是继续维护一个大 JSON，也不是立刻全量范式化；  
> 而是升级成**物件拆表、页面内容半结构化、展示接口继续聚合**的混合后端架构。

最值得先做的是两件事：

1. **先打通物件 CRUD**
2. **让 `get_shopping` 从关系表聚合生成**

等这个跑稳了，再做页面内容 CRUD。
