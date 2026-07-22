# 购物设计原型 → 项目兼容方案

> 原型来源：`docs/modules/shopping/design/`（Open Design 导出的 7 个 HTML + 1 个 UX 简报）
> 现有闭环：`src-tauri/src/shopping/`（后端）· `src/features/bettertolive/shopping/`（前端）
> 目标：**取其精华，去其糟粕**——数据/逻辑闭环已成熟，设计进来应当是「增量补强」，而非重建。

---

## 1. 一句话结论

原型 90% 的内容（场景 / 阶段 / 空间 / 物品）**已经在项目里用结构化数据实现了**——设计只是给它们换了个壳、加了条导航流。真正值得搬进来的**唯一实质新能力是「冷静室（Cooldown）」**：一个"想买先放几天、到期再决定"的等待层。其余是视觉语言与导航编排的借鉴，数据模型一律不动。

---

## 2. 设计概念 ↔ 现有闭环 对照

| 设计概念 | 设计里的形态 | 项目现有实现 | 差距 |
|----------|--------------|--------------|------|
| 场景 | 中心辐射气泡图 + 状态（缺一点/有点满/还行/用不到） | `shopping_system_definitions`（Systems Tab） | 状态是 UI 标注，无 schema 字段；可轻量补，但非必需 |
| 阶段 | 物品 × 未来阶段 → 硬编码白话结论 | `shopping_stage_templates`（Stages Tab，含 low/base/up 分层 + 物品关联） | 已实现且更结构化；设计里的"对照文本"是 mock，应丢弃 |
| 空间 | 列表 + 松/满/挤 标签 | `shopping_space_definitions`（Spaces Tab） | 仅有 name/note；"容量状态"是手动评估，可选补 |
| 物品 | 想买 / 已有 / 冷静中 | `shopping_items` + `status` 语义键 `wanted`/`owned` | 缺"冷静中"这一中间态（见 §4） |
| 冷静室 | 倒计时列表 + 还想要/再放几天/算了 | **无** | 真正的新增能力（§4 详述） |
| 决策流 | 场景→阶段→冷静→空间 的串联导航 | 现有各 Tab 并列，无显式串联 | 仅需在 UI 层编排，无需数据改动 |
| 不量化哲学 | "白话结论、不打分" | 现有概览只用计数（owned/wanted 数量） | 已一致，继续保持 |

---

## 3. 精华（要取）

1. **冷静室（Cooldown）——核心新能力**
   - 想买的东西先进"冷静室"，默认约 72 小时倒计时，可延长。
   - 三条出口：`还想要`（转为正式"想买"）／`再放几天`（重置/延长倒计时）／`算了`（正常结果，非失败）。
   - 全局角标显示"冷静中 N 件"。
   - 这是原型里**唯一项目没有、且符合"购物让生活更美好"理念**的能力，必须落地。

2. **决策流导航编排**
   - 把现有的 场景 / 阶段 / 空间 / 物品 用 `场景 → 阶段 → 冷静 → 空间` 的线索串起来（即原型 `index.html` / `decision-flow.html` 的逻辑）。
   - 实现方式：在购物页加一个轻量"走查/决策流"入口（复用现有 Tab 数据，不新建数据）。

3. **白话、不量化**
   - 维持现状：概览只给计数和分类脉冲，**不引入**生活分、负荷指数、必要性格等（与现有 `overview` 一致，也符合 `README` 的"不做"清单）。

4. **视觉/壳层语言**
   - 原型用的 `100dvh` 侧栏 + 主区分栏、OKLCH 配色、`tab + detail` 双栏布局，与项目 Tailwind/OKLCH 规范一致，可直接借鉴到购物页布局微调。

---

## 4. 糟粕（要弃）

1. **`future-me.html` 的硬编码对照文本**
   - 设计用 `data[item][stage]` 写死"人体工学椅 + 合住 = 占地方"这类结论。这是 mock 数据的糟粕。
   - 项目已有结构化的 `stage_templates` + `stage_item_tiers`，结论应由用户维护的分层数据驱动，**不要用硬编码文本替换结构化模型**。

2. **HTML 原型里的 mock 数据与交互 JS**
   - `toast()`、`setInterval` 倒计时、`items.unshift(...)` 等都是一次性演示脚本，不能进生产代码。冷静室的倒计时应由真实时间戳（`release_at`）在渲染层计算，而非本地计时器。

3. **径向气泡图 / 一次性 viz**
   - `gap-map.html` 的中心辐射气泡是探索性视觉，可作为场景 Tab 的"锦上添花"，但不应作为主交互；保留现有系统列表/卡片即可。

4. **重建数据模型的冲动**
   - 设计里"场景状态/空间容量"等若要做，应是**现有表上的可选属性或前端派生**，不是新开一套 entity。避免 schema 膨胀。

---

## 5. 兼容方案（具体落点）

### 5.1 数据层（后端，增量）

新增一张独立表，作为 wanted 物品的"等待调度层"，**不改动**现有 `shopping_items` 结构：

