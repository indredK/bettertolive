# bettertolive 架构指南

> **给 AI 代理看的** — 写代码或重构前必读，这是系统架构的唯一真实来源。
>
> 阅读顺序：**§1（上下文）** → **§2（禁止项）** → **§3（分层）** → **§4–7（按需查阅细节）**

---

## §1 系统上下文

bettertolive 是一个 **local-first 桌面应用**，用于个人成长与生活管理。它不是 Web 应用，也不是移动应用——它是一个 Tauri v2 桌面应用。

| 属性 | 值 |
|------|-----|
| 技术栈 | React 19 + TypeScript + Vite + Tauri v2 (Rust) + Bun |
| 状态管理 | TanStack Query（服务端状态）+ Zustand（客户端 UI 状态） |
| 国际化 | i18next，中/英双语对等，19 个模块命名空间 |
| 数据库 | SQLite（rusqlite）+ JSON 文件双轨制 |
| 样式 | Tailwind CSS 4 + OKLCH 色彩空间 + 毛玻璃效果 |
| 动画 | Motion / Framer Motion + `LazyMotion` 按需加载 |
| 目标系统 | macOS 为主，跨平台为辅 |
| 包管理器 | Bun |

**两种数据存储模式**：
- **JSON Store 模式**：简单模块（beliefs / emotion / events / finance / future / growth / memory / overview / principles / reflection / relationships / socioeconomics / worldhistory / journey / nutrition）用 `tauri-plugin-store` + JSON 文件
- **SQLite 模式**：复杂关系型数据（shopping / legacy）用 `tauri-plugin-sql` + SQLite + rusqlite

**仓库结构**：`src/`（React/TS 前端）+ `src-tauri/src/`（Rust 后端）

---

## §2 🔴 AI 编码规则 — 禁止模式

这些规则优先级高于一切。违反会导致运行时 Bug 或 CI 被拒。详细规则见 `standards/conventions.md`，此处为最高优先级精简版。

1. **绝对不要把服务端数据塞进 zustand 维护副本** — 服务端数据归 TanStack Query；纯客户端 UI 状态（弹窗、草稿、选中项、本地偏好）才归 zustand / `useState`。
2. **绝对不要 `const store = useXxxStore()` 无 selector 订阅整 store 后再解构放进 hook 依赖** — 会导致 effect 无限重跑。action 用 `useXxxStore((s) => s.setFoo)` 按需订阅，多字段用 `useShallow`。
3. **绝对不要手写 `canSubmit` 校验逻辑** — 表单校验统一用 zod schema + `@hookform/resolvers`，规则集中在一处 schema。
4. **绝对不要 mutation 成功后漏 `invalidateQueries`** — 标准是同时失效 `snapshot()` + 该模块 key。漏掉会显示旧数据。
5. **绝对不要 mutation `onError` 静默无提示** — 失败必须 `toast.error` 给用户反馈。
6. **绝对不要在 JSX、toast、菜单里硬编码中/英文字符串** — 所有用户可见文案走 `t(...)`，不传第二个参数的内联默认文案。译文唯一存在于 locale JSON。
7. **绝对不要手写字符串拼 `className`** — 用 `cn()`（`clsx` + `tailwind-merge`）。
8. **绝对不要硬编码 `z-[N]` 魔法数字** — 用 `src/lib/ui-layers.ts` 的 `UI_LAYERS` 语义层级。
9. **绝对不要硬编码动画 `duration`/`ease` 魔法数字** — 复用 `src/lib/app-motion.ts` 语义常量。
10. **绝对不要用 `window.confirm` 原生确认框** — 删除统一走 `confirmUndoableDelete`（5 秒撤销窗口）。
11. **绝对不要改了 command 不跑 `generate:bindings`** — specta 是唯一事实来源，前端 `bindings.ts` 自动生成，不得手写修改。
12. **绝对不要在 command 路径上用 `.unwrap()` / `.expect()`** — 错误一律 `Result` 返回。
13. **绝对不要多步写操作不开事务** — 用 `write_tx` 包裹，`let mut conn` 可变借用。
14. **绝对不要半吊子乐观更新** — 要么完整四步（onMutate 快照+改缓存 → onError 回滚 → onSettled invalidate），要么别做，默认"成功 → invalidate 重拉"。

