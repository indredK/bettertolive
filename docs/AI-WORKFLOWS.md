# bettertolive AI Workflows

> **AI 操作手册** — 本文档定义了 AI 在 bettertolive 项目中的四种工作模式。
>
> 入口：由 `AGENTS.md` 根据用户指令路由到对应 workflow。
>
> 所有 workflow 执行前必须先读取：
> 1. `docs/ARCHITECTURE.md` §2（禁止模式）
> 2. `docs/standards/conventions.md`（编码规范）
> 3. `docs/standards/review-scope.md`（审查边界）
> 4. `docs/development-workflow.md`（开发流程）
> 5. `docs/bugs/` 下最新审计报告（避免重复标记）
> 6. `.cursorrules`（行为约束）

---

## /review — AI 代码审查

**触发条件**：用户要求 review / 审查 / 审阅代码，或提交 PR。

### 执行步骤

1. **读取上下文**
   - 如果是 commit/PR review：`git diff <range>` 获取改动
   - 如果是文件 review：读取指定文件
   - 如果是全量审计：参照 `standards/review-scope.md` 三档分级，只报第一+第二档

2. **审查维度**（按优先级）
   - 🔴 **第一档（必须修）**：对照 `standards/conventions.md` 逐节检查
     - i18n 硬编码文案（§2.2）
     - zustand 无 selector 订阅整 store 进 hook 依赖（§2.3）
     - mutation 漏 `invalidateQueries`（§3.2）
     - mutation `onError` 静默无提示（§3.2）
     - IPC 命令改动不跑 `generate:bindings`（§3.3）
     - `.unwrap()` / `.expect()` 在 command 路径上（§3.3）
     - 多步写操作不开事务（§3.4）
     - 危险操作无确认/撤销窗口（§2.5）
   - 🟡 **第二档（尽量修）**：架构违规 + 性能隐患
     - 服务端数据塞 zustand 维护副本
     - 手写 `className` 字符串拼接（不用 `cn()`）
     - 手写 `canSubmit` 校验逻辑（不用 zod schema）
     - 硬编码 `z-[N]` 魔法数字（不用 `UI_LAYERS`）
     - 硬编码动画 `duration`/`ease` 魔法数字
   - 🟢 **第三档（看情况，默认不报）**：风格建议、注释优化、命名微调

3. **输出格式**
   ```
   [§X] 文件路径:行号 — 问题描述 — 修改建议 — **强制/建议**
   ```

4. **特殊规则**
   - 跳过 `docs/bugs/` 中已有记录且状态为"不修复"的项
   - 发现新违规时，先报告不擅自修改
   - 不确定的问题先问人，不许猜

5. **结果落盘**（防跨会话遗忘）
   - 将本次审查发现写入 `docs/bugs/` 下对应审计报告
   - 每次审查追加一个子节，格式：
     ```
     ### YYYY-MM-DD — <审查范围：commit/PR/文件/全量>
     - [§X] `文件路径:行号` — 问题描述 — 修改建议 — **强制/建议** — 状态：已报告/已修复/不修复
     ```
   - 无违规时也记一笔 `### YYYY-MM-DD — <范围> — ✅ 无违规`，避免下次重复审查
   - 如果审查发现的违规已由 `/fix` 修复，在对应行尾追加 `✅ 已修复`

### ⛔ 完成前自检

- [ ] 已对照 `ARCHITECTURE.md` §2 + `standards/conventions.md` 逐节检查
- [ ] 已跳过已有"不修复"记录的项
- [ ] 输出格式符合 `[§X] 文件路径:行号 — 问题描述 — 修改建议 — **强制/建议**`
- [ ] 发现新违规时先报告，未擅自修改
- [ ] **审查结果已写入 `docs/bugs/` 审计报告**（无违规也记一笔）
- [ ] 遇到任何不确定，已停下问用户

---

## /fix — AI 自动修复（含 Bug 修复）

**触发条件**：用户要求 fix / 修复 / 改 bug。

### 执行步骤

1. **问题确认**
   - 复现或理解问题：读取相关代码 + 测试
   - 确认影响范围（单文件 / 跨模块 / IPC 边界）
   - 检查已有测试：`bun test`（或对应测试命令）

2. **修复编码**
   - 每项修改对照 `standards/conventions.md` 和 `ARCHITECTURE.md` §2
   - 同一自然文件的多个紧耦合问题可一次性修复
   - 涉及复杂重构时，只输出方案描述供人工确认

3. **验证**
   ```bash
   bun run lint          # ESLint + Prettier
   bun run typecheck     # TypeScript 类型检查
   bun test              # 测试
   ```
   如有 Rust 改动：
   ```bash
   cargo check
   cargo clippy -- -D warnings
   ```

4. **更新文档**
   - 如果修复涉及 roadmap 项 → 勾选 `docs/modules/<id>/roadmap.md`
   - 如果修复涉及已知 bug → 更新 `docs/bugs/` 中记录
   - 在审计报告问题行尾追加 `✅ 已修复`

5. **提交**（仅当用户明确要求时）
   - 每个违规项独立 commit
   - 格式：`fix(<scope>): <描述>`
   - 只 stage 与本次修复直接相关的文件
   - 不推送

### ⛔ 完成前自检

