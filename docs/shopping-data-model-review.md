# 购物模块审查:现状 vs 目标数据模型

> 目标模型见 [shopping-data-model.md](./shopping-data-model.md)。
> 本文逐项对比现有实现与目标模型的差异,并给出改造启动清单。

---

## 0. 结论先行

**Tab 结构与目标对齐**(都是 5 Tab:总览/采购决策/系统地图/空间巡检/阶段模板),
所以本次重构**不涉及 Tab 重构**,差距集中在 Tab 内的数据模型与编辑逻辑。

| 差异级别 | 项目 |
|---------|------|
| 🔴 **核心结构性** | 物品两层(类→子级)、标签必填多选、阶段 sections 强分组、阶段内视图切换 |
| 🟡 **数据迁移** | `system`(单选 enum) → `systemTags[]`、`spaces`(字符串) → 引用必填、owned/plan 合并为 `status` |
| 🟢 **重新归位** | lifecycle / depreciation / 价格 / 渠道 → 归入物品属性、purchaseLanes → 归入物品 `lane` 字段 |
| ⚪ **概念清理** | `category` 字段删除、`stages` 反向引用删除 |

**所有决策已敲定**(见第 7 章),可以直接进入改造。

代码位置:[src/features/bettertolive/](../src/features/bettertolive/)
- 数据模型:[models/workspace.ts:118-184](../src/features/bettertolive/models/workspace.ts)
- 视图组件:[ui/shopping/](../src/features/bettertolive/ui/shopping/)

---

## 1. Tab 结构对照

| Tab | 现状 | 目标 | 差异 |
|-----|------|------|------|
| 总览 | overview tab | 总览(不动) | ✅ 一致 |
| 采购决策 | 名为"购物规划"(planning-tab)| 采购决策 | ⚠ 仅命名差异 |
| 系统地图 | systems-tab | 系统地图(全量视图)| ✅ 形态一致,group-by 维度升级 |
| 空间巡检 | spaces-tab | 空间巡检(全量视图)| ✅ 形态一致,group-by 维度升级 |
| 阶段模板 | stages-tab | 阶段模板(组合 + 内部视图切换)| 🔴 内部缺视图切换 |

代码:[shopping-page.tsx:449-465](../src/features/bettertolive/ui/shopping/shopping-page.tsx)

**结论**:**顶层 Tab 不需要重构**。

---

## 2. 物品(Item)数据模型差距

### 2.1 物品两层结构(🔴 核心差距)

| 维度 | 现状 | 目标 |
|------|------|------|
| 层级 | **单层**:[ShoppingOwnedItem](../src/features/bettertolive/models/workspace.ts) / `ShoppingPlanItem` 直接是物品 | **两层**:`Item.children: ItemChild[]` |
| 子级表达 | 用 `category: string` 描述类别(决策已定:删除)| 物品是类,`children` 是子级 |

[models/workspace.ts:130-160](../src/features/bettertolive/models/workspace.ts) 现状:
```ts
ShoppingItemBase { system, category, spaces, stages, lifecycle, depreciation? }
ShoppingOwnedItem = Base + { id, name, quantity, status, replacementCue, note }
ShoppingPlanItem  = Base + { id, name, reason, currentPrice, buyBelowPrice, ... }
```

**差距**:缺一层。例如目前"千兆路由器"和"WiFi6 路由器"是两个独立物品,目标里它们应是同一个"路由器"物品的两个 `children`。

### 2.2 物品分裂(🔴 核心差距)

| 维度 | 现状 | 目标 |
|------|------|------|
| 类型分裂 | **二元分裂**:owned vs plan,两套字段 | **统一物品库**,只有一个 `Item` 类型 |
| "已有/待购"区分 | 用 owned/plan 两个类型来分 | 用 `status: "owned" \| "wanted"` 一个下拉 |
| 独有字段处理 | quantity、reason、currentPrice 等各自挂在两个类型上 | **决策已定:合并后改为可选** |

合并后的 `Item` 包含两类字段的并集:
- owned 来:`quantity?`、`replacementCue?`、`note?`
- plan 来:`reason?`、`currentPrice?`、`buyBelowPrice?`、`overpayPrice?`、`keywords?`
- 都改为 `?` 可选