---

## §3 分层架构

### 3.1 分层地图

```
src/main.tsx                           # 启动入口
  └─ App.tsx                           # 外壳：QueryClient + LazyMotion + Splash + AppShell
      ├─ SplashScreen                  # 启动屏（节点生长动画）
      └─ BetterToLiveAppShell          # 主应用外壳
          ├─ SidebarNavigation         # 侧边栏（可折叠）
          ├─ WorkspaceView             # 主内容区
          │   └─ Feature Page          # 每个功能独立页面
          └─ WorkspaceUtilities        # 工具栏（主题/音乐/通知）

功能模块（src/features/bettertolive/<feature>/）：
  <feature>-page.tsx       → 页面视图（尽量薄，只 JSX + t()）
  <feature>-page-data.ts   → 页面数据层（Query 拼装 + 派生计算）
  queries.ts               → TanStack Query hooks（useQuery / useMutation）
  components/              → 功能私有 UI 组件
  <feature>-i18n.ts        → 模块内 i18n 辅助（可选）
  <feature>-constants.ts   → 模块内共享常量/枚举/工具函数

共享层：
  components/ui/           → shadcn/ui 基础组件 + 动画类
  components/content/      → 数据展示组件（VirtualGridView 等）
  lib/                     → 纯函数工具（cn / ui-layers / app-motion / query-client / id-utils ...）
  shared/                  → 跨模块共享逻辑
  hooks/                   → 全局共享 hooks
  i18n/                    → 国际化配置 + 翻译资源

API 边界层（src/features/bettertolive/api/）：
  bettertolive-api.ts      → 统一接口（live/fallback 切换）
  config.ts                → 能力检测 + 平台判断
  live/                    → 真实 Tauri 实现
  fallback/                → 空数据降级（浏览器模式）
  import-export/           → 导入导出 + 迁移 + 合并策略

Rust 后端（src-tauri/src/）：
  main.rs                  # 二进制入口
  lib.rs                   # Builder：插件 + 状态 + setup + invoke_handler + specta
  json_store.rs            # JSON Store 通用封装
  reset.rs                 # 数据重置
  <module>/                # 每个模块独立目录
    ├─ mod.rs              # 模块声明 + register_commands
    ├─ commands.rs         # #[tauri::command] 对外接口
    ├─ dto.rs              # DTO（serde + specta）
    ├─ db.rs               # 数据库初始化 + 迁移 + 种子数据（SQLite 模块）
    ├─ models.rs           # 数据库行模型（SQLite 模块）
    ├─ repository.rs       # 数据访问层（SQLite 模块）
    └─ seed.json           # 种子数据
```

### 3.2 数据流：用户操作 → UI 更新

```
用户点击
  → page.tsx handler 调用 mutation.mutate()
    → queries.ts 的 useSaveXxxMutation
      → api/live/<module>-crud-api.ts 封装的 invoke 调用
        → Rust 的 #[tauri::command] 函数
          → repository 或直接 DB 操作
          → write_tx 事务（多步写）
          → 返回 Result<T, AppError>
        ← specta 自动生成类型
      ← onSuccess: invalidateQueries([snapshot(), moduleKey])
    ← Query 缓存失效 → 自动重拉
  ← React 重渲染
```

### 3.3 状态流：数据 → UI

```
Rust（SQLite / JSON 文件）
  → IPC JSON 序列化（serde + specta）
  → 前端类型化 DTO（bindings.ts 自动生成）
  → TanStack Query 缓存
  → page-data.ts 派生计算（筛选/排序/聚合）
  → 组件渲染
```

