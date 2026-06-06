# 购物模块弹窗与物件收集实现计划

## Summary

本次范围收敛在购物模块的 3 个编辑弹窗：

1. `采购决策` 里的物件编辑弹窗
2. `系统地图` 里的系统编辑弹窗
3. `空间巡检` 里的空间编辑弹窗

当前问题可以归并成两类：

### 1. 弹窗布局和观感不够稳定

- 采购决策的物件编辑弹窗目前是单列长表单，容易整体滚动，视觉也比较散。
- 系统地图 / 空间巡检弹窗字段很少，空间利用率低，和当前购物页其他编辑器不一致。

### 2. 系统 / 空间弹窗没有“收集物件”能力

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

## Core Decision

### 1. 物件归属仍然以物件标签表为唯一真相

系统和空间与物件的关系仍然不单独挂在 system / space 定义上，而是继续沿用：

- `shopping_item_systems`
- `shopping_item_spaces`

也就是说：

- 系统弹窗里的“已选物件” = 当前所有 `systemTags` 包含该系统 ID 的物件
- 空间弹窗里的“已选物件” = 当前所有 `spaceTags` 包含该空间 ID 的物件

### 2. 系统 / 空间收集改成后端批量重绑

不采用“前端逐个 updateItem”的方式，而是补两个后端命令：

- `assign_system_definition_items(systemId, itemIds)`
- `assign_space_definition_items(spaceId, itemIds)`

后端行为：

1. 删除该系统 / 空间在关联表中的旧关系
2. 按前端传入的 `itemIds` 重新插入
3. 不改动物件的其他字段

这样职责更清楚，也避免系统 / 空间弹窗为了改归属去提交整条物件表单。

## Frontend Plan

## 1. 新增可复用物件穿梭框

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

## 2. 优化采购决策物件编辑弹窗

物件编辑弹窗改成双栏固定布局：

- 左栏：基础信息、子级、备注
- 右栏：系统标签、空间标签、采购属性、价格参考、渠道

要求：

1. 弹窗本体 `overflow-hidden`
2. 标题 sticky
3. 底部按钮 sticky
4. 左右栏各自滚动，尽量避免整窗滚动
5. 适当放宽宽度，减少纵向挤压

## 3. 优化系统编辑弹窗

系统编辑弹窗改成双栏：

- 左栏：ID、名称、概述、关键问题、二级分组
- 右栏：物件收集穿梭框

保存逻辑：

1. 先创建 / 更新系统定义
2. 再调用 `assign_system_definition_items(systemId, itemIds)`

其中：

- 新建时使用用户输入的系统 ID
- 编辑时使用原系统 ID

## 4. 优化空间编辑弹窗

空间编辑弹窗改成双栏：

- 左栏：空间名称
- 右栏：物件收集穿梭框

保存逻辑：

1. 新建时先 `createSpaceDefinition`
2. 用返回的 `space.id` 调用 `assign_space_definition_items(spaceId, itemIds)`
3. 编辑时先 `updateSpaceDefinition`
4. 再调用 `assign_space_definition_items(existingSpaceId, itemIds)`

## Backend Plan

### 1. 新增系统物件批量归属命令

新增命令：

```rust
assign_system_definition_items(system_id: String, item_ids: Vec<String>)
```

repository 逻辑：

1. `DELETE FROM shopping_item_systems WHERE system_id = ?`
2. 遍历 `item_ids`
3. 重新插入 `(item_id, system_id, sort_order)`

### 2. 新增空间物件批量归属命令

新增命令：

```rust
assign_space_definition_items(space_id: String, item_ids: Vec<String>)
```

repository 逻辑：

1. `DELETE FROM shopping_item_spaces WHERE space_id = ?`
2. 遍历 `item_ids`
3. 重新插入 `(item_id, space_id, sort_order)`

### 3. Typescript 绑定与前端 API 同步

需要同步更新：

- `src-tauri/src/shopping/commands.rs`
- `src-tauri/src/shopping/repository.rs`
- `src-tauri/src/lib.rs`
- `src/bindings.ts`
- `src/features/bettertolive/api/shopping-crud-api.ts`

本次不需要新增表，也不需要改 schema。

## Implementation Order

1. 生成本计划文档
2. 实现后端批量归属命令
3. 接入前端 API
4. 重写物件穿梭框
5. 重构系统编辑弹窗
6. 重构空间编辑弹窗
7. 重构采购决策物件编辑弹窗
8. 静态通读相关文件，确保相同模块下无遗留旧逻辑

## Done Criteria

以下条件都满足才算完成：

1. 本地存在可直接用于开发的实现计划 md
2. 采购决策物件编辑弹窗明显更紧凑，尽量不依赖整窗滚动
3. 系统编辑弹窗可以收集物件
4. 空间编辑弹窗可以收集物件
5. 系统 / 空间收集物件时不再按已购 / 待购拆栏
6. 系统 / 空间收集能力有对应后端命令闭环
7. 不运行测试、不启动本地，只完成代码实现和静态自检
