# 购物模块开发文档
> 汇总购物模块后端契约、CRUD 架构和专项实现计划。

---

## 后端开发参考

### 购物模块后端开发参考

#### 1. 文档目的

这份文档是给后端开发直接参考的。

目标不是讨论产品概念，而是明确这 4 件事：

1. 购物模块后端现在到底要做什么
2. 接口应该返回什么 JSON
3. 数据库先怎么落地最合适
4. 第一版应该按什么顺序开发

#### 2. DTO 是什么

`DTO` 是 `Data Transfer Object` 的缩写，可以理解成：

> 前后端通过接口传来传去的那份数据结构

它和另外两个东西不要混：

- **数据库表结构**：决定数据怎么存
- **前端组件状态**：决定页面怎么显示

在这个项目里，DTO 最接近：

- HTTP 接口返回的 JSON 形状
- 前端 `requestJson<T>()` 里那个 `T`

比如购物模块里，前端现在期待的其实就是一个 `ShoppingModuleData` 形状的 JSON。  
后端如果返回别的结构，前端就接不上。

#### 3. 模块定位

当前购物模块不是电商系统，也不是高频录入的购物清单工具。

它更接近一个：

- 生活物品分类工作台
- 阶段清单与采购判断内容库
- 读多写少的只读内容模块

所以后端设计原则是：

- 先保证 **读接口稳定**
- 先保证 **DTO 和前端对齐**
- 先保证 **内容快照可存可取**
- 不要一开始就拆成很多关系表

#### 4. 当前前端契约

前端当前 API 入口见：

- [src/features/bettertolive/api/endpoints.ts](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/api/endpoints.ts:1)
- [src/features/bettertolive/api/live/live-bettertolive-api.ts](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/api/live/live-bettertolive-api.ts:1)
- [src/features/bettertolive/models/workspace.ts](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/models/workspace.ts:50)

##### 4.1 必须对齐的接口

第一阶段至少要明确这两个接口：

1. `GET /api/bettertolive/shopping`
2. `GET /api/bettertolive/workspace`

其中：

- `GET /shopping` 返回购物模块本身
- `GET /workspace` 返回全局快照，里面包含 `shopping`

##### 4.2 最重要的契约

`GET /api/bettertolive/shopping` **不要包一层响应壳**。

也就是说，前端要的不是：

```json
{
  "code": 0,
  "data": {
    "...": "..."
  }
}
```

前端当前要的是：

```json
{
  "systemDefinitions": [],
  "spotlights": [],
  "ownedItems": [],
  "purchaseLanes": [],
  "stageChecklists": [],
  "priceReferences": [],
  "boundaryEntries": [],
  "lifestyleCollections": []
}
```

#### 5. 第一版推荐方案

##### 5.1 结论

第一版后端建议直接采用：

- `SQLite`
- 单表存购物模块内容快照
- HTTP 接口按前端当前 DTO 原样返回

##### 5.2 为什么这样最合适

因为当前购物模块：

- 读多写少
- 单人使用
- 本地优先
- 以内容展示和聚合为主

这时先拆很多表，只会增加开发量和维护成本，实际收益很小。

#### 6. 数据库设计

##### 6.1 最小可行表结构

```sql
CREATE TABLE shopping_module_content (
  id TEXT PRIMARY KEY,
  module_key TEXT NOT NULL UNIQUE,
  content_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (json_valid(content_json))
);
```

##### 6.2 字段说明

- `id`: 主键，建议固定 UUID
- `module_key`: 固定写 `shopping`
- `content_json`: 直接存 `ShoppingModuleDto`
- `version`: 内容版本号，后续内容变更时可递增
- `created_at`: 创建时间，ISO 8601 字符串
- `updated_at`: 更新时间，ISO 8601 字符串

##### 6.3 推荐初始化数据

第一版直接把当前 seed 数据作为初始化数据导入：

- [src-tauri/src/shopping/seed.json](../../src-tauri/src/shopping/seed.json)

推荐初始化约定：

- `module_key = "shopping"`
- `content_json = shoppingMockData`
- `version = 1`

#### 7. DTO 契约

这一节是后端必须严格对齐的 JSON 结构。

##### 7.1 枚举值

这些值当前建议 **按字符串原样返回**，不要擅自改成英文码。

```ts
type ShoppingNeedLevel = "最低配置" | "必要" | "改善体验" | "提升幸福感"

type ShoppingSystem =
  | "睡眠"
  | "饮食"
  | "清洁"
  | "收纳"
  | "照明"
  | "环境"
  | "电力网络"
  | "工作学习"
  | "应急健康"
  | "个人护理"
  | "穿着"
  | "家具陈设"
  | "出行"
  | "娱乐爱好"
  | "宠物"

type ShoppingStage =
  | "搬家最低配"
  | "租房"
  | "长期居住"
  | "自有住房"
  | "自建房"
  | "地下室"

type ShoppingLifecycle = "消耗品" | "耐用品" | "工具" | "情感物"

type ShoppingDepreciation =
  | "极快折旧"
  | "较快折旧"
  | "中等折旧"
  | "慢折旧"
  | "不折旧或升值"

type ShoppingSystemCluster = "基础系统" | "家居与生活方式"
```

