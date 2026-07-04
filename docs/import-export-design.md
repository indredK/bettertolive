# 数据导入/导出功能设计

## 1. 概述

为用户提供完整的**数据自主权**——所有用户数据（15 个模块 + 购物 SQLite）均可一键导出为单个文件，并可从该文件恢复/合并数据。后端无需硬编码大量种子数据，只需基本的结构支撑，用户可自行导入完整数据进行初始化。

### 核心原则

- **导出 = 完整快照**：包含全部模块的当前数据
- **导入 = 两种模式**：**覆盖 (overwrite)** 或 **合并 (merge)**
- **用户可控**：导入前明确确认，避免误操作
- **文件格式**：单文件 `.bettertolive` (实际为 JSON)，方便备份和传输

---

## 2. 导出文件格式

```typescript
// ExportData 是整个导出文件的顶层结构
type ExportData = {
  /** 格式版本号，用于向前兼容 */
  version: 1
  /** 导出时间 (ISO 8601) */
  exportedAt: string
  /** 应用版本 */
  appVersion: string
  /** 元数据 —— 用户可自定义备注 */
  metadata?: {
    description?: string
    tags?: string[]
  }
  /** 核心数据 */
  data: WorkspaceSnapshot & {
    /** worldhistory 不在 WorkspaceSnapshot 中，单独包含 */
    worldHistory: WorldHistoryModuleData
  }
}
```

**为什么不直接存 `WorkspaceSnapshot`？**
- 需要 `version` 字段支持未来 schema 迁移
- `exportedAt` / `appVersion` 提供审计信息
- `metadata` 允许用户加备注
- `WorkspaceSnapshot` 不含 `worldHistory`，需额外包含

### 文件扩展名

- 推荐 `.bettertolive`（本质是 JSON，但自定义扩展名避免混淆）
- 导出时默认文件名：`BetterToLive-backup-2026-07-04.bettertolive`

---

## 3. 导出流程

### 3.1 前端逻辑

```
用户点击 "导出全部" → Tauri 文件保存对话框
  → 用户选择路径
  → 前端收集所有数据:
      1. getWorkspaceSnapshot() → 14 个模块
      2. getWorldHistory() → worldhistory 模块
  → 组装 ExportData
  → 通过 Tauri fs.writeTextFile() 写入
  → toast 成功/失败提示
```

### 3.2 数据收集路径

| 模块 | API 方法 | 来源 |
|------|----------|------|
| overview | `getOverview()` | JSON 文件 |
| reflection | `getReflection()` | JSON 文件 |
| events | `getEvents()` | JSON 文件 |
| finance | `getFinance()` | JSON 文件 |
| nutrition | `getNutrition()` | JSON 文件 |
| emotion | `getEmotion()` | JSON 文件 |
| beliefs | `getBeliefs()` | JSON 文件 |
| principles | `getPrinciples()` | JSON 文件 |
| relationships | `getRelationships()` | JSON 文件 |
| growth | `getGrowth()` | JSON 文件 |
| memory | `getMemory()` | JSON 文件 |
| legacy | `getLegacy()` | JSON 文件 |
| socioeconomics | `getSocioeconomics()` | JSON 文件 |
| future | `getFuture()` | JSON 文件 |
| shopping | `getShopping()` | SQLite (通过 Rust 聚合) |
| worldHistory | `getWorldHistory()` | JSON 文件 |

### 3.3 无需新增 Rust 导出命令

所有数据已有前端可调用的 getter 方法，前端组合即可。这保持了 "Rust 只负责存储和基础 CRUD" 的架构原则。

---

## 4. 导入流程

### 4.1 前端逻辑

```
用户点击 "导入" → Tauri 文件打开对话框
  → 用户选择 .bettertolive 文件
  → 前端读取文件内容
  → 校验格式 (version, data 字段等)
  → 让用户选择导入模式: "覆盖" / "合并"
  → 二次确认对话框 (说明影响)
  → 执行导入:
      覆盖模式: 逐个模块 save (清空后写入)
      合并模式: 逐个模块 get + merge + save
  → 刷新所有 React Query 缓存
  → toast 成功/部分失败提示
```

