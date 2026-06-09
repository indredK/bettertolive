# 关系图谱 2D/3D 中心视图推进文档

## 目标

把关系模块的“关系图谱”推进成真实的人物关系网络：

- 保留原来的 3D 图谱。
- 新增 Cytoscape.js 2D 图谱。
- 在关系图谱里支持 `2D / 3D` 切换。
- 任意人物节点都可以进入“以 Ta 为中心”的中心视图。
- 2D 和 3D 在中心视图下都展示同心环 / 层级关系。
- 节点选中后可以取消焦点。
- 节点详情里可以直接进入“编辑人物关系”。
- 人物编辑弹窗里可以建立当前人物和其他人物的多组自由互相关系。
- 旧数据没有 `connections` 时不崩。
- 删除人物后不能残留悬空连接边。

## 关键决策

1. 原 3D 不移除，只增强。
2. 公共组件按“依赖名 + 维度”命名：
   - `Cytoscape2DGraph`
   - `ReactForceGraph3DGraph`
3. 人物之间的关系不使用固定预设枚举，改成自由填写的互相关系行。
4. `RelationshipType` 仍保留，它是人物分类、筛选和统计字段；本次移除的是“人物连接关系预设”，不是人物分类字段。
5. 显式人物关系放在 `RelationshipMap.connections` 顶层，作为单一事实源。
6. `connections` 按无向边保存，同一对人物只有一条主连接，内部允许多组 `roles`。
7. 中心视图优先用显式 `connections` 做 BFS；没有显式连接时允许用圈层 / 模式辅助边兜底。

## 当前已落地代码

### 数据层

文件：

- `src/features/bettertolive/models/workspace.ts`
- `src/features/bettertolive/models/relationship-connections.ts`
- `src/features/bettertolive/api/fallback/empty-relationships-module.ts`
- `src-tauri/src/relationships/seed.json`

已落地：

- `RelationshipMap` 已增加 `connections: RelationshipConnection[]`。
- `RelationshipConnection` 包含：
  - `id`
  - `sourceId`
  - `targetId`
  - `strength`
  - `roles`
  - `note`
- `RelationshipConnectionRole` 支持同一对人物的多组互相关系。
- `normalizeRelationshipsModuleData()` 会给旧数据兜底 `connections: []`。
- `normalizeRelationshipConnections()` 会清理 self-loop、悬空边、空角色和重复边。
- `buildRelationshipConnectionPerspectives()` 负责从当前人物视角展示角色。
- `mergeConnectionsForRelationship()` 负责保存编辑后的连接。
- `removeConnectionsForRelationship()` 负责删除人物时清理连接。

### 编辑层

文件：

- `src/features/bettertolive/ui/relationships/relationship-edit-dialogs.tsx`
- `src/features/bettertolive/ui/relationships/relationships-page-data.ts`

已落地：

- `RelationshipFormState` 已包含稳定 `id` 和 `connections`。
- 新建人物时会提前生成 id，保证未保存前也能编辑连接。
- 编辑弹窗新增“人物之间的关系”区域。
- 每条连接可以选择关联人物、连接强度、连接备注。
- 每条连接内可以新增多行自由互相关系。
- 固定关系预设已移除。
- 新增一行关系时创建空白自定义行。
- 保存时会把当前视角的 `selfRole / otherRole` 转成存储态的 `sourceRole / targetRole`。
- 从对方视角打开时会自动反向显示。

### 图谱层

文件：

- `src/features/bettertolive/ui/relationships/relationships-page.tsx`
- `src/features/bettertolive/ui/shared/cytoscape-2d-graph.tsx`
- `src/features/bettertolive/ui/shared/react-force-graph-3d-graph.tsx`

已落地：

- 关系图谱 tab 支持 `graphMode: "2d" | "3d"`。
- 关系图谱 tab 支持：

```ts
type RelationshipGraphScope =
  | { mode: "global" }
  | { maxDepth: number; mode: "centered"; rootId: string }
```

- 初始没有默认焦点。
- 选中节点不存在时会自动清空选中态。
- 工具栏有“取消焦点”。
- 退出中心视图会清空焦点。
- 2D 图点击同一节点会取消焦点。
- 3D 图点击同一节点会取消焦点。
- 2D / 3D 点击背景会取消焦点。
- 节点详情里有“以 Ta 为中心”。
- 节点详情里有“编辑人物关系”。
- 2D 中心视图使用 `preset` layout + ring positions。
- 3D 中心视图写入 `fixed / fx / fy / fz`，保持同心层级结构。
- 全局视图仍使用原 force / cose 风格。

### 文案层

文件：

- `src/i18n/locales/zh.json`
- `src/i18n/locales/en.json`

已落地 key：

- `relationships.graph.clearFocus`
- `relationships.graph.editConnections`
- `relationships.edit.connectionRolesHint`
- `relationships.edit.connections`
- `relationships.edit.connectionStrength`
- `relationships.edit.addConnectionRole`
- `relationships.enumNames.connectionStrength`

## 关系保存规则

### 当前人物视角

在 A 的编辑弹窗中填：

- 关联人物：B
- 当前人物角色：学生
- 对方角色：老师

保存后存储为 canonical pair：

- `sourceId / targetId` 按 id 排序。
- 如果 A 是 source，则保存 `sourceRole=学生,targetRole=老师`。
- 如果 A 是 target，则保存 `sourceRole=老师,targetRole=学生`。