`ShoppingOwnedStatus`(StableUse/ConsiderUpgrade/NeedRestock/MissingParts/NeedComplete)与目标的 `status: owned|wanted` 是不同维度:
- 目标的 `status` 是"已有还是待购"
- 旧的 `ShoppingOwnedStatus` 是"已有物品的健康度"
- 决策建议:旧的 status 字段保留为可选元数据(改名避免冲突),不影响目标 `status: owned|wanted`

### 2.3 标签字段差距(🟡 数据迁移)

| 标签 | 现状 | 目标 | 差距 |
|------|------|------|------|
| 系统标签 | `system: ShoppingSystem`(**单选 enum**) | `systemTags: SystemId[]`(**多选,必填**) | 单→多、enum→数组 |
| 空间标签 | `spaces: string[]`(**字符串数组,可选**) | `spaceTags: SpaceId[]`(**引用必填,多选**) | 字符串→ID 引用,可选→必填 |
| 阶段标签 | `stages: ShoppingStage[]`(物品反向声明阶段) | ❌ 不应存在 | 反向引用,方向错了,删除 |

### 2.4 采购属性字段(🟢 全部归位为物品属性)

| 属性 | 现状 | 目标 | 差距 |
|------|------|------|------|
| `status`(已有/待购) | 用 owned/plan 类型表达 | 物品下拉必选字段 | 🔴 缺,需新增 |
| `lane`(立即/等好价/先不买)| 独立 [ShoppingPurchaseLane](../src/features/bettertolive/models/workspace.ts:162-167) 表,通过 `laneId` 关联 plan 物品 | 物品属性 `lane?: "now"\|"wait"\|"hold"`(待购时可选)| 🟡 从独立表迁移到物品字段 |
| `lifecycle` | 物品上必填 ✅ | 物品上必填 | ✅ 已有,保留 |
| `depreciation` | 物品上可选 ✅ | 物品上可选 | ✅ 已有,保留 |
| 价格参考(`priceRef`)| 独立 [ShoppingPriceReference](../src/features/bettertolive/models/workspace.ts:186-196) 表 | 物品属性 `priceRef` | 🟡 从独立表迁移到物品上 |
| 购买渠道(`channels`)| ❌ 当前无此字段 | 物品属性 `channels?: Channel[]` | 🔴 缺,需新增 |

---

## 3. 阶段模板(StageTemplate)差距

### 3.1 结构差距(🔴 核心)

[models/workspace.ts:169-184](../src/features/bettertolive/models/workspace.ts) 现状:
```ts
ShoppingStageChecklist {
  id, stage, title, description, focus
  sections: ShoppingStageChecklistSection[]
}
ShoppingStageChecklistSection {
  system: ShoppingSystem        // ⚠ 每个 section 绑死一个系统
  minimumItemIds: string[]      // 物品 ID 数组
  essentialItemIds: string[]
  upgradeItemIds: string[]
}
```

```ts
// 目标
StageTemplate {
  id, name
  items: StageItem[]            // 扁平,视图层 group-by
}
StageItem {
  itemId
  tiers: { low, base, up }      // 子级 ID 数组
}
```

| 维度 | 现状 | 目标 | 影响 |
|------|------|------|------|
| 结构 | `sections[]` 按系统分桶 | `items[]` 扁平,视图层 group-by | 阶段数据要重组 |
| 档位存什么 | `string[]`(物品 ID) | `ItemChildId[]`(子级 ID) | 因为目标物品有两层,档位选的是子级 |
| 档位命名 | minimum/essential/upgrade | low/base/up | 语义一致,字段名可改可不改 |
| 一物多分组 | **不支持** | 天然支持(标签多选) | 必须破坏 sections 结构才能实现 |

### 3.2 阶段内视图切换(🔴 核心)

[shopping-stage-edit-dialog.tsx:489-566](../src/features/bettertolive/ui/shopping/shopping-stage-edit-dialog.tsx)
现状的阶段编辑是"系统 × 三档"的二维矩阵,**不存在**"切换到空间视图"的能力。