### 4.2 两种导入模式

#### 覆盖 (Overwrite)

直接用导入数据替换当前所有数据。适合：
- 全新初始化（跳过种子数据，直接加载用户自己的完整数据）
- 从备份完整恢复
- 切换到另一套数据集

**处理方式**：对每个模块直接调用 `save_*` 传入导入的数据。

#### 合并 (Merge)

将导入数据与现有数据合并，适合：
- 从另一设备导入部分补充数据
- 想保留当前数据的同时添加新条目

**合并策略（按模块类型）**：

| 数据类型 | 合并策略 |
|----------|---------|
| 列表型 (entries, items, records 等) | 按 `id` 去重合并：导入项 id 已存在则忽略（保留现有），不存在则追加 |
| 单对象型 (profile, blueprint 等) | 递归合并对象字段（导入字段覆盖现有字段） |
| 关系/连接 (relations, connections) | 按 id 去重合并 |
| 概览统计 (overview) | 忽略导入的 overview（由系统重新计算），或按规则合并 |

**具体合并逻辑** (伪代码):

```
function mergeModuleData<T>(existing: T, imported: T, strategy: MergeStrategy): T
  - strategy = "replace": return imported (覆盖模式)
  - strategy = "mergeById": 
      if both are arrays: 按 id 合并, 导入项 id 不存在于现有则追加
      if both are objects: 递归 merge
  - strategy = "replaceArray": return imported (完全替换数组)
```

各模块合并策略表：

| 模块 | 策略 | 说明 |
|------|------|------|
| overview | `replace` | 概览统计由系统重新生成 |
| reflection | `mergeById` | entries 按 id 合并 |
| events | `mergeById` | entries 按 id 合并 |
| finance | `mergeById` | transactions, targets, rules 按 id 合并 |
| nutrition | `mergeById` | 各子列表分别按 id 合并 |
| emotion | `mergeById` | 各子列表按 id 合并 |
| beliefs | `mergeById` | entries, relations 按 id 合并 |
| principles | `mergeById` | entries, relations 按 id 合并 |
| relationships | `mergeById` | circles, persons, patterns 等按 id 合并 |
| growth | `mergeById` | nodes 按 id 合并 |
| memory | `mergeById` | entries, anchors 按 id 合并 |
| legacy | `mergeById` | items 按 id 合并 |
| socioeconomics | `mergeById` | entries, gaps 按 id 合并 |
| future | `replace` | 蓝图是整体替换概念 |
| worldHistory | `mergeById` | civilizations, nodes, links 按 id 合并 |
| shopping | `mergeById` | 各子列表按 id 合并（特殊处理见 6.2） |

### 4.3 导入中的购物模块特殊处理

购物模块数据存储在 SQLite 中，现有 API 只有**粒度 CRUD** 没有批量 save。

需要新增 Rust 命令 `import_shopping` 来处理大型导入：

```rust
#[tauri::command]
#[specta::specta]
fn import_shopping(
    state: State<AppState>,
    data: ShoppingModuleData,
    mode: ImportMode, // "overwrite" | "merge"
) -> Result<(), String>
```

**覆盖模式**：
```
BEGIN TRANSACTION;
DELETE FROM shopping_items;
DELETE FROM shopping_system_definitions;
DELETE FROM shopping_space_definitions;
DELETE FROM shopping_attribute_definitions;
DELETE FROM shopping_stage_templates;
DELETE FROM shopping_page_contents;
DELETE FROM shopping_item_system_tags;
DELETE FROM shopping_item_space_tags;
// ... 其他关联表
// 重新插入导入的全部数据
COMMIT;
```

**合并模式**：
```
BEGIN TRANSACTION;
// 对每个表: INSERT OR IGNORE (按 id 去重)
// shopping_items: 导入项 id 不存在则 insert
// shopping_system_definitions: 同上
// ...
COMMIT;
```