### 3.4 状态归属原则

| 数据类型 | 归属 | 理由 |
|----------|------|------|
| 服务端数据（DB/文件里的） | TanStack Query | 唯一真相来源，自动缓存/失效/重拉 |
| 弹窗开关、草稿、选中项、本地偏好 | zustand / useState | 纯客户端 UI 状态 |
| URL 状态（当前 Tab、筛选参数） | URL search params / 组件 state | 可分享、可刷新恢复 |
| 表单输入状态 | react-hook-form | 表单专用状态管理 |

---

## §4 IPC 契约系统（Specta）

IPC 层是架构的核心。通过 `specta` 自动同步 TS ↔ Rust 边界，**Rust 端是唯一事实来源**。

### 4.1 契约链路

```
Rust 端：
  #[derive(Type)] + #[specta::specta]  — 类型来源
  ↓
tauri_specta::Builder::new().commands(...)
  ↓
bun run generate:bindings
  ↓
src/bindings.ts  — 自动生成，前端不得手动修改
```

### 4.2 新增命令（检查清单）

- [ ] Rust：在 `<module>/commands.rs` 加 `#[tauri::command]` + `#[specta::specta]`
- [ ] Rust：在 `lib.rs` 的 `collect_commands!` 和 `generate_handler!` 都注册
- [ ] Rust：如果是 SQLite 模块，在 `mod.rs` 的 `register_commands` 注册
- [ ] 运行 `bun run generate:bindings` 刷新 `src/bindings.ts`
- [ ] 前端：在 `api/live/` 或对应模块加封装函数
- [ ] 前端：在 `queries.ts` 加 useQuery / useMutation
- [ ] 前端：更新 fallback 实现（如有）

---

## §5 目录源码地图（供 AI 文件导航用）

### 5.1 前端（src/）

```
src/
├── App.tsx                          # 外壳：QueryClient + LazyMotion + Splash + AppShell
├── main.tsx                         # 启动入口
├── bindings.ts                      # specta 自动生成的 IPC 类型（只读）
├── components/
│   └── ui/                          # shadcn/ui 基础组件 + 动画类（20+）
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       ├── table.tsx
│       ├── multi-select.tsx
│       ├── transfer-list.tsx
│       ├── animated-visibility.tsx  # 动画可见性封装（内置 reduced-motion 兜底）
│       ├── error-boundary.tsx       # 错误边界
│       └── liquid-glass.tsx         # 毛玻璃效果
├── features/
│   └── bettertolive/                # 主功能域（单域架构，所有功能归于此）
│       ├── api/                     # API 边界层
│       │   ├── bettertolive-api.ts  # 统一接口（live/fallback 切换）
│       │   ├── config.ts            # 能力检测
│       │   ├── live/                # 真实 Tauri 实现
│       │   ├── fallback/            # 空数据降级
│       │   └── import-export/       # 导入导出 + 迁移 + 合并策略
│       ├── shell/                   # 外壳层
│       │   ├── app-shell.tsx
│       │   ├── sidebar-navigation.tsx
│       │   ├── settings-dialog.tsx
│       │   └── splash-screen.tsx
│       ├── stores/                  # 客户端状态（zustand）
│       │   ├── locale-store.ts
│       │   └── workspace-ui-store.ts
│       ├── queries/                 # 全局 Query
│       │   ├── workspace-query-keys.ts
│       │   └── use-workspace-snapshot-query.ts
│       ├── models/                  # 业务模型转换
│       ├── hooks/                   # 全局 hooks
│       ├── shared/                  # 跨模块共享 UI/逻辑
│       ├── workspace-utilities/     # 工具栏（主题/音乐/通知）
│       └── <feature>/               # 19 个功能模块
│           ├── <feature>-page.tsx
│           ├── <feature>-page-data.ts
│           ├── queries.ts
│           └── components/
├── lib/
│   ├── utils.ts                     # cn() 等
│   ├── ui-layers.ts                 # z-index 语义层级
│   ├── app-motion.ts                # 动画语义常量
│   ├── query-client.ts              # QueryClient 工厂
│   ├── id-utils.ts                  # 统一 ID 生成
│   ├── list-utils.ts                # 列表拆分/合并/去重
│   └── graph-tokens.ts              # 图谱着色令牌读取器
├── i18n/
│   ├── config.ts                    # i18next 初始化
│   └── locales/
│       ├── zh/                      # 中文（19 个模块文件）
│       └── en/                      # 英文（19 个模块文件）
├── styles/
│   └── globals.css                  # 全局样式 + OKLCH 主题 + CSS 变量
├── shared/
│   └── version.ts
├── test/
│   └── setup.ts
└── types/
    └── three.d.ts
```