目标:阶段进入后有 [系统地图视图] [空间巡检视图] 切换按钮,两个视图看同一份 `items[]`,只是 group-by 维度不同。

---

## 4. 各 Tab 现状与目标的差距(逐 Tab)

### 4.1 总览 Tab — ✅ 不动

### 4.2 采购决策 Tab(现"购物规划")

[shopping-planning-tab.tsx](../src/features/bettertolive/ui/shopping/shopping-planning-tab.tsx)

| 维度 | 现状 | 目标 | 差距 |
|------|------|------|------|
| 命名 | "购物规划" | "采购决策" | ⚪ 改名 |
| 数据源 | `purchaseLanes`(三桶) | 物品库,按 `status` 分组,待购下按 `lane` 子分组 | 🟡 lanes 改为物品属性后,Tab 改为两级分组 |
| 编辑入口 | 待购物件可在 lane 内增删 | 物品库 CRUD + 采购属性编辑 | 🔴 承担物品库主维护职责 |
| 已购物品 | owned items 在系统/空间 Tab | 已有物品也归这里(按 status 区分)| 🔴 把 owned 纳入此 Tab |

### 4.3 系统地图 Tab

[shopping-systems-tab.tsx](../src/features/bettertolive/ui/shopping/shopping-systems-tab.tsx)

| 维度 | 现状 | 目标 | 差距 |
|------|------|------|------|
| group-by 维度 | 物品 `system: enum`(单选) | 物品 `systemTags: SystemId[]`(多选) | 🔴 group-by 改为多对多 |
| 显示内容 | owned + planned 分别展示 | 物品库(status 在卡片上展示) | 🟡 显示形态调整 |
| 卡片维护 | SystemDefinition CRUD 已有(缺删除)| 标签字典管理 | ⚪ 保留,补删除能力 |

### 4.4 空间巡检 Tab

[shopping-spaces-tab.tsx](../src/features/bettertolive/ui/shopping/shopping-spaces-tab.tsx)

| 维度 | 现状 | 目标 | 差距 |
|------|------|------|------|
| group-by 维度 | 物品 `spaces: string[]`(字符串可选)| 物品 `spaceTags: SpaceId[]`(必填引用)| 🟡 字符串迁移到 ID 引用 |
| 显示内容 | owned + planned 分别展示 | 物品库 | 🟡 同系统地图 |
| 卡片维护 | 空间卡片 CRUD(缺删除)| 标签字典管理 | ⚪ 保留,补删除能力 |

### 4.5 阶段模板 Tab(🔴 改动最大)

[shopping-stages-tab.tsx](../src/features/bettertolive/ui/shopping/shopping-stages-tab.tsx) +
[shopping-stage-edit-dialog.tsx](../src/features/bettertolive/ui/shopping/shopping-stage-edit-dialog.tsx)

| 维度 | 现状 | 目标 | 差距 |
|------|------|------|------|
| 阶段结构 | `sections[]` 按系统分桶 | `items[]` 扁平 | 🔴 需重写 |
| 档位选择 | 物品 ID 数组 | 子级 ID 数组 | 🔴 依赖物品两层先就绪 |
| 视图切换 | 无,只有"系统×档位"矩阵 | 系统视图 / 空间视图 | 🔴 新增能力 |
| 编辑对话框 | 二维矩阵编辑 | 扁平物品清单 + 每项档位编辑器 | 🔴 重写 |

---

## 5. 概念去留总表