### 4.4 导入确认流程

1. 用户选择文件后，前端解析并显示摘要：
   - 文件版本、导出时间
   - 各模块数据量（如 "日记: 23 条, 财务: 45 笔, ..."）
   - 当前数据量对比
2. 用户选择导入模式
3. 弹窗二次确认（覆盖模式额外强调 "所有现有数据将被替换"）
4. 执行导入

---

## 5. Rust 后端新增/修改

### 5.1 新增 Tauri 命令

| 命令 | 说明 | 所属模块 |
|------|------|---------|
| `import_shopping(data, mode)` | 批量导入购物模块 | `shopping/commands.rs` |
| `import_legacy(data, mode)` | 批量导入 legacy（也在 SQLite 中） | `legacy/commands.rs` |

### 5.2 命令行签名

```rust
#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum ImportMode {
    Overwrite,
    Merge,
}
```

**为什么 legacy 也需要单独命令？**
检查代码发现 `legacy` 模块也使用 SQLite（见 `src-tauri/src/legacy/db.rs`），与 shopping 共用数据库，所以同样需要批量操作。

### 5.3 修改 `lib.rs`：注册新命令

```rust
// 在 specta_builder() 和 invoke_handler 中注册:
import_shopping,
import_legacy,
```

### 5.4 非 SQLite 模块无需新 Rust 命令

JSON 模块的导入完全由前端通过已有 `save_*` 命令完成，不需要额外 Rust 代码。

---

## 6. 前端改动清单

### 6.1 API 层 (`bettertolive-api.ts`)

在 `BetterToLiveApi` 接口中新增：

```typescript
export type BetterToLiveApi = {
  // ... 现有方法

  // 新增：
  exportAllData: () => Promise<ExportData>
  importAllData: (data: ExportData, mode: ImportMode) => Promise<void>
}
```

**`exportAllData`**：前端组合逻辑，收集所有模块数据。

**`importAllData`**：逐个模块处理，对 JSON 模块直接 `save_*`，对 SQLite 模块调用 Rust 命令。

### 6.2 Mock API 实现

`MockBetterToLiveApi` 中实现 `exportAllData` 和 `importAllData`，操作内存中的数据副本，方便开发测试。

### 6.3 新文件结构

```
src/features/bettertolive/
  ├── api/import-export/
  │   ├── types.ts           # ExportData, ImportMode 类型
  │   ├── export-utils.ts    # 数据收集 + 组装逻辑
  │   ├── import-utils.ts    # 校验 + 合并逻辑
  │   └── merge-strategies.ts # 各模块合并策略
  └── ui/shell/
      ├── settings-dialog.tsx  # 修改：新增 "数据" 标签页
      └── data-tab.tsx         # 新增：导入/导出 UI
```

### 6.4 UI 设计

在设置对话框新增第三个标签页 **"数据"**，包含：

