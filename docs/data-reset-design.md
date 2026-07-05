# 数据重置设计文档

## 1. 目标

重构数据初始化策略，实现以下目标：

- 软件发布时不附带任何"演示数据"，仅保留**最小初始数据**，让用户从空白状态开始使用
- 每个模块的初始数据只保留最基本的结构骨架，足以展示 UI 完整性和功能入口，但无实际内容
- 设置中新增"重置到初始数据"按钮，允许用户随时将所有数据恢复到初始状态
- 重置前强制执行导出保护流程，防止用户误操作丢失数据

## 2. 概念定义

### 2.1 最小初始数据

每个模块的数据仅保留：

| 模块 | 初始数据规则 |
|------|-------------|
| `overview` | greeting 为软件简介文案，dailyPulse 留空数组，recentRecords 留空数组 |
| `reflection` | entries 空数组，draftExample 保留 1 条（展示输入区示例） |
| `events` | entries 空数组 |
| `finance` | entries 空数组，monthlyTargets 空数组，categoryRules 空数组，reviewPrompts 空数组 |
| `shopping` | systemDefinitions 保留 1 条（展示分类标签），spaceDefinitions 保留 1 条，attributeDefinitions 保留默认内置枚举，items 空数组，其余字段空数组/零值 |
| `nutrition` | profile 保留默认空结构，foodCategories 保留 1 条，其余字段空数组 |
| `emotion` | checkIns 空数组，trend 空数组，triggers 空数组，tools 保留 1 条（展示工具列表），overview 保留零值结构，其余字段空数组 |
| `beliefs` | cards 空数组，questions 空数组，entries 空数组，relations 空数组，attachmentReflection 空字符串 |
| `principles` | entries 空数组，boundaries 空数组，relations 空数组，decisionPrompts 空数组 |
| `relationships` | circles 空数组，patterns 空数组，unsentNotes 空数组，connections 空数组 |
| `growth` | growthNodes 空数组，threads 空数组 |
| `memory` | memories 空数组，anchors 空数组，eraSuggestions 空数组，reviewPrompts 空数组 |
| `legacy` | items 空数组，trustBoundaries 空数组，reviewPrompts 空数组 |
| `socioeconomics` | entries 空数组，gaps 空数组，reviewPrompts 空数组 |
| `future` | 保留完整结构但 values 留空，milestones 保留 1 条空里程碑，experiments 空数组（展示蓝图布局） |
| `worldHistory` | civilizations 保留 1 条，causalNodes 空数组，causalLinks 空数组，timelineEvents 空数组，comparisonPresets 空数组 |

原则：
- **数组字段**：展示列表 UI 为空的模块，数组直接为空；需要展示列表交互样式的模块，保留 1 条占位数据
- **对象字段**：保留完整字段结构，所有值设为零值/空
- **引用关系**：SQLite 表中保留 1 条默认字典数据（如 1 个 systemDefinition），items 表为空

### 2.2 Seed 文件定位变化

当前（重构前）：
- 每个 Rust 模块的 `seed.json` 包含大量演示数据
- 文件不存在时自动写入 seed

重构后：
- `seed.json` → 重命名为 `initial.json`，内容替换为最小初始数据
- 首次启动时写入 `initial.json` 内容（与当前行为一致，只是内容变少）
- 重置按钮触发时，同样写入 `initial.json` 内容

## 3. 功能设计：重置到初始数据

### 3.1 位置

设置在 **设置 → 数据 (Data Tab)** 中，在导出/导入下方新增独立区域。

### 3.2 UI 流程

```
[重置到初始数据] 按钮
    │
    ▼
┌─────────────────────────────────────┐
│ 第一次确认弹窗                        │
│                                     │
│ ⚠ 这将清除所有现有数据                 │
│                                     │
│ [导出数据并重置]  [直接重置]  [取消]   │
└─────────────────────────────────────┘
    │              │
    │ 导出流程      │
    │ (复用现有     │
    │  export)     │
    │              ▼
    │       ┌─────────────────────────────┐
    │       │ 第二次警告弹窗                │
    │       │                             │
    │       │ ⚠ 数据将永久丢失              │
    │       │ 此操作不可撤销                 │
    │       │                             │
    │       │ [确认重置]  [返回]            │
    │       └─────────────────────────────┘
    │                     │
    ▼                     ▼
    ┌─────────────────────┘
    ▼
  执行重置:
  1. 清空 SQLite 中 shopping/legacy 表
  2. 覆写所有 JSON 文件为 minimal initial data
  3. 清除 React Query 缓存
  4. 触发页面刷新
```

### 3.3 交互细节