##### 7.2 DTO 定义

```ts
type ShoppingSpotlightDto = {
  id: string
  title: string
  stage: string
  summary: string
  reason: string
  attention: string[]
}

type ShoppingSystemDefinitionDto = {
  id: ShoppingSystem
  cluster: ShoppingSystemCluster
  summary: string
  keyQuestion: string
  secondaryGroups: string[]
}

type ShoppingItemBaseDto = {
  system: ShoppingSystem
  category: string
  spaces: string[]
  stages: ShoppingStage[]
  necessity: ShoppingNeedLevel
  lifecycle: ShoppingLifecycle
  depreciation?: ShoppingDepreciation
}

type ShoppingOwnedItemDto = ShoppingItemBaseDto & {
  id: string
  name: string
  quantity: number
  status: string
  replacementCue: string
  note: string
}

type ShoppingPlanItemDto = ShoppingItemBaseDto & {
  id: string
  name: string
  reason: string
  targetLifestyle: string
  currentPrice: number
  buyBelowPrice: number
  overpayPrice: number
  note: string
  tags: string[]
  keywords: string[]
}

type ShoppingPurchaseLaneDto = {
  id: string
  title: string
  subtitle: string
  items: ShoppingPlanItemDto[]
}

type ShoppingStageChecklistSectionDto = {
  system: ShoppingSystem
  minimum: string[]
  essentials: string[]
  upgrades: string[]
}

type ShoppingStageChecklistDto = {
  id: string
  stage: ShoppingStage
  title: string
  description: string
  focus: string
  sections: ShoppingStageChecklistSectionDto[]
}

type ShoppingPriceReferenceDto = {
  id: string
  system: ShoppingSystem
  category: string
  lifecycle: ShoppingLifecycle
  depreciation?: ShoppingDepreciation
  entryPrice: number
  sweetSpotPrice: number
  overpayPrice: number
  note: string
}

type ShoppingBoundaryEntryDto = {
  id: string
  item: string
  system: ShoppingSystem
  reason: string
}

type ShoppingLifestyleCollectionDto = {
  id: string
  title: string
  description: string
  items: string[]
}

type ShoppingModuleDto = {
  systemDefinitions: ShoppingSystemDefinitionDto[]
  spotlights: ShoppingSpotlightDto[]
  ownedItems: ShoppingOwnedItemDto[]
  purchaseLanes: ShoppingPurchaseLaneDto[]
  stageChecklists: ShoppingStageChecklistDto[]
  priceReferences: ShoppingPriceReferenceDto[]
  boundaryEntries: ShoppingBoundaryEntryDto[]
  lifestyleCollections: ShoppingLifestyleCollectionDto[]
}
```

#### 8. DTO 规则

##### 8.1 必须始终返回数组

以下字段就算没有内容，也必须返回空数组 `[]`，不要返回 `null`：

- `systemDefinitions`
- `spotlights`
- `ownedItems`
- `purchaseLanes`
- `stageChecklists`
- `priceReferences`
- `boundaryEntries`
- `lifestyleCollections`

同理，内部这些字段也不要返回 `null`：

- `secondaryGroups`
- `attention`
- `spaces`
- `stages`
- `tags`
- `keywords`
- `sections`
- `minimum`
- `essentials`
- `upgrades`
- `items`

##### 8.2 `depreciation` 是可选字段

这个字段可以缺省。

建议规则：

- `lifecycle = "耐用品"` 或 `"工具"` 时，可以填写
- `lifecycle = "消耗品"` 或 `"情感物"` 时，通常省略

##### 8.3 价格字段规则

当前前端展示格式见：

- [src/features/bettertolive/ui/shared/formatters.ts](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/ui/shared/formatters.ts:1)

当前建议后端直接返回：

- 人民币元单位
- 数字类型
- 默认按整数处理

例如：

- `799`
- `1299`
- `39`

不要在第一版改成“分”为单位，否则前端金额显示会直接错位。

##### 8.4 `id` 必须稳定

不要每次请求都重新生成 `id`。

因为前端很多地方会把这些 `id` 当作：

- React key
- 详情选择标识
- 视图切换定位依据

#### 9. 接口设计

##### 9.1 必做接口

###### `GET /api/bettertolive/shopping`

作用：

- 返回购物模块完整内容

响应：

- `200 OK`
- body 直接为 `ShoppingModuleDto`

###### 示例