### 5.2 Rust 后端（src-tauri/src/）

```
src-tauri/src/
├── main.rs                          # 二进制入口
├── lib.rs                           # Builder + 插件 + 状态 + setup + invoke_handler + specta
├── json_store.rs                    # JSON Store 通用封装
├── reset.rs                         # 数据重置为种子数据
├── shopping/                        # SQLite 复杂模块（标杆）
│   ├── mod.rs
│   ├── commands.rs
│   ├── db.rs                        # 建表 + 迁移 + 种子数据
│   ├── models.rs                    # 数据库行模型
│   ├── repository.rs                # 数据访问层
│   ├── dto.rs
│   └── initial.json
├── legacy/                          # SQLite 模块
│   ├── mod.rs
│   ├── commands.rs
│   ├── db.rs
│   ├── models.rs
│   ├── repository.rs
│   ├── dto.rs
│   └── initial.json
├── beliefs/                         # JSON Store 简单模块（典型）
│   ├── mod.rs
│   ├── commands.rs
│   ├── dto.rs
│   └── initial.json
├── nutrition/                       # JSON Store 模块
│   ├── mod.rs
│   ├── commands.rs
│   └── initial.json
├── emotion/ events/ finance/ future/ growth/
├── journey/ memory/ overview/ principles/
├── reflection/ relationships/ socioeconomics/
└── worldhistory/                    # 共 17 个 JSON Store 模块
```

---

## §6 错误处理策略

### 6.1 错误流

```
Rust：Result<T, Error>（thiserror enum）
  → serde 序列化跨 IPC
  → 前端 catch 收到错误
  → mutation onError 捕获
  → toast.error 给用户反馈（i18n）
```

### 6.2 分工原则

| 层级 | 错误处理方式 |
|------|-------------|
| Rust command | 用 `thiserror` 定义类型化错误，返回 `Result`，永不 panic |
| 前端 API 封装 | 统一解析错误形状，向上抛出 |
| TanStack Query | `onError` 给 toast 反馈；`isError` 驱动组件内错误 UI |
| React ErrorBoundary | 捕获渲染期意外错误，提供兜底 UI + 重试 |
| 弹窗编辑 | 失败不关闭弹窗，保持打开让用户重试 |

---

## §7 配置文件地图

| 文件 | 用途 |
|------|------|
| `tauri.conf.json` | Tauri 窗口、包、更新器、CSP、capabilities |
| `vite.config.ts` | Vite 插件、别名、构建分包 |
| `tsconfig.json` | TypeScript 配置、`@/` 别名 |
| `package.json` | 脚本、依赖、bun 配置 |
| `components.json` | shadcn/ui 配置 |
| `deny.toml` | cargo deny 安全扫描配置 |
| `.release-please-manifest.json` | Release Please 自动版本号 |
| `eslint.config.js` | ESLint 配置 |
| `prettier.config.mjs` | Prettier 配置（含 Tailwind 类排序） |
| `commitlint.config.cjs` | Conventional Commits 校验 |
| `vitest.config.ts` | Vitest 测试配置 |