```
┌─────────────────────────────────┐
│  关于  │  偏好设置  │ 📦 数据  │
├─────────────────────────────────┤
│                                 │
│  ┌─ 导出 ────────────────────┐  │
│  │  将所有数据导出为备份文件    │  │
│  │  [📥 导出全部数据]          │  │
│  │  上次导出: 从未            │  │
│  └────────────────────────────┘  │
│                                 │
│  ┌─ 导入 ────────────────────┐  │
│  │  从备份文件恢复数据         │  │
│  │  [📂 选择文件]  <文件名>    │  │
│  │                           │  │
│  │  导入方式:                  │  │
│  │  ○ 覆盖 (替换所有数据)      │  │
│  │  ○ 合并 (保留现有+添加新)   │  │
│  │                           │  │
│  │  [⚠️ 导入]                 │  │
│  └────────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### 6.5 i18n 新增 key

**`en/shell.json`**:
```json
{
  "settings": {
    "tabs": {
      "about": "About",
      "preferences": "Preferences",
      "data": "Data"
    },
    "data": {
      "export": {
        "title": "Export",
        "description": "Export all your data as a backup file",
        "button": "Export All Data",
        "lastExport": "Last export: never",
        "lastExportAt": "Last export: {{time}}",
        "success": "Data exported successfully",
        "error": "Failed to export data"
      },
      "import": {
        "title": "Import",
        "description": "Restore data from a backup file",
        "selectFile": "Select File",
        "fileSelected": "File selected: {{name}}",
        "mode": {
          "label": "Import Mode",
          "overwrite": "Overwrite (replace all data)",
          "overwriteDesc": "All current data will be replaced with imported data",
          "merge": "Merge (keep existing + add new)",
          "mergeDesc": "Imported items will be added, existing items with same ID will be kept"
        },
        "button": "Import",
        "confirmTitle": "Confirm Import",
        "confirmOverwrite": "This will replace ALL your current data. This cannot be undone. Are you sure?",
        "confirmMerge": "Import will merge data with your existing data. Continue?",
        "success": "Data imported successfully",
        "error": "Failed to import data",
        "invalidFormat": "Invalid file format"
      }
    }
  }
}
```

**`zh/shell.json`**: 对应中文翻译。

### 6.6 React Query 缓存刷新

导入完成后，需要使所有查询失效以刷新 UI：

```typescript
import { useQueryClient } from "@tanstack/react-query"

const queryClient = useQueryClient()
// 导入成功后:
await queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
```

---

## 7. 向后兼容 (Backward Compatibility)

数据结构一定会随着功能迭代而变化：新增字段、重命名字段、拆分模块等。本系统必须支持**旧版导出文件导入新版应用**，并防止**新版导出文件被旧版应用误导入**。

### 7.1 版本体系

```
ExportData.version (整数)
  ↑
主版本号，与 appVersion 无关，仅反映导出格式本身的变化

规则:
- version 递增且从不复用
- 破坏性变更（增删必要字段、重命名、类型变更）→ version +1
- 仅新增可选字段或纯 additive 变化 → version 可不变（但仍建议 +1 以提供清晰审计）
- 每个 version 对应一组 migration 函数，从 version N 迁移到 N+1
```

### 7.2 版本生命周期

```
导入流程:
  文件 version <  CURRENT_VERSION → 运行 migration 链升级
  文件 version == CURRENT_VERSION → 直接使用
  文件 version >  CURRENT_VERSION → 拒绝导入（提示用户升级应用）

导出流程:
  总是以 CURRENT_VERSION 导出
```

### 7.3 Migration 系统

#### 架构

```
migrations/
  ├── registry.ts          # 版本注册表 + 运行入口
  ├── v1-to-v2.ts          # 示例：从 v1 迁移到 v2
  └── ...
```

```typescript
// registry.ts
type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>

const migrations: Record<number, MigrationFn> = {
  // 1 → 2: 示例迁移
  // 1: (data) => {
  //   // reflection.excerpt 拆为 excerpt + summary
  //   data.reflection?.entries?.forEach((e: any) => {
  //     if (e.summary === undefined) e.summary = e.excerpt
  //   })
  //   return data
  // },
}

const CURRENT_EXPORT_VERSION = 1

export function migrateToCurrent(raw: Record<string, unknown>): Record<string, unknown> {
  let version = (raw.version as number) ?? 1
  let data = raw.data as Record<string, unknown>

  if (version > CURRENT_EXPORT_VERSION) {
    throw new Error(
      `Export file is from a newer version (v${version}). Please update BetterToLive to import this file.`,
    )
  }

  // 按顺序运行所有 migration
  while (version < CURRENT_EXPORT_VERSION) {
    const migrateFn = migrations[version]
    if (migrateFn) {
      data = migrateFn(data)
    }
    version++
  }

  return { ...raw, version: CURRENT_EXPORT_VERSION, data }
}
```

#### Migration 函数契约

```typescript
// 每个 migration 接收并返回 Record<string, unknown> (宽松类型)
// 只保证 key 存在,不保证值的具体结构
// 只做 additive 或 renameshape 操作,不做 destructive 操作