```json
{
  "systemDefinitions": [
    {
      "id": "睡眠",
      "cluster": "基础系统",
      "summary": "睡眠不是一件单品，而是一整套恢复力基础设施。",
      "keyQuestion": "我睡得着、睡得好吗？",
      "secondaryGroups": ["骨架", "寝具", "温控", "环境", "睡眠辅助"]
    }
  ],
  "spotlights": [
    {
      "id": "focus-sleep",
      "title": "睡眠系统仍然是当前最值得补齐的一组",
      "stage": "长期居住",
      "summary": "床垫、遮光、除湿和睡前照明会一起决定第二天的恢复力。",
      "reason": "这不是买一件舒服单品，而是把每天都在用的系统先稳住。",
      "attention": ["把床垫、遮光帘、床边灯和除湿机放在同一张桌上看。"]
    }
  ],
  "ownedItems": [],
  "purchaseLanes": [],
  "stageChecklists": [],
  "priceReferences": [],
  "boundaryEntries": [],
  "lifestyleCollections": []
}
```

##### 9.2 第二阶段接口

###### `GET /api/bettertolive/workspace`

作用：

- 返回工作区全量快照

当前前端最终期待的是：

```ts
type WorkspaceSnapshotDto = {
  overview: unknown
  reflection: unknown
  events: unknown
  finance: unknown
  shopping: ShoppingModuleDto
  nutrition: unknown
  emotion: unknown
  beliefs: unknown
  principles: unknown
  relationships: unknown
  growth: unknown
  memory: unknown
  legacy: unknown
  socioeconomics: unknown
  future: unknown
}
```

如果后端第一阶段只做购物模块，建议：

1. 先只完成 `GET /shopping`
2. 前端暂时不要整体切到 `live` 模式
3. 等其他模块接口也有了，再接 `GET /workspace`

这样最省事，也最不容易把自己绊住。

#### 10. 推荐实现流程

##### 第一步：建表

先创建 `shopping_module_content`。

##### 第二步：导入 seed

把当前 `shopping.mock.ts` 内容转成 JSON，写入 `content_json`。

##### 第三步：写 repository

建议最少有一个读取方法：

```ts
getShoppingModuleContent(): Promise<ShoppingModuleDto>
```

逻辑：

1. 根据 `module_key = "shopping"` 查一条记录
2. 读取 `content_json`
3. 解析 JSON
4. 校验结构
5. 返回 DTO

##### 第四步：写 service

service 层先不要加太多业务。

第一版只做：

- 读取内容
- 做结构兜底
- 返回 DTO

##### 第五步：写 controller / route

把 service 的返回值原样响应到：

- `GET /api/bettertolive/shopping`

##### 第六步：做最小校验

至少校验：

- 顶层 8 个数组字段都存在
- `purchaseLanes[].items` 是数组
- `stageChecklists[].sections` 是数组
- `ownedItems[].spaces` / `stages` 是数组
- `purchaseLanes[].items[].tags` / `keywords` 是数组

#### 11. 推荐校验策略

如果你要加运行时校验，建议在后端用一套 schema 工具把 DTO 校住。

例如：

- `zod`
- `valibot`
- `typebox`

原则是：

- 先在后端校验数据库里的 JSON
- 校验通过后再返回给前端

这样后面你哪天手改了一次 seed，也不会把页面 quietly 弄坏。

#### 12. 不建议第一版做的事

这些先别做，容易把开发量拉爆：

- 一开始就把购物模块拆成十几张表
- 一开始就做完整增删改后台
- 一开始就引入复杂的筛选查询接口
- 一开始就把中文枚举改成英文 code + label 双轨体系
- 一开始就把价格单位改成分

#### 13. 第一版完成标准

满足下面这几条，就算第一版后端对购物模块已经能用了：

1. SQLite 表已创建
2. seed 数据已落库
3. `GET /api/bettertolive/shopping` 可返回合法 JSON
4. 返回结构与 `ShoppingModuleDto` 一致
5. 前端切到 live 后，购物页至少能正常渲染

#### 14. 后续升级路线

等未来真的出现稳定编辑需求，再考虑拆表：

##### 阶段 A：当前

- 单表 JSON 快照

##### 阶段 B：轻度编辑

可先拆出：

- `shopping_systems`
- `shopping_owned_items`
- `shopping_purchase_lanes`

但 `stageChecklists`、`spotlights`、`lifestyleCollections` 仍可先保留 JSON。

##### 阶段 C：重度编辑

只有当购物模块真的变成高频编辑系统时，再考虑把：

- `spaces`
- `stages`
- `tags`
- `keywords`

进一步拆成关系表。
---

## CRUD 设计与落地方案

### 购物模块 CRUD 设计与落地方案

#### 1. 这份文档解决什么

这份文档回答的是：

