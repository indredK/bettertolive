# 开发流程 Development Workflow

> **给谁看** — 开发者 + AI 代理。定义从需求到提交的完整工作流。
>
> **配套文档**：
> - 编码规范：`standards/conventions.md`
> - 模块组织：`standards/module-organization.md`
> - 测试规范：`standards/testing-standards.md`
> - AI 工作流：`AI-WORKFLOWS.md`

---

## 开发周期（一个 feature / fix 的生命周期）

```
需求理解 → 方案设计 → 编码实现 → 自测验证 → 代码提交 → 文档同步
```

---

## 1. 需求理解

**做什么**：搞清楚要做什么、为什么做、做到什么程度算完。

**检查清单**：
- [ ] 已读 `docs/ROADMAP.md`，确认该需求在当前阶段范围内
- [ ] 已读 `docs/DECISIONS.md`，确认没有方向性冲突
- [ ] 已读对应模块的 `docs/modules/<id>/roadmap.md`
- [ ] 需求边界明确：做什么 / 不做什么
- [ ] 验收标准可衡量

**不确定时**：问人，不要猜。

---

## 2. 方案设计

**做什么**：在动手写代码前，想清楚怎么实现。

**什么时候需要写设计稿**：
- 新增 IPC 命令
- 新增数据表 / 大改表结构
- 跨模块大改动
- 引入新依赖 / 新技术
- 影响架构的改动

**设计稿放哪**：`docs/` 下，命名 `<feature>-design.md`

**简单改动**：不需要正式设计稿，但心里要有数。

---

## 3. 编码实现

### 3.1 前端开发

**标准流程**：
1. 先看已有模块的写法（如 shopping / legacy），保持风格一致
2. 按模块组织模板建文件：`standards/module-organization.md`
3. 数据层优先：queries → page-data → page
4. 写完一个模块跑一次类型检查

**必须遵守**：
- 禁止模式：`docs/ARCHITECTURE.md §2`
- 编码规范：`docs/standards/conventions.md`
- i18n：所有用户可见文案走 `t()`，不传 default value

### 3.2 后端开发（Rust）

**标准流程**（SQLite 模块）：
1. 先建 `db.rs`：表结构 + 迁移 + 种子数据
2. 再建 `models.rs`：数据库行模型
3. 再建 `repository.rs`：数据访问层
4. 再建 `dto.rs`：对外 DTO
5. 最后 `commands.rs`：#[tauri::command] 接口
6. 注册到 `lib.rs` 的 `collect_commands!` 和 `generate_handler!`
7. 跑 `bun run generate:bindings` 生成前端类型

**JSON Store 简单模块**：
1. `dto.rs` + `commands.rs` + `initial.json`
2. 注册到 `lib.rs`
3. 跑 `bun run generate:bindings`

**必须遵守**：
- 错误用 `Result`，不用 `.unwrap()` / `.expect()`
- 多步写操作开事务
- specta 类型标注完整

---

## 4. 自测验证

**必跑命令**：
```bash
bun run lint          # ESLint + Prettier
bun run typecheck     # TypeScript 类型检查
bun test              # 单元测试
```

**有 Rust 改动时**：
```bash
cargo check
cargo clippy -- -D warnings
cargo test
```

**IPC 改动必跑**：
```bash
bun run generate:bindings
```

**人工自测**：
- 功能走一遍主流程
- 测试边界情况（空数据、错误输入、网络异常）
- 切换中英文看看有没有硬编码
- 切换深色模式看看样式

---

## 5. 代码提交

### 5.1 提交规范

遵循 Conventional Commits：

| 类型 | 用途 |
|------|------|
| `feat:` | 新功能 |
| `fix:` | Bug 修复 |
| `docs:` | 文档更新 |
| `refactor:` | 重构（不改功能） |
| `perf:` | 性能优化 |
| `test:` | 测试相关 |
| `chore:` | 构建/工具/依赖 |
| `style:` | 样式/格式（不影响逻辑） |

**格式**：
```
<type>(<scope>): <subject>

<body 可选>
```

**例子**：
```
feat(shopping): add item reorder support
fix(beliefs): fix crash when deleting last entry
docs: update ARCHITECTURE.md with shopping module details
```

### 5.2 提交原则

- 每个提交做一件事
- 提交信息说清楚"为什么"，不只是"改了什么"
- 不把无关改动塞到同一个提交
- 不提交 node_modules / dist / .env 等产物

---

## 6. 文档同步

**每次提交后检查**：
- [ ] 新功能是否有对应模块文档（`docs/modules/<id>/`）
- [ ] roadmap  checkbox 是否更新
- [ ] 如果是方向性决策，是否追加到 `docs/DECISIONS.md`
- [ ] 如果架构有变更，是否更新 `docs/ARCHITECTURE.md`
- [ ] 如果有新约定，是否更新 `docs/standards/conventions.md`

---

## 常用命令速查

| 命令 | 用途 |
|------|------|
| `bun install` | 安装依赖 |
| `bun dev` | 启动开发服务器（前端） |
| `bun run tauri dev` | 启动 Tauri 开发模式 |
| `bun run build` | 构建前端 |
| `bun run tauri build` | 构建桌面应用 |
| `bun run lint` | Lint 检查 |
| `bun run typecheck` | 类型检查 |
| `bun test` | 运行测试 |
| `bun run generate:bindings` | 生成 specta 类型绑定 |
| `cargo check` | Rust 编译检查 |
| `cargo clippy` | Rust 代码质量检查 |
| `cargo test` | Rust 测试 |
