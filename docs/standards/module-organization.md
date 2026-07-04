# 业务模块文件组织

> 用途：新增业务模块时，前后端文件按统一约定创建和管理。本文档以 `shopping` 模块为参考标准，提炼出通用模板（`<module>` 为占位符，替换为实际模块名）。
>
> 本文档是 `conventions.md`「目录结构」章节的细化补充——`conventions.md` 定义"前端目录做什么"，本文档定义"每个模块具体放哪些文件、怎么命名、什么分层"。

---

## 一、Rust 后端（`src-tauri/src/<module>/`）

### 文件清单

| 文件 | 职责 | 必要性 |
|---|---|---|
| `mod.rs` | 模块声明（`pub mod commands;` 等）、`register_commands` 函数集中注册所有 Tauri commands | 必须 |
| `commands.rs` | `#[tauri::command]` 函数，对外暴露的接口。负责参数校验后委托给 `repository` 或直接操作数据库 | 必须 |
| `dto.rs` | 数据传输对象（DTO）：请求/响应结构体，带 `#[derive(Serialize, Deserialize, Type)]`，用于跨 IPC 传递 | 推荐 |
| `db.rs` | 数据库连接初始化、建表 migration、种子数据写入、事务工具函数 | 按需 |
| `models.rs` | 数据库行模型（Row struct），直接映射 SQL 查询结果 | 按需 |
| `repository.rs` | 数据访问层，封装 SQL CRUD 操作，将 Row → DTO 转换 | 推荐 |
| `seed.json` | 种子数据（JSON 格式），模块首次启动时写入数据库 | 按需 |

### 分层顺序

```
commands.rs  →  repository.rs  →  models.rs（Row）
     ↓               ↓
   dto.rs          db.rs
```

- `commands.rs` 是前端唯一入口，调用 `repository.rs` 或直接操作数据库
- `repository.rs` 封装 SQL，查询返回 `models.rs` 中的 Row struct，再映射为 `dto.rs` 中的 DTO
- `db.rs` 负责建表、迁移、种子数据，通常在应用启动时一次性调用

### 命名约定

- 模块名使用蛇形命名（`shopping`、`nutrition`），与前端模块名一致
- `commands.rs` 中函数命名：`get_<module>`、`create_<module>_xxx`、`update_<module>_xxx`、`delete_<module>_xxx`
- `dto.rs` 中类型命名：`XxxDto`（输出）、`CreateXxxReq` / `UpdateXxxReq`（输入）
- `models.rs` 中类型命名：`XxxRow`（数据库行）
- `register_commands` 函数在 `mod.rs` 中定义，在 `main.rs` 中调用

### 注意

- `dto.rs` 中的类型若需前端使用，必须同时 derive `serde::Serialize`、`serde::Deserialize` 和 `specta::Type`，运行 `bun run generate:bindings` 后自动同步到 `src/bindings.ts`
- 简单模块可省略 `dto.rs`、`models.rs`、`repository.rs`，逻辑直接放在 `commands.rs` 中
- `db.rs` 使用 `rusqlite`，事务通过 `write_tx` 工具函数统一管理

---

## 二、前端 UI（`src/features/bettertolive/<module>/`）

### 文件清单

| 文件/目录 | 职责 | 必要性 |
|---|---|---|
| `<module>-page.tsx` | 主页面组件，组合各子功能标签页，通过 `<Tabs>` 切换 | 必须 |
| `<module>-page-data.ts` | 页面级数据加载（Query 调用）、状态管理、计算逻辑 | 推荐 |
| `queries.ts` | TanStack Query 的 `useMutation` / `useQuery` 封装，集中管理该模块的缓存读写 | 推荐 |
| `components/` | 子功能目录，每个子功能对应页面中的一个标签页或弹窗 | 按需 |
| `components/<sub>/<module>-<sub>-tab.tsx` | 子功能标签页主要内容组件 | 推荐 |
| `components/<sub>/<module>-<sub>-edit-dialog.tsx` | 子功能的编辑/新建弹窗 | 按需 |
| `components/<sub>/<module>-<sub>-utils.ts` | 子功能专属工具函数、数据转换 | 按需 |

> 跨模块共享的 UI 组件和工具函数统一放 `src/features/bettertolive/shared/`，不留在模块内。参见 `conventions.md` F1 组件复用三层。

### 目录结构示例（以 `shopping` 为参考）

```
shopping/
├── shopping-page.tsx              ← 主页面，Tabs 容器
├── shopping-page-data.ts          ← 页面数据层
├── queries.ts                     ← TanStack Query hooks
└── components/                    ← 子功能组件
    ├── overview/
    │   └── shopping-overview-tab.tsx
    ├── planning/
    │   ├── shopping-planning-tab.tsx
    │   └── shopping-item-edit-dialog.tsx
    ├── stages/
    │   ├── shopping-stages-tab.tsx
    │   ├── shopping-stage-edit-dialog.tsx
    │   └── shopping-stage-utils.ts
    ├── spaces/
    │   ├── shopping-spaces-tab.tsx
    │   └── shopping-space-edit-dialog.tsx
    ├── systems/
    │   ├── shopping-systems-tab.tsx
    │   └── shopping-system-edit-dialog.tsx
    └── attributes/
        ├── shopping-attributes-tab.tsx
        └── shopping-attribute-edit-dialog.tsx
```