1. 如果接下来要让购物模块支持**物件增删查改**
2. 如果还要让购物模块各个页面里的内容支持**增删查改**
3. 在当前 Tauri + Rust + SQLite 的项目里，后端应该怎么设计

这份文档默认范围只讨论**购物模块**，不扩展到其他模块。

#### 2. 当前状态

当前购物模块已经具备：

- Tauri Rust 后端
- SQLite 本地数据库
- `shopping_module_content` 单表 JSON 快照
- `get_shopping` 读取接口

这套结构适合**只读展示**，但如果接下来要支持 CRUD，会遇到两个问题：

1. 改一个物件，需要整体读出整块 JSON，再改完整块写回
2. 页面里的内容和物件混在同一个大 JSON 里，不利于表单编辑、局部保存、校验和回滚

所以，下一步不要继续把 CRUD 建在单个 `content_json` 上，而应该升级成**混合结构**。

#### 3. 推荐总方案

推荐采用：

> **基础字典表 + 物件表 + 页面内容表 + 少量 JSON 字段**

不要一步走到“完全高度范式化”，也不要继续全塞进一个 JSON。

最合适的平衡是：

- **高频要改的内容**：拆成关系表
- **结构复杂但改动不频繁的内容**：保留 JSON 字段
- **只读聚合接口**：继续返回前端熟悉的 `ShoppingModuleData`

#### 4. 先明确两个 CRUD 目标

##### 4.1 物件 CRUD

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

##### 4.2 页面内容 CRUD

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

#### 5. 目标数据库结构

#### 5.1 表一览

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

#### 5.2 为什么是这个拆法

##### 高频编辑对象

这些表专门支持物件 CRUD：

- `shopping_owned_items`
- `shopping_plan_items`

##### 多选字段拆关联表

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

##### 页面内容统一收口

页面内容不必一开始拆成很多张，可以先统一进：

- `shopping_page_content`

把不同内容块按 `content_type` 分开存。

#### 6. 详细表设计

#### 6.1 `shopping_system_definitions`

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

#### 6.2 `shopping_owned_items`

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

#### 6.3 `shopping_owned_item_spaces`

```sql
CREATE TABLE shopping_owned_item_spaces (
  id TEXT PRIMARY KEY,
  owned_item_id TEXT NOT NULL,
  space_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (owned_item_id) REFERENCES shopping_owned_items(id)
);
```

#### 6.4 `shopping_owned_item_stages`

```sql
CREATE TABLE shopping_owned_item_stages (
  id TEXT PRIMARY KEY,
  owned_item_id TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (owned_item_id) REFERENCES shopping_owned_items(id)
);
```

#### 6.5 `shopping_purchase_lanes`

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

#### 6.6 `shopping_plan_items`

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

#### 6.7 `shopping_plan_item_spaces`

```sql
CREATE TABLE shopping_plan_item_spaces (
  id TEXT PRIMARY KEY,
  plan_item_id TEXT NOT NULL,
  space_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (plan_item_id) REFERENCES shopping_plan_items(id)
);
```

#### 6.8 `shopping_plan_item_stages`

```sql
CREATE TABLE shopping_plan_item_stages (
  id TEXT PRIMARY KEY,
  plan_item_id TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (plan_item_id) REFERENCES shopping_plan_items(id)
);
```

#### 6.9 `shopping_plan_item_tags`

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

#### 6.10 `shopping_page_content`

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

##### `content_type` 建议取值

- `spotlight`
- `stage_checklist`
- `price_reference`
- `boundary_entry`
- `lifestyle_collection`

##### 为什么这里保留 `body_json`

因为这几类内容结构不同：

- spotlight 有 `attention[]`
- stage checklist 有 `sections[]`
- lifestyle collection 有 `items[]`

如果一开始为它们各自拆 3 到 5 张表，开发量太大。  
所以页面内容用“统一主表 + JSON 内容体”更省事。

#### 7. DTO 设计

#### 7.1 为什么 DTO 还保留 `ShoppingModuleData`

因为前端购物页已经建立在这个结构上了。  
后端拆表以后，不应该让前端跟着重写一遍页面。

所以建议：

- **数据库**：拆表
- **后端 service 输出**：继续拼成 `ShoppingModuleData`
- **前端页面**：基本不用改

这就是最稳的路径。

#### 7.2 新增后台管理 DTO

为了做 CRUD，后端不能只有“只读聚合 DTO”，还需要“编辑 DTO”。

##### 已有物件 DTO

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

##### 计划物件 DTO

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

##### 页面内容 DTO

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

#### 8. 接口 / Tauri 命令设计

因为你当前是 Tauri 桌面应用，建议优先走：

- `tauri::command`

而不是先补 HTTP 服务。

#### 8.1 只读命令

保留：

- `get_shopping`

作用：

- 返回聚合后的 `ShoppingModuleData`

#### 8.2 物件 CRUD 命令