| 单元 | 决策 | 落地方式 |
|------|------|---------|
| `status`(已有/待购) | ✅ 物品必选下拉 | 新增 `Item.status: "owned" \| "wanted"` |
| `lane`(立即/等好价/先不买) | ✅ 物品可选属性(待购时) | 新增 `Item.lane?: "now" \| "wait" \| "hold"`,删除独立 `ShoppingPurchaseLane` 表 |
| `lifecycle` | ✅ 保留为物品属性 | 现已有 |
| `depreciation` | ✅ 保留为物品属性 | 现已有 |
| `priceRef` | ✅ 物品属性 | 从独立表迁移到 `Item.priceRef` |
| `channels` | ✅ 物品属性 | 新增 `Item.channels?: Channel[]` |
| owned 独有字段(quantity 等) | ✅ 合并后改为可选 | 并入统一 `Item`,加 `?` |
| plan 独有字段(reason、currentPrice 等) | ✅ 合并后改为可选 | 并入统一 `Item`,加 `?` |
| `category` | ❌ 删除 | 与"两层结构"语义重复,直接移除 |
| `stages`(反向引用) | ❌ 删除 | 方向相反,阶段持有物品即可 |
| `ShoppingBoundaryEntry` / `ShoppingLifestyleCollection` | ⚪ 总览相关 | 总览不动,保留 |

---

## 6. 改造路径(决策已落)

### 阶段 1:物品库数据模型扩展(底层先动)

修改文件:
- [models/workspace.ts](../src/features/bettertolive/models/workspace.ts)
- [api/shopping-crud-api.ts](../src/features/bettertolive/api/shopping-crud-api.ts)
- [api/bettertolive-api.ts](../src/features/bettertolive/api/bettertolive-api.ts)
- [api/fallback/empty-shopping-module.ts](../src/features/bettertolive/api/fallback/empty-shopping-module.ts)

具体动作:
1. `Item.children: ItemChild[]` 新增(允许空,先兼容旧数据)
2. `system: enum` → `systemTags: enum[]`(单元素数组兼容)
3. `spaces: string[]` → `spaceTags: SpaceId[]`,引用 `ShoppingSpaceDefinition.id`(必填)
4. 新增 `status: "owned" | "wanted"` 必选
5. 新增 `lane?: "now" | "wait" | "hold"` 可选
6. 新增 `channels?: Channel[]` 可选
7. 价格参考从独立 `ShoppingPriceReference` 表合并进 `Item.priceRef`
8. 删除 `stages` 反向引用字段
9. 删除 `category` 字段
10. 标签必填校验(`systemTags.length ≥ 1` 且 `spaceTags.length ≥ 1`)

### 阶段 2:owned/plan 合并为统一 Item

修改文件:同上 + mock 数据
- [api/mock/data/workspace-snapshot.mock.ts](../src/features/bettertolive/api/mock/data/workspace-snapshot.mock.ts)

具体动作:
1. `ShoppingOwnedItem` / `ShoppingPlanItem` 合并为统一的 `Item`
2. owned/plan 各自独有字段并入,**全部改为可选**
3. 已有的 `ShoppingOwnedStatus`(StableUse/ConsiderUpgrade/...)改名(如 `healthStatus?`)避免与目标 `status` 冲突,作为可选元数据
4. mock 数据迁移
5. 接口签名调整(CRUD 不再区分 owned/plan)

### 阶段 3:采购决策 Tab 改造

修改文件:
- [ui/shopping/shopping-planning-tab.tsx](../src/features/bettertolive/ui/shopping/shopping-planning-tab.tsx) → 重命名 + 重构
- [ui/shopping/shopping-item-edit-dialog.tsx](../src/features/bettertolive/ui/shopping/shopping-item-edit-dialog.tsx)
- [ui/shopping/shopping-page.tsx](../src/features/bettertolive/ui/shopping/shopping-page.tsx)(Tab 标题)

具体动作:
1. Tab 改名为"采购决策"
2. 主分组按 `status`(已有/待购),待购下再按 `lane`(立即/等好价/先不买)
3. 承担物品库主维护职责(CRUD)
4. 物品编辑对话框补全 `lane`、`channels`、`priceRef` 字段
5. 已有物品也纳入此 Tab(原来只在系统/空间 Tab 出现)

### 阶段 4:系统地图 / 空间巡检 Tab 适配

修改文件:
- [ui/shopping/shopping-systems-tab.tsx](../src/features/bettertolive/ui/shopping/shopping-systems-tab.tsx)
- [ui/shopping/shopping-spaces-tab.tsx](../src/features/bettertolive/ui/shopping/shopping-spaces-tab.tsx)
- [ui/shopping/shopping-page.tsx](../src/features/bettertolive/ui/shopping/shopping-page.tsx)(group-by 计算)

