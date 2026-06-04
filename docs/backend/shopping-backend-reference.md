# 购物模块后端开发参考

## 1. 文档目的

这份文档是给后端开发直接参考的。

目标不是讨论产品概念，而是明确这 4 件事：

1. 购物模块后端现在到底要做什么
2. 接口应该返回什么 JSON
3. 数据库先怎么落地最合适
4. 第一版应该按什么顺序开发

## 2. DTO 是什么

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

## 3. 模块定位

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

## 4. 当前前端契约

前端当前 API 入口见：

- [src/features/bettertolive/api/endpoints.ts](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/api/endpoints.ts:1)
- [src/features/bettertolive/api/live/live-bettertolive-api.ts](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/api/live/live-bettertolive-api.ts:1)
- [src/features/bettertolive/models/workspace.ts](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/models/workspace.ts:50)

### 4.1 必须对齐的接口

第一阶段至少要明确这两个接口：

1. `GET /api/bettertolive/shopping`
2. `GET /api/bettertolive/workspace`

其中：

- `GET /shopping` 返回购物模块本身
- `GET /workspace` 返回全局快照，里面包含 `shopping`

### 4.2 最重要的契约

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

## 5. 第一版推荐方案

### 5.1 结论

第一版后端建议直接采用：

- `SQLite`
- 单表存购物模块内容快照
- HTTP 接口按前端当前 DTO 原样返回

### 5.2 为什么这样最合适

因为当前购物模块：

- 读多写少
- 单人使用
- 本地优先
- 以内容展示和聚合为主

这时先拆很多表，只会增加开发量和维护成本，实际收益很小。

## 6. 数据库设计

### 6.1 最小可行表结构

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

### 6.2 字段说明

- `id`: 主键，建议固定 UUID
- `module_key`: 固定写 `shopping`
- `content_json`: 直接存 `ShoppingModuleDto`
- `version`: 内容版本号，后续内容变更时可递增
- `created_at`: 创建时间，ISO 8601 字符串
- `updated_at`: 更新时间，ISO 8601 字符串

### 6.3 推荐初始化数据

第一版直接把当前 mock 数据作为 seed 导入：

- [src/features/bettertolive/api/mock/data/shopping/shopping.mock.ts](/Users/apple/Documents/github/bettertolive/src/features/bettertolive/api/mock/data/shopping/shopping.mock.ts:1)

推荐初始化约定：

- `module_key = "shopping"`
- `content_json = shoppingMockData`
- `version = 1`

## 7. DTO 契约

这一节是后端必须严格对齐的 JSON 结构。

### 7.1 枚举值

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

### 7.2 DTO 定义

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

## 8. DTO 规则

### 8.1 必须始终返回数组

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

### 8.2 `depreciation` 是可选字段

这个字段可以缺省。

建议规则：

- `lifecycle = "耐用品"` 或 `"工具"` 时，可以填写
- `lifecycle = "消耗品"` 或 `"情感物"` 时，通常省略

### 8.3 价格字段规则

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

### 8.4 `id` 必须稳定

不要每次请求都重新生成 `id`。

因为前端很多地方会把这些 `id` 当作：

- React key
- 详情选择标识
- 视图切换定位依据

## 9. 接口设计

### 9.1 必做接口

#### `GET /api/bettertolive/shopping`

作用：

- 返回购物模块完整内容

响应：

- `200 OK`
- body 直接为 `ShoppingModuleDto`

#### 示例

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

### 9.2 第二阶段接口

#### `GET /api/bettertolive/workspace`

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

## 10. 推荐实现流程

### 第一步：建表

先创建 `shopping_module_content`。

### 第二步：导入 seed

把当前 `shopping.mock.ts` 内容转成 JSON，写入 `content_json`。

### 第三步：写 repository

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

### 第四步：写 service

service 层先不要加太多业务。

第一版只做：

- 读取内容
- 做结构兜底
- 返回 DTO

### 第五步：写 controller / route

把 service 的返回值原样响应到：

- `GET /api/bettertolive/shopping`

### 第六步：做最小校验

至少校验：

- 顶层 8 个数组字段都存在
- `purchaseLanes[].items` 是数组
- `stageChecklists[].sections` 是数组
- `ownedItems[].spaces` / `stages` 是数组
- `purchaseLanes[].items[].tags` / `keywords` 是数组

## 11. 推荐校验策略

如果你要加运行时校验，建议在后端用一套 schema 工具把 DTO 校住。

例如：

- `zod`
- `valibot`
- `typebox`

原则是：

- 先在后端校验数据库里的 JSON
- 校验通过后再返回给前端

这样后面你哪天手改了一次 seed，也不会把页面 quietly 弄坏。

## 12. 不建议第一版做的事

这些先别做，容易把开发量拉爆：

- 一开始就把购物模块拆成十几张表
- 一开始就做完整增删改后台
- 一开始就引入复杂的筛选查询接口
- 一开始就把中文枚举改成英文 code + label 双轨体系
- 一开始就把价格单位改成分

## 13. 第一版完成标准

满足下面这几条，就算第一版后端对购物模块已经能用了：

1. SQLite 表已创建
2. seed 数据已落库
3. `GET /api/bettertolive/shopping` 可返回合法 JSON
4. 返回结构与 `ShoppingModuleDto` 一致
5. 前端切到 live 后，购物页至少能正常渲染

## 14. 后续升级路线

等未来真的出现稳定编辑需求，再考虑拆表：

### 阶段 A：当前

- 单表 JSON 快照

### 阶段 B：轻度编辑

可先拆出：

- `shopping_systems`
- `shopping_owned_items`
- `shopping_purchase_lanes`

但 `stageChecklists`、`spotlights`、`lifestyleCollections` 仍可先保留 JSON。

### 阶段 C：重度编辑

只有当购物模块真的变成高频编辑系统时，再考虑把：

- `spaces`
- `stages`
- `tags`
- `keywords`

进一步拆成关系表。