建议新增：

##### 已有物件

- `list_owned_items`
- `create_owned_item`
- `update_owned_item`
- `delete_owned_item`

##### 计划物件

- `list_plan_items`
- `create_plan_item`
- `update_plan_item`
- `delete_plan_item`

#### 8.3 页面内容 CRUD 命令

建议新增：

- `list_shopping_page_contents`
- `create_shopping_page_content`
- `update_shopping_page_content`
- `delete_shopping_page_content`

#### 8.4 为什么还要保留 `get_shopping`

因为页面真正消费的仍然是聚合后的模块对象。

也就是说：

- 编辑页 / 管理页：走 CRUD 命令
- 展示页：走 `get_shopping`

这样前台展示逻辑最稳定。

#### 8.5 命令与前端操作一一对应

为了避免前端做着做着乱掉，建议每个按钮都只对应一个明确命令。

##### 物件管理

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

##### 页面内容管理

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

#### 8.6 变更后的前端刷新规则

当前项目里购物模块最终是挂在工作区快照里的，所以每次增删改成功后，前端至少要刷新：

- `workspaceQueryKeys.snapshot()`
- 如果后面单独补了购物模块查询，再额外刷新 `workspaceQueryKeys.shopping()`

建议统一做法：

1. 提交 mutation
2. 成功后关闭弹窗
3. `invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() })`
4. 重新走 `get_shopping`

不要手动在前端本地拼 patched 数据，容易和后端聚合结果偏离。

#### 9. Repository / Service 分层

后端建议拆成三层：

##### 9.1 Repository

只负责数据库读写：

- `ShoppingOwnedItemRepository`
- `ShoppingPlanItemRepository`
- `ShoppingPageContentRepository`
- `ShoppingSystemRepository`

##### 9.2 Service

负责业务规则和聚合：

- `ShoppingCrudService`
- `ShoppingQueryService`

其中：

- `ShoppingCrudService` 负责增删改
- `ShoppingQueryService` 负责把多张表拼成 `ShoppingModuleData`

##### 9.3 Command

只负责：

- 接收参数
- 调用 service
- 返回结果

#### 10. 推荐查询方式

#### 10.1 详情页 / 管理页

直接按表查询。

例如：

- 查一个已有物件
- 查一个计划物件
- 查某个 spotlight

#### 10.2 展示页

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

#### 10.3 为什么不让前端自己拼

因为前端自己拼会导致：

- 逻辑分散
- 请求变多
- 页面更脆

聚合应该由后端做。

#### 11. 事务设计

物件 CRUD 一定要加事务。

因为一个物件不止一张表：

- 主表 1 条
- spaces 多条
- stages 多条
- tags / keywords 多条

##### 创建一个计划物件时

应该在一个事务里完成：

1. 插入 `shopping_plan_items`
2. 插入 `shopping_plan_item_spaces`
3. 插入 `shopping_plan_item_stages`
4. 插入 `shopping_plan_item_tags`

只要有一步失败，就整体回滚。

##### 更新一个计划物件时

建议：

1. 更新主表
2. 删除旧的 spaces / stages / tags
3. 重建新的 spaces / stages / tags

这比做复杂 diff 更稳。

#### 12. 校验规则

#### 12.1 枚举校验

这些字段必须只允许合法值：

- `system`
- `necessity`
- `lifecycle`
- `depreciation`
- `stage`

#### 12.2 数字校验

- `quantity >= 0`
- `currentPrice >= 0`
- `buyBelowPrice >= 0`
- `overpayPrice >= 0`

并且建议：

- `buyBelowPrice <= overpayPrice`

#### 12.3 文本校验

- `name` 必填
- `category` 必填
- `reason` 必填
- `note` 可必填但允许空字符串

#### 12.4 数组校验

- `spaces` 可以为空数组
- `stages` 不建议为空
- `tags` / `keywords` 可以为空数组

#### 13. 页面层怎么接

如果你要做真正的编辑页，建议分两类页面：

#### 13.1 展示页

就是现在已有这些：

- 总览
- 系统地图
- 空间巡检
- 阶段模板
- 采购决策

它们继续只读展示。

#### 13.2 管理页

新增一组“后台式”的编辑页面，例如：

- `购物 > 物件管理 > 已有物件`
- `购物 > 物件管理 > 计划物件`
- `购物 > 内容管理 > spotlight`
- `购物 > 内容管理 > 阶段模板`

这样不要把编辑表单直接塞进现有只读页里，页面会清楚很多。

#### 13.3 页面级按钮位置

基于你现在的页面结构，推荐把编辑入口放在**页面顶部工具区**，而不是散落到每张卡片上。

##### 顶层入口

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

#### 13.4 各个现有 tab 里的辅助按钮位置

展示页仍然以只读为主，但可以补少量“带上下文的编辑入口”。