// v1 → v2 示例:
function v1ToV2(data: Record<string, unknown>): Record<string, unknown> {
  const reflection = data.reflection as Record<string, unknown> | undefined
  if (reflection) {
    const entries = reflection.entries as any[] | undefined
    if (entries) {
      for (const entry of entries) {
        // "excerpt" 字段拆分为 "excerpt" + "autoSummary"
        if (entry.autoSummary === undefined && entry.excerpt !== undefined) {
          entry.autoSummary = entry.excerpt
        }
      }
    }
  }
  return data
}
```

### 7.4 宽松解析 (Lenient Parsing)

导入时必须容忍未知字段，不能因为导出文件里有当前版本不认识的字段就报错。

#### Rust 端 (serde)

```rust
// 所有导入相关的结构体必须：
// 1. 不使用 deny_unknown_fields
// 2. 新字段使用 Option<T> 或 #[serde(default)]
// 3. 枚举使用 #[serde(untagged)] 或 #[serde(other)] 兜底

#[derive(Deserialize, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingModuleData {
    pub overview: ShoppingOverview,
    pub system_definitions: Vec<ShoppingSystemDefinition>,
    pub space_definitions: Vec<ShoppingSpaceDefinition>,
    // 新字段必须是 optional，以兼容旧版导入文件
    // #[serde(default)]
    // pub new_feature: Option<NewFeatureData>,
    //
    // 字段可以标记为 #[serde(default)] 使旧版导入文件也能被解析
}
```

**重要规则**：模块的 DTO 结构体应区分**内部存储格式**和**导入解析格式**：
- 内部存储格式（读写 JSON 文件 / SQLite 表）可以严格
- 导入解析格式应**始终宽松**（全字段 `Option` + `default`）

建议：现有 `*ModuleData` 结构体大多已有 `#[serde(default)]`，只需确保新增字段时也遵循此惯例。

#### TypeScript 端 (Zod)

使用 Zod 做**渐进式校验**，而非全量 strict 校验：

```typescript
import { z } from "zod"

// 松散的基础 schema —— 只校验必需的顶级字段，不校验完整结构
const ExportDataSchema = z.object({
  version: z.number().int().positive(),
  exportedAt: z.string().optional(),
  appVersion: z.string().optional(),
  data: z.record(z.unknown()), // 只要求 data 是一个对象，不要求具体字段
})

// 模块级可选校验（用于数据预览，不做导入的硬门槛）
const ModuleSummarySchema = z.object({
  overview: z.any().optional(),
  reflection: z.object({ entries: z.array(z.any()).optional() }).optional(),
  // ...
})

export function validateExportFile(raw: unknown) {
  const parsed = ExportDataSchema.parse(raw)
  // 校验通过后运行 migration
  return migrateToCurrent(parsed as Record<string, unknown>)
}
```

**为什么不用完整 Zod schema 校验？**
- 完整类型可能有上百个嵌套字段，维护成本高
- 未来新增字段会导致校验失败
- 只需要保证"必要字段存在"即可，多余字段忽略

### 7.5 字段标准化 (Normalization)

导入的每个模块数据在写入前，应通过一个**标准化函数**填充默认值：

```typescript
function normalizeFinanceEntry(entry: Record<string, unknown>): FinanceEntry {
  return {
    id: entry.id,
    date: entry.date,
    label: entry.label,
    amount: Number(entry.amount) || 0,
    direction: entry.direction ?? "expense",
    category: entry.category ?? "other",
    note: entry.note ?? "",
    // 可选字段：不存在则用默认值
    account: entry.account ?? undefined,
    lifeSystem: entry.lifeSystem ?? undefined,
    necessity: entry.necessity ?? undefined,
    reviewStatus: entry.reviewStatus ?? undefined,
    linkedModule: entry.linkedModule ?? undefined,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
  }
}
```