### 对方人物视角

打开 B 的编辑弹窗时，`buildRelationshipConnectionPerspectives()` 会翻转展示：

- 当前人物角色：老师
- 对方角色：学生

### 多关系行

同一对 A/B 可以保存多行：

- 学生 / 老师
- 朋友 / 朋友
- 支持者 / 被支持者

只要每行 `selfRole` 和 `otherRole` 都非空，就会进入连接。空行、未选择关联人物、自连接都会被忽略。

## 图谱构建规则

### 全局视图

全局视图展示：

- 人物节点。
- 显式 `connections` 边。
- 圈层辅助边。
- 模式辅助边。

边类型通过 `linkKind` 区分：

- `explicit`
- `sameCircle`
- `pattern`
- `mixed`
- `auxiliary`

### 中心视图

进入中心视图时：

1. root 是当前人物。
2. 优先用显式连接 BFS。
3. 如果显式连接无法展开，则用圈层 / 模式辅助边兜底。
4. 默认展开 2 跳。
5. 第 0 层是中心人物。
6. 第 1 层是直接相连人物。
7. 第 2 层是二跳人物。

2D 坐标：

- root: `(0, 0)`
- depth 1: 半径 `220`
- depth 2: 半径 `420`
- depth 3+: 半径递增

3D 坐标：

- x / y 复用 2D ring positions。
- z 根据 depth 做轻微层级：
  - depth 0: `0`
  - depth 1: `28`
  - depth 2: `-28`
  - depth 3+: `42`

## 还需要继续收口的点

这些是继续往下推时的优先检查项：

1. 静态确认 `RELATIONSHIP_CONNECTION_ROLE_PRESETS` 没有残留引用。
2. 静态确认 `RelationshipsGraphTab` 不再接收关系图谱用不到的 `isControlMode` 和 `relationships` props。
3. 静态确认图谱没有默认选中第一个节点，也不会在中心视图强制回到 root 焦点。
4. 静态确认 2D / 3D 都支持点击同一节点取消焦点。
5. 静态确认 2D / 3D 都支持点击背景取消焦点。
6. 静态确认 i18n key 在中英文都存在。
7. 静态确认删除人物会调用 `removeConnectionsForRelationship()`。
8. 静态确认旧数据入口会调用 `normalizeRelationshipsModuleData()`。
9. 静态确认 `relationship-connections.ts` 的 reciprocal 转换方向正确。
10. 静态确认中心视图 2D 使用 `preset`，3D 使用 `fx / fy / fz`。

## 手动验收清单

后续如果允许启动本地服务，可以按下面验收：

1. 打开关系模块的关系图谱。
2. 默认进入 3D，全局图谱存在。
3. 初始右侧详情为空，没有默认焦点。
4. 点击一个人物节点，右侧出现节点详情。
5. 再点击同一个人物节点，右侧详情清空。
6. 点击图谱背景，右侧详情清空。
7. 点击节点后，工具栏出现“取消焦点”。
8. 点击“取消焦点”，右侧详情清空。
9. 切换到 2D，重复 4 到 8。
10. 在节点详情点击“以 Ta 为中心”。
11. 2D 中心视图展示同心环结构。
12. 切到 3D 后仍是同心层级结构，不回到自由散点。
13. 点击“退出中心视图”，回到全局视图并清空焦点。
14. 在节点详情点击“编辑人物关系”。
15. 给 A 新增关联人物 B。
16. 添加两行关系：
    - A: 学生；B: 老师。
    - A: 朋友；B: 朋友。
17. 保存后重新打开 A，关系仍显示为“学生 / 老师”“朋友 / 朋友”。
18. 打开 B，关系显示为“老师 / 学生”“朋友 / 朋友”。
19. 删除 B。
20. 图谱和编辑弹窗里不再出现 B 的悬空连接。

## 可选命令验证

仓库协作约束是：除非明确要求，不主动运行测试、lint、dev server 或浏览器验证。

如果后续明确要跑验证，建议顺序：

```bash
bun run lint
bun run typecheck
```

如果 lint 报错，优先看这些文件：

- `src/features/bettertolive/models/relationship-connections.ts`
- `src/features/bettertolive/ui/relationships/relationship-edit-dialogs.tsx`
- `src/features/bettertolive/ui/relationships/relationships-page.tsx`
- `src/features/bettertolive/ui/shared/cytoscape-2d-graph.tsx`
- `src/features/bettertolive/ui/shared/react-force-graph-3d-graph.tsx`
- `src/i18n/locales/zh.json`
- `src/i18n/locales/en.json`

## 不建议本轮一起做

- 有向边。
- 多中心对比视图。
- 图上拖拽创建关系边。
- 自动从文本推断人物连接。
- 关系边时间线历史。
- 无限跳数展开。
- 删除人物自身的 `RelationshipType` 分类字段。

## 完成口径

这轮需求完成后，应能用下面这句话验收：

> 关系图谱既能全局看，也能以任意人物为中心看；2D 和 3D 都能切换且保留中心环形结构；人物之间的关系可以在编辑人物时自由建立多组互相关系，并且从双方视角自动翻转显示；选中节点后可以随时取消焦点；旧数据和删除人物都不会造成悬空边或页面崩溃。