##### 总览 tab

位置：

- `当前该先看什么` 区块标题右侧

按钮：

- `管理 spotlight`
- `管理边界约定`

作用：

- 打开 `内容管理` 弹窗，并自动切到对应子 tab

##### 系统地图 tab

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

##### 空间巡检 tab

位置：

- 右侧详情面板标题区域

按钮：

- `新增已有物件`
- `新增计划物件`

行为：

- 表单里的 `spaces` 默认带上当前空间

##### 阶段模板 tab

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

##### 采购决策 tab

位置：

- 左侧筛选面板顶部右侧
- 右侧详情面板标题区域

按钮：

- 左侧：`新增计划物件`
- 右侧：`编辑当前物件`、`删除当前物件`

行为：

- 当前选中了某个计划物件时，右侧按钮可用
- 未选中时，右侧按钮禁用

#### 13.5 管理弹窗内部布局

建议统一使用现有的 `Dialog` 组件体系。

当前项目里已经有：

- [src/components/ui/dialog.tsx](/Users/apple/Documents/github/bettertolive/src/components/ui/dialog.tsx:1)

所以新管理 UI 推荐统一成下面这个形态：

##### 物件管理弹窗

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

##### 内容管理弹窗

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

#### 13.6 前端按钮与命令映射

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

#### 13.7 表单保存与删除交互规范

##### 保存

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

##### 删除

删除按钮不要直接执行删除。

统一流程：

1. 点击 `删除`
2. 打开二次确认框
3. 文案明确写出物件或内容标题
4. 确认后调用删除命令
5. 删除成功后刷新 `workspace snapshot`

#### 13.8 当前最适合先做的前端顺序

推荐顺序：

1. 先做页面顶部工具栏
2. 先做 `物件管理` 弹窗
3. 先打通 `已有物件` CRUD
4. 再打通 `计划物件` CRUD
5. 再做 `内容管理` 弹窗
6. 最后给现有只读 tab 补少量上下文按钮

#### 14. 推荐开发顺序

最稳的顺序是：

##### 第 1 步

保留当前 `get_shopping`

##### 第 2 步

新增关系表：

- `shopping_owned_items`
- `shopping_plan_items`
- 各自的 spaces / stages / tags 关联表

##### 第 3 步

先打通**物件 CRUD**

优先顺序：

1. `create_owned_item`
2. `update_owned_item`
3. `delete_owned_item`
4. `create_plan_item`
5. `update_plan_item`
6. `delete_plan_item`

##### 第 4 步

让 `get_shopping` 改成从这些表聚合，而不是再从 JSON 快照读

##### 第 5 步

再补页面内容 CRUD：

- spotlight
- stage checklist
- price reference
- boundary entry
- lifestyle collection

##### 第 6 步

最后再考虑：

- 排序拖拽
- 批量编辑
- 导入导出

#### 15. 不建议这样做

以下方案不建议：

##### 方案 A：继续只改 `content_json`

问题：

- 修改粒度太粗
- 容易并发覆盖
- 不适合表单保存

##### 方案 B：一次把所有内容拆成二十几张表

问题：

- 开发成本高
- 页面内容的关系复杂度不值这个价

##### 方案 C：前端自己拼页面数据

问题：

- 页面负担太重
- 后端价值被削弱

#### 16. 最终建议

一句话总结：

> 如果你下一步要做购物模块的增删查改，最合适的方案不是继续维护一个大 JSON，也不是立刻全量范式化；  
> 而是升级成**物件拆表、页面内容半结构化、展示接口继续聚合**的混合后端架构。

最值得先做的是两件事：

1. **先打通物件 CRUD**
2. **让 `get_shopping` 从关系表聚合生成**

等这个跑稳了，再做页面内容 CRUD。
---

## 弹窗与物件收集实现计划

### 购物模块弹窗与物件收集实现计划

#### Summary

本次范围收敛在购物模块的 3 个编辑弹窗：

1. `采购决策` 里的物件编辑弹窗
2. `系统地图` 里的系统编辑弹窗
3. `空间巡检` 里的空间编辑弹窗

当前问题可以归并成两类：

##### 1. 弹窗布局和观感不够稳定

- 采购决策的物件编辑弹窗目前是单列长表单，容易整体滚动，视觉也比较散。
- 系统地图 / 空间巡检弹窗字段很少，空间利用率低，和当前购物页其他编辑器不一致。

##### 2. 系统 / 空间弹窗没有“收集物件”能力

- 目前系统定义只存 `name / summary / keyQuestion / secondaryGroups`
- 目前空间定义只存 `name`
- 物件和系统 / 空间的关联实际存在于：
  - `shopping_item_systems`
  - `shopping_item_spaces`
- 但前端编辑弹窗没有提供关联物件的操作入口。

这次实现目标是：

