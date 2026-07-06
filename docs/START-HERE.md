# 新人导航 Start Here

> **给刚加入 bettertolive 项目的开发者（和 AI）** — 一页纸告诉你从哪开始读、按什么顺序、哪些是重点。
>
> **阅读顺序**：按本文档的序号读，不要跳。

---

## 第 0 步：先读这个

1. **`README.md`**（项目根目录）— 项目简介、快速开始
2. **`AGENTS.md`**（项目根目录）— AI 操作总入口（三步铁律 + 工作流路由）

---

## 第 1 步：搞懂架构（20 分钟）

> 读这些，建立全局认知。

1. **`docs/ARCHITECTURE.md`** — 架构总览
   - §1 系统上下文（技术栈、数据存储模式）
   - §2 🔴 禁止模式（**必须记住，写代码时不能碰**）
   - §3 分层架构（图 + 数据流）
   - §5 目录源码地图（导航用）

2. **`docs/DECISIONS.md`** — 方向性决策
   - 知道"为什么这么设计"，避免走回头路

---

## 第 2 步：编码规范（边写边查）

> 不用背，但写代码前要知道有这些规则，违规了 Lint/CI 会挂。

1. **`docs/standards/conventions.md`** — 编码规范（核心）
   - §1 前端工程（TS / 样式 / 动画 / 表单 / 交互模式）
   - §2 后端工程（Rust / SQLite / JSON Store / IPC / 事务 / 迁移 / 测试）

2. **`docs/standards/module-organization.md`** — 模块组织模板
   - 新增模块时照着套

3. **`docs/standards/testing-standards.md`** — 测试规范

4. **`docs/standards/review-scope.md`** — 审查边界
   - 知道什么算 bug、什么是偏好，审查时的三档分级

---

## 第 3 步：开发流程（动手前）

> 知道一个 feature / fix 从开始到提交的完整路径。

1. **`docs/development-workflow.md`** — 开发流程
   - 需求理解 → 方案设计 → 编码实现 → 自测验证 → 代码提交 → 文档同步

2. **`docs/AI-WORKFLOWS.md`** — AI 工作流
   - `/review` / `/fix` / `/doc` / `/feature` 四种模式怎么运作

---

## 第 4 步：路线图（知道大方向）

1. **`docs/ROADMAP.md`** — 全局路线图
   - 当前在哪个阶段、下一步是什么

2. **`docs/modules/README.md`** — 模块索引
   - 各模块文档入口

---

## 快速参考（写代码时查）

### 前端开发

| 找什么 | 去哪找 |
|--------|--------|
| 基础 UI 组件 | `src/components/ui/` |
| 功能模块 | `src/features/bettertolive/<feature>/` |
| Query hooks | 模块内 `queries.ts` |
| 页面数据层 | 模块内 `<feature>-page-data.ts` |
| 工具函数 | `src/lib/` |
| 动画常量 | `src/lib/app-motion.ts` |
| z-index 层级 | `src/lib/ui-layers.ts` |
| i18n 翻译 | `src/i18n/locales/{zh,en}/` |
| IPC 类型绑定 | `src/bindings.ts`（自动生成，只读） |
| API 封装 | `src/features/bettertolive/api/` |
| 全局 stores | `src/features/bettertolive/stores/` |

### 后端开发（Rust）

| 找什么 | 去哪找 |
|--------|--------|
| 命令注册 | `src-tauri/src/lib.rs` |
| 模块目录 | `src-tauri/src/<module>/` |
| 数据库初始化 | 模块内 `db.rs` |
| 数据访问层 | 模块内 `repository.rs` |
| 命令实现 | 模块内 `commands.rs` |
| DTO 类型 | 模块内 `dto.rs` |
| 数据库模型 | 模块内 `models.rs` |
| 种子数据 | 模块内 `initial.json` |

### 常用命令

```bash
bun dev                      # 前端开发
bun run tauri dev            # Tauri 开发模式
bun run lint                 # Lint
bun run typecheck            # 类型检查
bun test                     # 测试
bun run generate:bindings    # 生成 specta 绑定
cargo check                  # Rust 编译检查
cargo clippy                 # Rust 代码质量
cargo test                   # Rust 测试
```

---

## 标杆模块（照着写）

- **shopping** — SQLite 复杂模块的标杆（db / models / repository / commands / dto 全套）
- **beliefs** — JSON Store 简单模块的典型

写新模块时，先把标杆模块读一遍，照着结构写。

---

## 🔴 最容易犯的错（新人高频踩坑）

1. **把服务端数据塞 zustand** — 用 TanStack Query
2. **`const store = useXxxStore()` 无 selector** — 按需订阅，多字段用 `useShallow`
3. **硬编码中文字符串** — 所有文案走 `t()`
4. **mutation 成功后忘 invalidateQueries** — 记得失效 snapshot + 模块 key
5. **mutation onError 静默** — 失败要 toast.error
6. **改了 Rust command 不跑 generate:bindings** — specta 是唯一事实来源
7. **多步写操作不开事务** — 用 write_tx
8. **手写 className 字符串拼接** — 用 cn()
9. **硬编码 z-index / 动画 duration** — 用语义常量
10. **用 window.confirm** — 删除用 confirmUndoableDelete

---

## 遇到问题怎么办

1. 先查本文档的"快速参考"
2. 再查 `standards/conventions.md`
3. 看标杆模块怎么写的
4. 查 `docs/bugs/` 里有没有已知问题
5. 问人