**第一次弹窗**（三选一）：
- **导出数据并重置**：先走导出流程（复用 `collectAllData` + 系统保存对话框），导出成功后自动执行重置
- **直接重置**：关闭当前弹窗，弹出第二次警告
- **取消**：关闭弹窗，不做任何操作

**第二次弹窗**（二选一）：
- **确认重置**：执行重置
- **返回**：回到第一次弹窗

### 3.4 后端接口

新增 Rust Tauri command:

```rust
#[tauri::command]
async fn reset_to_initial_data(state: State<AppState>, ...) -> Result<(), String>
```

逻辑：
1. 清空 SQLite 中所有 shopping/legacy 表数据（保留表结构）
2. 将所有 JSON 文件的写入接口调用为 minimal initial data
3. 触发 `shopping/seed.json` 重新写入 default 字典行（systemDefinitions 保留 1 条等）

或者更简单的方式：为每个模块新增 `reset_module` command，批量调用。

```rust
// 每条 JSON 模块的 reset 逻辑
fn reset_json_module<T: Serialize>(data_path: &Path, initial: &T) -> Result<()> {
    atomic_write_json(data_path, initial)
}

// SQLite 模块的 reset 逻辑
fn reset_sqlite_module(conn: &Connection) -> Result<()> {
    conn.execute_batch("DELETE FROM shopping_items; DELETE FROM shopping_item_children; ...")?;
    // 重新插入默认字典行
}
```

### 3.5 前端调用

在 `BetterToLiveApi` 接口中新增：

```typescript
resetToInitialData: () => Promise<void>
```

前端 `DataTab` 中新增 "重置到初始数据" 区块，调用 `onReset` 回调或直接调用 `api.resetToInitialData()`，然后 `invalidateQueries`。

## 4. 文件变更清单

### 4.1 新增文件

| 文件 | 说明 |
|------|------|
| `src-tauri/src/{module}/initial.json` | 各模块最小初始数据（替换现有 `seed.json`，保留文件名初始功能） |
| `src/features/bettertolive/api/initial/` | 前端侧 minimal initial data 定义（与 empty-workspace-snapshot 类似但结构更精简） |

### 4.2 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src-tauri/src/{module}/commands.rs` | `get_xxx` 首次读取时使用 `initial.json` 替代 `seed.json`；新增 `reset_xxx` command |
| `src-tauri/src/shopping/db.rs` |  `seed_new_tables` 改为写入 minimal dict rows |
| `src-tauri/src/legacy/db.rs` | 同上 |
| `src-tauri/src/lib.rs` | 注册新的 reset command |
| `src/features/bettertolive/api/bettertolive-api.ts` | 新增 `resetToInitialData` 接口定义 |
| `src/features/bettertolive/api/live/live-bettertolive-api.ts` | 实现 Tauri IPC 调用 |
| `src/features/bettertolive/api/mock/mock-bettertolive-api.ts` | Mock 实现（重置为 mock 的初始状态） |
| `src/features/bettertolive/shell/settings-dialog.tsx` | 无需修改（DataTab 为独立组件） |
| `src/features/bettertolive/shell/data-tab.tsx` | 新增重置 UI 区块 |
| `src/features/bettertolive/api/fallback/empty-workspace-snapshot.ts` | 根据初始数据更新空快照定义 |

### 4.3 删除文件

| 文件 | 说明 |
|------|------|
| `src-tauri/src/{module}/seed.json` | 由 `initial.json` 替代 |

## 5. 实施阶段

### Phase 1: 定义最小初始数据
- 创建各模块 `initial.json`，内容精简至最少结构
- 更新前端 `emptyWorkspaceSnapshot` 一致

### Phase 2: 后端重置能力
- 为每个 JSON 模块的 Rust command 添加 reset 逻辑
- 实现 SQLite 模块的 reset（清空 + 写默认字典行）
- 注册统一的 `reset_to_initial_data` command

### Phase 3: 前端重置 UI
- `BetterToLiveApi` 接口新增 reset
- `data-tab.tsx` 新增重置按钮 + 两次确认弹窗 + 导出联动

### Phase 4: Seed 迁移
- 删除旧的 `seed.json`
- 验证首次启动行为正常
- 验证重置后行为正常

## 6. 注意事项

1. **首次启动**：用户首次安装打开，看到的是干净的空白界面+UI结构，不会有任何预设数据
2. **兼容性**：已有用户数据不受影响（初始数据仅在文件不存在时写入）
3. **安全性**：两次确认弹窗 + 导出选项，最大限度防止误操作
4. **可测试性**：mock API 的 reset 实现应同步保持行为一致