1. 优化三个弹窗的布局和空间分配
2. 让系统 / 空间弹窗支持通过穿梭框收集物件
3. 收集物件时不再按“已购 / 待购”拆栏，只把状态作为物件元信息展示
4. 后端补齐系统 / 空间与物件关联的批量更新命令

#### Core Decision

##### 1. 物件归属仍然以物件标签表为唯一真相

系统和空间与物件的关系仍然不单独挂在 system / space 定义上，而是继续沿用：

- `shopping_item_systems`
- `shopping_item_spaces`

也就是说：

- 系统弹窗里的“已选物件” = 当前所有 `systemTags` 包含该系统 ID 的物件
- 空间弹窗里的“已选物件” = 当前所有 `spaceTags` 包含该空间 ID 的物件

##### 2. 系统 / 空间收集改成后端批量重绑

不采用“前端逐个 updateItem”的方式，而是补两个后端命令：

- `assign_system_definition_items(systemId, itemIds)`
- `assign_space_definition_items(spaceId, itemIds)`

后端行为：

1. 删除该系统 / 空间在关联表中的旧关系
2. 按前端传入的 `itemIds` 重新插入
3. 不改动物件的其他字段

这样职责更清楚，也避免系统 / 空间弹窗为了改归属去提交整条物件表单。

#### Frontend Plan

#### 1. 新增可复用物件穿梭框

重写 `shopping-item-shuttle.tsx`，支持：

- 左侧候选列表
- 右侧已选列表
- 两侧各自搜索
- 勾选后批量加入 / 批量移除
- 全部加入 / 全部移除

候选和已选都展示：

- 物件名称
- 状态 badge
- 生命周期 badge
- 子级摘要（如果有）

但不再按“已购 / 待购”分栏。

#### 2. 优化采购决策物件编辑弹窗

物件编辑弹窗改成双栏固定布局：

- 左栏：基础信息、子级、备注
- 右栏：系统标签、空间标签、采购属性、价格参考、渠道

要求：

1. 弹窗本体 `overflow-hidden`
2. 标题 sticky
3. 底部按钮 sticky
4. 左右栏各自滚动，尽量避免整窗滚动
5. 适当放宽宽度，减少纵向挤压

#### 3. 优化系统编辑弹窗

系统编辑弹窗改成双栏：

- 左栏：ID、名称、概述、关键问题、二级分组
- 右栏：物件收集穿梭框

保存逻辑：

1. 先创建 / 更新系统定义
2. 再调用 `assign_system_definition_items(systemId, itemIds)`

其中：

- 新建时使用用户输入的系统 ID
- 编辑时使用原系统 ID

#### 4. 优化空间编辑弹窗

空间编辑弹窗改成双栏：

- 左栏：空间名称
- 右栏：物件收集穿梭框

保存逻辑：

1. 新建时先 `createSpaceDefinition`
2. 用返回的 `space.id` 调用 `assign_space_definition_items(spaceId, itemIds)`
3. 编辑时先 `updateSpaceDefinition`
4. 再调用 `assign_space_definition_items(existingSpaceId, itemIds)`

#### Backend Plan

##### 1. 新增系统物件批量归属命令

新增命令：

```rust
assign_system_definition_items(system_id: String, item_ids: Vec<String>)
```

repository 逻辑：

1. `DELETE FROM shopping_item_systems WHERE system_id = ?`
2. 遍历 `item_ids`
3. 重新插入 `(item_id, system_id, sort_order)`

##### 2. 新增空间物件批量归属命令

新增命令：

```rust
assign_space_definition_items(space_id: String, item_ids: Vec<String>)
```

repository 逻辑：

1. `DELETE FROM shopping_item_spaces WHERE space_id = ?`
2. 遍历 `item_ids`
3. 重新插入 `(item_id, space_id, sort_order)`

##### 3. Typescript 绑定与前端 API 同步

需要同步更新：

- `src-tauri/src/shopping/commands.rs`
- `src-tauri/src/shopping/repository.rs`
- `src-tauri/src/lib.rs`
- `src/bindings.ts`
- `src/features/bettertolive/api/shopping-crud-api.ts`

本次不需要新增表，也不需要改 schema。

#### Implementation Order

1. 生成本计划文档
2. 实现后端批量归属命令
3. 接入前端 API
4. 重写物件穿梭框
5. 重构系统编辑弹窗
6. 重构空间编辑弹窗
7. 重构采购决策物件编辑弹窗
8. 静态通读相关文件，确保相同模块下无遗留旧逻辑

#### Done Criteria

以下条件都满足才算完成：

1. 本地存在可直接用于开发的实现计划 md
2. 采购决策物件编辑弹窗明显更紧凑，尽量不依赖整窗滚动
3. 系统编辑弹窗可以收集物件
4. 空间编辑弹窗可以收集物件
5. 系统 / 空间收集物件时不再按已购 / 待购拆栏
6. 系统 / 空间收集能力有对应后端命令闭环
7. 不运行测试、不启动本地，只完成代码实现和静态自检
---