```sql
CREATE TABLE shopping_cooldowns (
  id           TEXT PRIMARY KEY,
  item_id      TEXT NOT NULL REFERENCES shopping_items(id) ON DELETE CASCADE,
  entered_at   TEXT NOT NULL,           -- ISO8601
  release_at   TEXT NOT NULL,           -- ISO8601，到期时刻
  extend_count INTEGER NOT NULL DEFAULT 0,
  outcome      TEXT NOT NULL DEFAULT 'pending',  -- pending | kept | released
  note         TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
```

- 兼容策略：冷静室是 **wanted 物品之上的调度层**。进入冷静室 = 物品 `status` 已是 `wanted` 且新增一条 `pending` cooldown 记录；倒计时由 `release_at - now` 渲染层算出。
- 出口映射：
  - `还想要` → 删 cooldown 记录（outcome 标 `kept`），物品保持 `wanted`。
  - `再放几天` → `release_at` 顺延（默认再 +72h），`extend_count + 1`。
  - `算了` → cooldown 标 `released`；物品可归档（`is_archived=1`）或保留为 `wanted` 由用户决定——建议标 `released` 并保留物品，不自动删除，符合"算了是正常结果"。
- 复用现有 DTO 语义键机制：冷静室不引入新 `status` 枚举值，避免污染 `REQUIRED_STATUS_SEMANTICS` 约束。

### 5.2 后端（Rust，增量）

- `models.rs`：加 `CooldownRow`。
- `dto.rs`：加 `ShoppingCooldownDto { id, itemId, itemName, enteredAt, releaseAt, extendCount, outcome, note }`，并扩展 `ShoppingOverviewDto` 增 `cooldown_count`（复用 `build_shopping_overview` 已在后端聚合的惯例）。
- `repository.rs`：加 `list_cooldowns`、`create_cooldown`、`extend_cooldown`、`resolve_cooldown(outcome)`。沿用现有 `params!` / 乐观锁风格。
- `commands.rs`：暴露 IPC 命令，挂到 `ShoppingModuleDto` 或独立 query。
- `db.rs`：在 migration 中建表（遵循现有 migration 写法，单一事实来源在 Rust）。

### 5.3 前端（React，增量）

- 位置：`src/features/bettertolive/shopping/`
- 新增 `components/cooldown/`（参考现有 `components/{systems,stages,spaces,planning}/` 的 Tab 结构）：
  - `shopping-cooldown-tab.tsx`：列表 + 每条倒计时（`releaseAt` 派生剩余时间，用 `setInterval` 仅做显示刷新，不改数据）。
  - 出口操作走现有 `shopping-crud-api.ts` 的 TanStack Query mutation。
- 复用：物品名/状态直接读现有 `ShoppingItemDto`；不新建类型系统（现有 `workspace.ts` + `bindings.ts` 已覆盖）。
- 导航：在 `shopping-page.tsx` 的 Tab 栏加"冷静室"入口；"决策流/走查"作为复用现有数据的轻量视图，不必独立成模块。
- 角标：`shopping-page.tsx` 顶部显示"冷静中 N"，N 来自 overview 的 `cooldown_count`。

### 5.4 与现有哲学的衔接

- 冷静室天然处于 `wanted` 态之上，不引入评分、不引入新量化维度。
- 现有 `Overview` 的 `wanted_items` 计数与冷静室不冲突：冷静中的物品仍是 wanted，仅多一层等待标记。

---

## 6. 不在范围内（避免过度设计）

- 不为"场景状态/空间容量"新增 schema 字段——除非后续确有数据驱动需求，先用前端静态标注或现有 note 字段承载。
- 不把 `future-me.html` 的对照文本表搬进代码。
- 不重建购物页壳层（现有 `shopping-page.tsx` 已是 tab + 分栏，只需微调对齐 OKLCH 视觉）。

---

## 7. 建议实施顺序

1. **后端建表 + migration**（`shopping_cooldowns`）。
2. **后端 repository/commands/dto** 增量 + overview `cooldown_count`。
3. **前端 Cooldown Tab**（列表 + 倒计时 + 三出口）。
4. **角标 + 导航编排**（冷静中 N、决策流入口）。
5. 回归：确认现有 Systems/Stages/Spaces/Planning/Overview 行为不变（增量不影响既有闭环）。

---

## 附：原型文件索引（已存于 `design/`）

| 文件 | 对应 | 处置 |
|------|------|------|
| `index.html` | 入口/四入口总览 | 视觉借鉴 |
| `shopping-life-structure.html` | 工作台（统一壳 + 全部视图） | 壳层/导航借鉴 |
| `shopping-gap-map.html` | 场景 | 状态标注可参考，气泡图不搬 |
| `shopping-future-me.html` | 阶段对照 | 仅借鉴交互，**丢弃硬编码文本** |
| `shopping-cooldown.html` | 冷静室 | **核心落地对象** |
| `shopping-burden.html` | 空间 | 容量标签可参考 |
| `shopping-decision-flow.html` | 决策流 | 导航编排借鉴 |
| `shopping-ux-design-brief.md` | 设计说明 | 理念对齐 |
