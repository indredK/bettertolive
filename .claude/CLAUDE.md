# CLAUDE.md

本文件是 bettertolive 项目的共享上下文，所有 subagent 与会话都会继承。只放硬约定，保持精简。

## 项目简介

bettertolive 是一个 **local-first 的 Tauri 桌面应用**——把日常记录、内在整理、关系梳理和未来规划放在同一工作台里的个人生活系统。数据存本地。

## 技术栈

- Tauri 2（Rust 后端，`src-tauri/`）
- React 19 + TypeScript（前端，`src/`）
- Vite / Tailwind CSS 4
- Bun 作为运行时与包管理器
- TanStack Router / Query，base-ui + radix-ui，dnd-kit

## 关键命令

| 命令                        | 用途                                          |
| --------------------------- | --------------------------------------------- |
| `bun run dev`               | 仅启动 Vite 前端（纯 UI/路由开发，最快）      |
| `bun run start`             | 启动完整 Tauri 桌面应用（涉及 Rust 命令时用） |
| `bun run lint`              | ESLint（`--max-warnings=0`，零容忍）          |
| `bun run typecheck`         | `tsc --noEmit`                                |
| `bun run test`              | Vitest                                        |
| `bun run generate:bindings` | 从 Rust 命令刷新 `src/bindings.ts`            |
| `bun run check:rust`        | rustfmt + clippy + cargo check                |
| `bun run fix:precommit`     | 提交前自动修复（ESLint/Prettier）             |
| `bun run check:precommit`   | 完整严格 pre-commit 门控                      |
| `bun run changeset`         | 为下次发布写一条版本记录                      |

## 硬约定（必须遵守）

1. **包管理器是 bun**——不要用 npm / pnpm / yarn。仓库有 `bun.lock` 与 `.bunfig.toml`。
2. **代码注释用中文，命名（变量/函数/类型）用英文。**
3. **新增或修改 Tauri command 后，必须运行 `bun run generate:bindings`** 刷新 `src/bindings.ts`，否则前后端类型漂移会导致隐性 bug。
4. **提交前**走 `bun run fix:precommit` → `bun run check:precommit`；改了 Rust 还要 `bun run check:rust`。
5. **不擅自 `git commit`**——提交动作由用户确认。
6. **功能按 `src/features/<模块>/` 自包含组织**，典型子目录：`api/ config/ hooks/ models/ queries/ stores/ ui/ types.ts`。新功能优先放进对应模块、复用现有模式，不另起炉灶。

## 现有功能模块

总览、反思、记事、记账、购物、饮食、情绪情感、观念、原则、关系深化、成长记忆、生命整理、社会经济、未来。
对应 Rust 侧模块见 `src-tauri/src/`（beliefs/emotion/events/finance/future/growth/legacy/memory/nutrition/overview/principles/reflection/relationships/shopping/socioeconomics）。

## 开发流水线

本项目用一套 **spec 驱动 + 专职 subagent** 的流水线开发新功能：

- 入口命令：`/feature <一句话需求>`，按「需求 → 方案 → 评估 → 开发 → 质量门」逐阶段推进，并在关键节点停下等你确认。
- 每个需求的产物落在 `specs/<slug>/`（spec.md / design.md / review.md / progress.md），随代码进 git。
- 各阶段 subagent 在 `.claude/agents/`，也可脱离 `/feature` 单独调用。
- 详见 `specs/README.md`。