## 阶段模板编辑器重构实现计划

### 阶段模板编辑器重构实现计划

#### Summary

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

#### Core Design

##### 1. 物品档位仍然全局唯一

一个阶段里的物品档位配置继续保持：

- 每个物品只保存一份 `tiers`
- 不因为它出现在多个系统或多个空间下而复制配置

原因：

1. 这和现有“阶段详情页”的语义一致。
2. 避免同一个物品在系统视角和空间视角出现两份互相冲突的数据。
3. 切换视角时，只是换一个分组观察和编辑入口，不是换一套独立数据。

因此保留现有：

- `ShoppingStageItem { itemId, tiers }`

#### 2. 新增“已选维度”持久化

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

#### 3. 维度与物品关系不单独建 placement 表

本次实现**不新增“维度-物品 placement”表**，原因：

1. 现有物品本身已经有系统 / 空间标签。
2. 阶段详情页已经基于标签做 group-by。
3. 如果再引入 placement，会让“标签归属”和“阶段手动归属”产生两套来源。

推荐规则：

1. 在某个系统维度下添加物品时，只允许选择 `systemTags` 包含该系统的物品。
2. 在某个空间维度下添加物品时，只允许选择 `spaceTags` 包含该空间的物品。
3. 物品一旦加入阶段，就会在所有匹配的已选维度下出现。

这样编辑器行为和详情页行为保持一致。

#### Frontend Plan

##### 1. 类型扩展

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

##### 2. 编辑弹窗布局

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

##### 3. 本地草稿状态

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

##### 4. 维度操作

###### 系统视角

支持：

- 添加系统维度
- 删除系统维度

添加逻辑：

1. 只显示还未选中的 `systemDefinitions`
2. 选中后写入 `draft.systemDimensionIds`

###### 空间视角

支持：

- 添加空间维度
- 删除空间维度

添加逻辑：

1. 只显示还未选中的 `spaceDefinitions`
2. 选中后写入 `draft.spaceDimensionIds`

##### 5. 维度下添加物品

每个维度 section 内提供一个“添加物品”选择器。

规则：

###### 在系统维度下

候选物品必须满足：

1. `item.systemTags.includes(systemId)`
2. 当前阶段里还没有这个 `itemId`

###### 在空间维度下

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

##### 6. 维度下编辑 tiers

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

##### 7. 删除维度时的处理

删除维度后需要清理“孤儿物品”：

如果一个阶段物品在删除该维度后，已经不再匹配任何已选系统维度，也不再匹配任何已选空间维度，则自动从 `draft.items` 删除。

这样能避免保存出“阶段里有物品，但两个视角都看不见”的状态。

##### 8. 阶段详情页同步

阶段模板详情页也要读取：

- `systemDimensionIds`
- `spaceDimensionIds`

优先规则：

1. 如果阶段模板带有显式维度列表，则只渲染这些维度。
2. 如果是历史数据，维度列表为空，则回退到现有逻辑：
   - 根据已选物品的标签动态推导分组

这样可以兼容旧数据。

#### Backend Plan

##### 1. DTO 扩展

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

##### 2. 数据库表

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

##### 3. Repository 改造

###### 读取

为 `list_stage_templates_dto` / `get_stage_template_by_id` 增加：

- `list_system_dimensions_for_stage_template`
- `list_space_dimensions_for_stage_template`

###### 写入

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

##### 4. Tauri 命令链

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

#### Compatibility Strategy

##### 1. 历史数据兼容

旧数据没有维度表时：

- 读取结果返回：
  - `systemDimensionIds: []`
  - `spaceDimensionIds: []`

详情页和编辑器初始化时：

1. 如果显式维度为空
2. 从 `stage.items` 对应物品的标签中推导默认维度

这样旧数据能直接编辑，不需要额外迁移脚本。

##### 2. 保存后的新数据

新保存数据会写入显式维度表。

之后：

- 编辑器优先按显式维度恢复
- 详情页优先按显式维度分组

#### Implementation Order

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

#### Done Criteria

以下条件全部满足才算完成：

1. 阶段模板编辑弹窗左栏和右栏都固定，内容各自滚动。
2. 右栏可切换系统视角 / 空间视角，切换不丢草稿。
3. 两个视角都能添加和删除维度。
4. 每个维度下都能添加符合标签条件的物品。
5. 每个物品都能用多选选择框编辑 `最低 / 基础 / 升级`。
6. 删除维度后不会残留不可见的孤儿阶段物品。
7. 保存后再次打开，维度和物品配置都能恢复。
8. 阶段详情页能按显式维度渲染；旧数据仍能回退显示。