每个模块的标准化函数确保：
1. 缺失的必需字段用安全默认值
2. 类型强制转换（如 `amount` 可能存为字符串）
3. 未知字段被剥离（避免污染后端存储）

### 7.6 版本兼容矩阵

| 场景 | 行为 |
|------|------|
| v1 文件 → v1 应用 | 直接导入 |
| v1 文件 → v2 应用 | 运行 v1→v2 migration 后导入 |
| v2 文件 → v1 应用 | **拒绝**，提示升级 |
| v2 文件 → v3 应用 | 运行 v2→v3 migration 后导入 |
| v1 文件 → v10 应用 | 依次运行 v1→v2→v3→...→v10 migration 后导入 |

### 7.7 Rust 侧的导入版本检查

Rust 的 `import_shopping` / `import_legacy` 命令不处理 migration（已由前端完成），但应做**完整性断言**：

```rust
#[tauri::command]
fn import_shopping(
    state: State<AppState>,
    data: ShoppingModuleData,
    mode: ImportMode,
) -> Result<(), String> {
    // 前端在调用前已确保 data 符合当前版本格式
    // Rust 侧只做存储，不做结构迁移
    // serde 的反序列化会自动处理 Option/default 字段
    do_import(&state, data, mode)
}
```

### 7.8 最佳实践：如何新增字段而不破坏兼容性

当未来需要给某个模块新增字段时：

**Rust 端**：
```rust
// 1. 新字段用 Option + #[serde(default)]
#[derive(Deserialize, Serialize)]
pub struct ReflectionEntry {
    pub id: String,
    pub date: String,
    pub title: String,
    pub excerpt: String,
    // 新增：
    #[serde(default)]
    pub ai_summary: Option<String>,
}
```

**TypeScript 端**：
```typescript
// 2. 类型定义中为可选
export type ReflectionEntry = {
  id: string
  date: string
  title: string
  excerpt: string
  // 新增：
  aiSummary?: string
}

// 3. 标准化函数中处理
function normalizeReflectionEntry(entry: Record<string, unknown>): ReflectionEntry {
  return {
    id: String(entry.id ?? ""),
    date: String(entry.date ?? ""),
    title: String(entry.title ?? ""),
    excerpt: String(entry.excerpt ?? ""),
    aiSummary: entry.aiSummary ? String(entry.aiSummary) : undefined,
  }
}
```

**不破坏兼容性的红线**：
- ❌ 不要将已有必填字段改为非必填（会破坏旧版读取）
- ❌ 不要重命名已有字段（需要 migration）
- ❌ 不要改变已有字段的类型（需要 migration）
- ✅ 只新增可选字段
- ✅ 只新增完全新的表/模块
- ✅ 可安全地废弃字段（标记 deprecated，不再使用，但仍保留在序列化中）

### 7.9 测试策略

```typescript
// 1. 创建一个 v1 格式的硬编码 fixture
const v1Fixture = {
  version: 1,
  exportedAt: "2025-01-01T00:00:00Z",
  data: {
    reflection: { entries: [{ id: "1", date: "2025-01-01", title: "Test", excerpt: "..." }] },
    // ... 其他模块的最小数据集
  },
}

// 2. 验证 migration 后数据结构符合当前类型
test("v1 export can be migrated to current version")
test("unknown fields are preserved after migration")
test("missing optional fields get default values")
test("newer version file is rejected with clear error")
test("corrupted file is rejected with clear error")
test("overwrite import clears all existing data")
test("merge import preserves existing data and adds new unique items")
```

### 7.10 与 Rust serde 的配合

Rust 端的 `json_store::read_json_file` 已使用 `serde_json::from_str`（默认忽略未知字段）。确保：