- [ ] 已对照 `ARCHITECTURE.md` §2 禁止模式
- [ ] `bun run lint` 通过
- [ ] `bun run typecheck` 通过
- [ ] `bun test` 通过
- [ ] 有 Rust 改动则 `cargo clippy -- -D warnings` 通过
- [ ] 已回写 roadmap / bugs 文档 / 审计报告
- [ ] commit 仅 stage 相关文件，未 `git add .`，未 push
- [ ] 遇到任何不确定，已停下问用户

---

## /doc — AI 文档演进

**触发条件**：用户要求 doc / 文档 / 更新文档 / 对齐文档。

### 执行步骤

1. **读取现状**
   - 打开 `docs/modules/README.md` 确认模块索引
   - 打开目标模块 `docs/modules/<id>/README.md` + `roadmap.md`

2. **文档同步检查**
   - `roadmap.md` checkbox 与实际功能是否一致
   - 新增 feature 是否有对应 `docs/modules/<id>/` 目录
   - 引用链接是否有效
   - `standards/conventions.md` 中的约定是否过时

3. **更新文档**
   - roadmap：已实现功能从 Backlog 移除，未实现的保留
   - README：更新索引和状态
   - ARCHITECTURE.md：如果有架构变更
   - conventions.md：如果有新约定沉淀
   - **DECISIONS.md：若本次对话确定了方向性取舍（改主题、砍功能、选方案），追加一条 `D-NNN`**

4. **验证**
   - 检查 `docs/` 下所有跨文件链接有效
   - 确认 `docs/modules/README.md` 的模块列表与 `src/features/bettertolive/` 对齐
   - 确认文档路径无空壳跳转 stub

### ⛔ 完成前自检

- [ ] `roadmap.md` checkbox 与实际功能一致
- [ ] `docs/modules/README.md` 模块列表与 `src/features/bettertolive/` 对齐
- [ ] 所有跨文件链接有效
- [ ] 方向性取舍已追加 `D-NNN` 到 `DECISIONS.md`
- [ ] 遇到任何不确定，已停下问用户

---

## /feature — AI 功能研发

**触发条件**：用户要求开发新功能 / 新模块。

### 执行步骤

1. **需求理解**
   - 读取 `docs/ROADMAP.md` 确认当前主题
   - 读取 `docs/DECISIONS.md` 确认相关方向性决策（避免重做已被推翻的方案）
   - 读取对应 `docs/modules/<id>/roadmap.md` 确认 backlog 项
   - 如果无对应模块：参照 `standards/module-organization.md` 模板创建

2. **设计（大改需要）**
   - 涉及 IPC 新命令 / 新数据表 / 跨模块大改动时先写设计稿
   - 设计稿放 `docs/` 下对应位置，命名 `<feature>-design.md`

3. **编码**

   新 feature 默认前端结构：
   ```
   src/features/bettertolive/<feature>/
   ├── <feature>-page.tsx        # 页面视图（尽量薄）
   ├── <feature>-page-data.ts    # 页面数据层（Query 拼装 + 派生计算）
   ├── queries.ts                # TanStack Query hooks
   ├── components/               # 功能私有 UI 组件
   ├── <feature>-i18n.ts         # 模块内 i18n 辅助（可选）
   └── <feature>-constants.ts    # 模块内共享常量/枚举/工具函数
   ```

   新 feature 默认 Rust 结构（SQLite 模块）：
   ```
   src-tauri/src/<module>/
   ├── mod.rs                    # 模块声明 + register_commands
   ├── commands.rs               # #[tauri::command] 对外接口
   ├── dto.rs                    # DTO（serde + specta）
   ├── db.rs                     # 数据库初始化 + 迁移 + 种子数据
   ├── models.rs                 # 数据库行模型
   └── repository.rs             # 数据访问层
   ```

   JSON Store 简单模块：
   ```
   src-tauri/src/<module>/
   ├── mod.rs
   ├── commands.rs
   ├── dto.rs
   └── initial.json
   ```

4. **IPC 契约注册**（如适用）
   - Rust 端加 `#[tauri::command]` + `#[specta::specta]`
   - 在 `lib.rs` 的 `collect_commands!` 和 `generate_handler!` 注册
   - 运行 `bun run generate:bindings` 刷新 `src/bindings.ts`
   - 前端在 `api/live/` 加封装函数
   - 前端在 `queries.ts` 加 useQuery / useMutation
   - 更新 fallback 实现

5. **国际化**
   - `src/i18n/locales/zh/<feature>.json` 中文翻译
   - `src/i18n/locales/en/<feature>.json` 英文翻译
   - 确保两侧 key 集合一致

6. **测试**
   - 纯函数工具：Vitest 单元测试
   - 复杂业务逻辑：单元测试覆盖边界
   - UI 组件：不强制，核心交互优先
   - 运行 `bun test` 确保不破坏现有测试

7. **文档**
   - 创建 `docs/modules/<id>/README.md`
   - 创建 `docs/modules/<id>/roadmap.md`
   - 更新 `docs/modules/README.md` 索引

### ⛔ 完成前自检

- [ ] 已对照 `standards/module-organization.md` 模板
- [ ] IPC 命令已跑 `generate:bindings`
- [ ] i18n 中/英 key 集合一致
- [ ] `bun run lint` + `bun run typecheck` + `bun test` 通过
- [ ] 有 Rust 改动则 `cargo clippy -- -D warnings` 通过
- [ ] 模块文档已创建并加入索引
- [ ] 遇到任何不确定，已停下问用户
