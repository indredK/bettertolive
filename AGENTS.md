# bettertolive — AI 总入口

> **你是 AI 工具？从这里开始。** 本文件是 AI 操作 bettertolive 项目的唯一逻辑入口——无论你从哪个工具文件（`.cursorrules` / `.trae/rules/` / `.github/copilot-instructions.md` / `.claude/CLAUDE.md` / `.codebuddy/rules/` / …）进来，最终都必须回到这里。
>
> **入口 vs 优先级（两件事，不矛盾）**：
>
> - **入口顺序**：所有工具 → `AGENTS.md`（从哪开始读）。
> - **裁决优先级**：内容冲突时 `.cursorrules > AGENTS.md > docs/*.md`（谁说了算）。
> - 一句话：`AGENTS.md` 是"门"，`.cursorrules` 是"最高法律"。

---

## 三步铁律（动手前必做）

1. **你现在读的这个文件 `AGENTS.md` 就是唯一起点**——读完它再动手。
2. **动手前必读清单**（按此顺序，给全路径）：
   - [ ] `.cursorrules` — 行为约束（最高优先级）
   - [ ] `docs/ARCHITECTURE.md §2` — 🔴 禁止模式（不可触犯）
   - [ ] `docs/standards/conventions.md` — 编码规范（强制/建议）
   - [ ] `docs/standards/review-scope.md` — 审查边界（什么算 bug、何时停）
   - [ ] `docs/AI-WORKFLOWS.md` — 工作流定义
3. **按下方关键词路由表进 workflow**；**判断不了就停下问人**，不许猜。

---

## 工作流路由

| 指令关键词                      | 路由到                            |
| ------------------------------- | --------------------------------- |
| review / 审查 / 审计 / 检查代码 | `docs/AI-WORKFLOWS.md → /review`  |
| fix / 修复 / 改 bug / 修 bug    | `docs/AI-WORKFLOWS.md → /fix`     |
| doc / 文档 / 更新文档 / 对齐    | `docs/AI-WORKFLOWS.md → /doc`     |
| feature / 新功能 / 开发 / 实现  | `docs/AI-WORKFLOWS.md → /feature` |

**始终遵守**：

- 编码规范：`docs/standards/conventions.md`（前端 + 后端 + 动画三大部分）
- 审查边界：`docs/standards/review-scope.md`（三档分级，只报第一+第二档）
- 模块组织：`docs/standards/module-organization.md`（新增模块模板）
- 测试规范：`docs/standards/testing-standards.md`

**文档组织**：

- 全局规范：`docs/standards/`（conventions / review-scope / module-organization / testing-standards）
- 模块文档：`docs/modules/<id>/`（每个功能模块独立目录）
- 横切设计：`docs/` 根目录（data-reset-design / import-export-design / refactor-goals / version-management）
- 审计报告：`docs/bugs/`

---

## 项目快速参考

| 项目     | 值                                             |
| -------- | ---------------------------------------------- |
| 类型     | Tauri v2 桌面应用（local-first）               |
| 前端     | React 19 + TypeScript + Vite + Bun             |
| 样式     | Tailwind CSS 4 + OKLCH 色彩空间                |
| 状态管理 | TanStack Query（服务端）+ Zustand（客户端 UI） |
| 动画     | Motion / Framer Motion                         |
| 数据库   | SQLite（rusqlite）+ JSON 文件双轨制            |
| IPC 契约 | specta 自动生成，Rust 是唯一事实来源           |
| 表单     | react-hook-form + zod                          |
| 国际化   | i18next，中/英双语，19 个模块命名空间          |
| 测试     | Vitest + Testing Library + happy-dom           |
| 模块数   | 19 个功能模块                                  |