1. 所有导入用 DTO 不使用 `#[serde(deny_unknown_fields)]`
2. 所有新增字段使用 `#[serde(default)]` 或 `Option<T>`
3. SQLite 导入时，新增列使用 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`（已有 schema migration 模式）

这是 Rust 侧无额外工作量的保障——只需遵循已有惯例即可。

---

## 8. 导入确认弹窗

使用现有 Dialog + 数据预览，让用户看到即将发生的变化：

```
┌─── 确认导入 ─────────────────────┐
│                                   │
│  导入模式: 覆盖                    │
│                                   │
│  ┌─ 数据预览 ──────────────────┐  │
│  │  日记:       23 条           │  │
│  │  财务记录:   45 笔           │  │
│  │  购物物品:   12 件           │  │
│  │  ...                         │  │
│  └──────────────────────────────┘  │
│                                   │
│  ⚠️ 此操作将替换所有现有数据，      │
│  不可撤销。是否继续？              │
│                                   │
│        [取消]  [确认导入]          │
└───────────────────────────────────┘
```

---

## 9. 错误处理

### 9.1 导出错误

- 单个模块 getter 失败 → 整体导出失败
- 文件写入失败 → 显示具体错误信息
- 建议：先收集所有数据，再写入文件，避免部分写入

### 9.2 导入错误

- 文件读取失败 → 提示文件无法读取
- 格式校验失败 → 提示文件格式不匹配
- 部分模块导入失败 → 回滚策略：
  - **简单策略**：依次导入各模块，失败则记录日志并继续（不中断已成功的模块）
  - **进阶策略**：对 JSON 模块无回滚（写入即持久化）；对 SQLite 模块可用事务包裹

### 9.3 建议的错误处理行为

```
导入开始...
✅ reflection: 导入成功
✅ events: 导入成功
❌ shopping: 导入失败 (数据库错误)
  → 提示用户部分导入成功，建议重新导入
  → 显示成功/失败模块列表
```

---

## 10. 实现步骤 (建议顺序)

### Phase 1: 基础设施
1. 定义 `ExportData` 类型和 `ImportMode` 枚举
2. 实现 `merge-strategies.ts`（各模块合并逻辑）
3. 实现 `export-utils.ts`（数据收集）
4. 实现 `import-utils.ts`（校验 + 合并 + 分发）

### Phase 2: Rust 后端
5. 在 Rust 中实现 `import_shopping` 命令（批量覆盖/合并购物数据）
6. 在 Rust 中实现 `import_legacy` 命令（批量覆盖/合并 legacy 数据）
7. 注册到 `lib.rs` 的 specta_builder 和 invoke_handler
8. 生成并导出 TypeScript bindings

### Phase 3: API 集成
9. 在 `BetterToLiveApi` 接口中添加 `exportAllData` / `importAllData`
10. 在 `LiveBetterToLiveApi` 中实现
11. 在 `MockBetterToLiveApi` 中实现

### Phase 4: UI
12. 添加 i18n key（中英文）
13. 创建 `DataTab` 组件（导出/导入 UI）
14. 添加到 `SettingsDialog` 作为第三个标签页
15. 实现导出流程（文件保存对话框 + 写入）
16. 实现导入流程（文件打开对话框 + 校验 + 模式选择 + 确认 + 执行）

### Phase 5: 收尾
17. 导入成功后刷新 React Query 缓存
18. 测试覆盖模式
19. 测试合并模式
20. 错误处理完善
21. Mock API 同步更新

---

## 11. 覆盖 vs 合并：用户场景

| 场景 | 推荐模式 |
|------|---------|
| 新设备初始化，想用自己的完整数据 | 覆盖 |
| 从备份恢复（误删数据后） | 覆盖 |
| 在另一台电脑上写了日记，想合并到主力电脑 | 合并 |
| 导出朋友的数据结构做参考，想加到自己现有数据中 | 合并 |
| 完全不信任云端，只用本地文件做全量备份 | 覆盖 |
| 想保留当前数据但补充一些旧数据 | 合并 |

---

## 12. 安全与隐私

- 导出文件包含**所有个人数据**，用户应妥善保管
- 应用不做任何远程传输，纯本地读写
- 导入时**不做**任何数据外发
- 建议：后续可在导出时提供**加密选项**（AES 加密文件内容）