具体动作:
1. group-by 从 `===` 单值匹配改为 `includes` 数组包含
2. 同一物品因多标签会在多分组下出现,UI 处理重复展示(可加标记说明"也属于 XX")
3. 系统/空间卡片补删除能力(沿用 [shopping-module-review.md](../shopping-module-review.md) 已识别的缺口)
4. 显示形态:owned + planned 改为统一物品(以 `status` 区分)

### 阶段 5:阶段模板 Tab 改造(改动最大)

修改文件:
- [models/workspace.ts](../src/features/bettertolive/models/workspace.ts)(`ShoppingStageChecklist` 重写)
- [ui/shopping/shopping-stages-tab.tsx](../src/features/bettertolive/ui/shopping/shopping-stages-tab.tsx)
- [ui/shopping/shopping-stage-edit-dialog.tsx](../src/features/bettertolive/ui/shopping/shopping-stage-edit-dialog.tsx)

具体动作:
1. `sections[]` 改为 `items[]` 扁平结构
2. 档位存 `ItemChildId[]` 而非物品 ID
3. 阶段编辑对话框重写为"物品清单 + 每项档位编辑器"
4. 阶段详情页新增 [系统视图] [空间视图] 切换
5. 视图共用 group-by 逻辑(与系统地图/空间巡检 Tab 同一套)

---

## 7. 关键决策记录(已敲定)

| # | 问题 | 决策 |
|---|------|------|
| 1 | `purchaseLanes` 去留 | **B**:保留为物品属性 `lane`(待购时可选),与 `status` 是两个独立维度 |
| 2 | owned/plan 独有字段处理 | **合并后改为可选**,作为统一 `Item` 的可选元数据 |
| 3 | `category` 字段 | **删除**,与"两层结构"语义重复 |
| 4 | 标签字典维护入口 | 维持现状(系统/空间 Tab 内),只需补删除能力 |

---

## 8. 准备开始改造 — 第一步建议范围

按改造路径,**阶段 1**是必须先做的,它是后续所有阶段的前置依赖。

**第一个 PR 的建议范围**:阶段 1 完整完成 + 阶段 2 起步。

涉及文件(只动数据层,不动 UI):
- [src/features/bettertolive/models/workspace.ts](../src/features/bettertolive/models/workspace.ts) — 类型定义
- [src/features/bettertolive/api/bettertolive-api.ts](../src/features/bettertolive/api/bettertolive-api.ts) — Form / Row 类型
- [src/features/bettertolive/api/shopping-crud-api.ts](../src/features/bettertolive/api/shopping-crud-api.ts) — CRUD 签名
- [src/features/bettertolive/api/fallback/empty-shopping-module.ts](../src/features/bettertolive/api/fallback/empty-shopping-module.ts) — 默认结构
- [src/features/bettertolive/api/mock/data/workspace-snapshot.mock.ts](../src/features/bettertolive/api/mock/data/workspace-snapshot.mock.ts) — mock 数据
- 后端(`src-tauri/`)同步 schema 与接口(取决于现有后端实现)

**预期影响**:UI 层会出现编译错误(字段重命名 / 新字段未消费),需要做最小兼容,**完整 UI 适配在阶段 3-5 各 Tab 里逐个进行**。

**不在第一个 PR 范围**:
- 阶段模板的 `sections → items` 改造(留到阶段 5)
- 阶段内视图切换(留到阶段 5)
- 系统/空间 Tab 的 group-by 改造(留到阶段 4)

---

## 9. 与旧审查文档的关系

[shopping-module-review.md](../shopping-module-review.md)(根目录,前一次模块审查)
记录的未闭环问题,在本次目标下处理方式:

| 旧问题 | 新模型下的处理 |
|--------|--------------|
| 系统卡片缺删除 | 仍要补(阶段 4 顺带处理) |
| 空间卡片缺删除 | 同上 |
| `purchaseLanes` 定位不清 | 已决策:迁移为物品属性 `lane`,独立表删除 |
| `priceReferences` 露在规划页无维护 | 已决策:迁移为物品属性 `priceRef`,问题消失 |