> 旧结构中的 `_shared/`（模块内共享）已拆解：跨模块复用的提升到 `shared/`（如 `shopping-delete.ts` → `shared/shopping-delete.ts`），仅模块内复用的就地放在 `components/<sub>/` 下。

### 命名约定

- 文件命名格式：`<module>-<描述>.ts(x)`，用连字符（`-`）分隔
- 主页面：`<module>-page.tsx`
- 页面数据：`<module>-page-data.ts`
- 标签页：`<module>-<sub>-tab.tsx`
- 编辑弹窗：`<module>-<sub>-edit-dialog.tsx`
- 工具函数：`<module>-<sub>-utils.ts`

### 子功能（`<sub>`）命名

- 用业务概念命名，体现标签页的职责
- `shopping` 模块的 `<sub>` 示例：`overview`、`planning`、`stages`、`spaces`、`systems`、`attributes`
- `nutrition` 模块的 `<sub>` 示例：`overview`、`foods`、`recipes`、`logs`、`nutrients`、`daily-plan`
- 每个 `<sub>` 至少包含一个 `-tab.tsx` 文件，如有编辑操作则追加 `-edit-dialog.tsx`

---

## 三、前端 API（`src/features/bettertolive/api/`）

| 文件 | 职责 | 必要性 |
|---|---|---|
| `<module>-crud-api.ts` | 对 Tauri command 的封装调用，统一返回格式、错误处理 | 推荐 |

- 封装 `invoke("<command>", { ... })` 调用，从 `src/bindings.ts` 导入类型
- 统一处理 `Result<T, String>` 返回格式
- 示例：`shopping-crud-api.ts`、`beliefs-crud-api.ts`、`legacy-crud-api.ts`

---

## 四、前端 Queries（`src/features/bettertolive/<module>/queries.ts`）

| 内容 | 职责 | 必要性 |
|---|---|---|
| `queries.ts` 中的 `useMutation` / `useQuery` hook | 该模块的增删改查操作封装，处理缓存失效与乐观更新 | 推荐 |

- 每个 feature 在根目录下放一个 `queries.ts`，包含该模块所有 TanStack Query hooks
- mutation 命名：`useSave<Module>Mutation`（导出函数，驼峰式）
- query 命名：`use<Module>Query`（导出函数，驼峰式）
- queryKey 统一走 `queries/workspace-query-keys.ts`（`workspaceQueryKeys.<module>()`）
- mutation `onSuccess` 中同时失效 `snapshot()` + 该模块 key
- 全局共享的 query 文件（`workspace-query-keys.ts`、`use-workspace-snapshot-query.ts` 等）仍保留在 `queries/` 目录下

---

## 五、最小模块与完整模块

### 最小模块（简单 CRUD）

简单模块从最小集开始，只创建必须文件：

```
src-tauri/src/<module>/
├── mod.rs
├── commands.rs
└── seed.json

src/features/bettertolive/<module>/
├── <module>-page.tsx
└── queries.ts
```

### 完整模块（多子功能、复杂数据模型）

复杂模块逐步扩展，按需追加：

```
src-tauri/src/<module>/
├── mod.rs
├── commands.rs
├── dto.rs
├── db.rs
├── models.rs
├── repository.rs
└── seed.json

src/features/bettertolive/<module>/
├── <module>-page.tsx
├── <module>-page-data.ts
├── queries.ts
├── <module>-constants.ts         ← 跨子组件共享的常量/枚举/工具函数
└── components/
    ├── <sub1>/
    │   ├── <module>-<sub1>-tab.tsx
    │   └── <module>-<sub1>-edit-dialog.tsx
    └── <sub2>/
        ├── <module>-<sub2>-tab.tsx
        └── <module>-<sub2>-edit-dialog.tsx
```

---

## 六、原则

1. **按需创建，不提前建空文件**。从最小集开始，代码需要时才追加文件。

2. **命名一致性**：前后端使用相同模块名（如 `shopping`、`nutrition`、`legacy`），保持可追溯。

3. **先看同类**：新增模块前，先参考 `shopping` 或 `legacy` 模块的代码风格和分层方式——它们是当前代码库中最完整的模块实现。

4. **文件在需要时才拆分**：`_shared/` 和 `<sub>/` 目录不是必须的——只有当一个文件过大、或有明确的复用需求时才拆分。

5. **模块内共享优先就地**：仅一个子功能使用的组件/工具不放 `_shared/`，放在对应 `<sub>/` 目录下；两个及以上子功能使用时才提到 `_shared/`。